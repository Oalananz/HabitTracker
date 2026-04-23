import { supabase } from '../supabase';
import type { Database } from '../database.types';

type JourneyRow = Database['public']['Tables']['recovery_journeys']['Row'];
type FailureRow = Database['public']['Tables']['failure_logs']['Row'];

// =====================================================
// Recovery Journeys
// =====================================================

export async function getJourneys(userId: string) {
  const { data: journeys, error } = await supabase
    .from('recovery_journeys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const journeyRows = journeys || [];
  if (journeyRows.length === 0) return [];

  const journeyIds = journeyRows.map((journey) => journey.id);

  const { data: failureRows, error: failureError } = await supabase
    .from('failure_logs')
    .select('journey_id')
    .eq('user_id', userId)
    .in('journey_id', journeyIds);

  if (failureError) throw new Error(failureError.message);

  const failuresByJourney = (failureRows || []).reduce<Record<string, number>>((acc, row) => {
    if (!row.journey_id) return acc;
    acc[row.journey_id] = (acc[row.journey_id] || 0) + 1;
    return acc;
  }, {});

  return journeyRows.map((journey) => ({
    ...mapJourney(journey),
    failureCount: failuresByJourney[journey.id] || 0,
  }));
}

export async function getJourney(journeyId: string, userId: string) {
  const { data: journey, error } = await supabase
    .from('recovery_journeys')
    .select('*')
    .eq('id', journeyId)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);

  const { count } = await supabase
    .from('failure_logs')
    .select('*', { count: 'exact', head: true })
    .eq('journey_id', journeyId);

  return {
    ...mapJourney(journey),
    failureCount: count || 0,
  };
}

export async function createJourney(
  userId: string,
  data: { title: string; description?: string; startTime: string }
) {
  const { data: journey, error } = await supabase
    .from('recovery_journeys')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      start_time: new Date(data.startTime).toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { ...mapJourney(journey), failureCount: 0 };
}

export async function updateJourney(
  journeyId: string,
  userId: string,
  data: { title?: string; description?: string; startTime?: string }
) {
  const updateData: Database['public']['Tables']['recovery_journeys']['Update'] = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startTime !== undefined) updateData.start_time = new Date(data.startTime).toISOString();

  const { data: journey, error } = await supabase
    .from('recovery_journeys')
    .update(updateData)
    .eq('id', journeyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapJourney(journey);
}

export async function deleteJourney(journeyId: string, userId: string) {
  // Failure logs cascade-delete automatically
  const { error } = await supabase
    .from('recovery_journeys')
    .delete()
    .eq('id', journeyId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function recordJourneyFailure(journeyId: string, userId: string, note?: string) {
  // Insert failure log
  const { data: log, error: logError } = await supabase
    .from('failure_logs')
    .insert({
      user_id: userId,
      journey_id: journeyId,
      timestamp: new Date().toISOString(),
      note: note || null,
    })
    .select()
    .single();

  if (logError) throw new Error(logError.message);

  // Fetch the journey without resetting start time
  const { data: journey, error: journeyError } = await supabase
    .from('recovery_journeys')
    .select('*')
    .eq('id', journeyId)
    .eq('user_id', userId)
    .single();

  if (journeyError) throw new Error(journeyError.message);

  return {
    failureLog: mapFailureLog(log),
    journey: mapJourney(journey),
  };
}

export async function resetJourney(journeyId: string, userId: string, clearLogs: boolean = false) {
  if (clearLogs) {
    await supabase
      .from('failure_logs')
      .delete()
      .eq('journey_id', journeyId)
      .eq('user_id', userId);
  }

  const { data: journey, error } = await supabase
    .from('recovery_journeys')
    .update({ start_time: new Date().toISOString() })
    .eq('id', journeyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapJourney(journey);
}

// =====================================================
// Failure Logs (scoped to journey)
// =====================================================

export async function getJourneyFailures(journeyId: string, userId: string, limit: number = 50) {
  const { data: logs, error } = await supabase
    .from('failure_logs')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (logs || []).map(mapFailureLog);
}

export async function getAllFailures(userId: string, limit: number = 50) {
  const { data: logs, error } = await supabase
    .from('failure_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (logs || []).map(mapFailureLog);
}

export async function deleteFailureLog(id: string, userId: string) {
  const { error } = await supabase
    .from('failure_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// =====================================================
// Legacy: getRecoveryState (for backward compat / dashboard)
// =====================================================

export async function getRecoveryState(userId: string) {
  const { data: state } = await supabase
    .from('recovery_states')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const { count: failureCount } = await supabase
    .from('failure_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (!state) {
    return {
      id: '',
      userId,
      startTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failureCount: failureCount || 0,
    };
  }

  return {
    id: state.id,
    userId: state.user_id,
    startTime: state.start_time,
    updatedAt: state.updated_at,
    failureCount: failureCount || 0,
  };
}

// =====================================================
// Mappers
// =====================================================

function mapJourney(j: JourneyRow) {
  return {
    id: j.id,
    userId: j.user_id,
    title: j.title,
    description: j.description,
    startTime: j.start_time,
    isActive: j.is_active,
    createdAt: j.created_at,
  };
}

function mapFailureLog(l: FailureRow) {
  return {
    id: l.id,
    userId: l.user_id,
    journeyId: l.journey_id,
    timestamp: l.timestamp,
    note: l.note,
    createdAt: l.created_at,
  };
}
