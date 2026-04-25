import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { supabase } from '../supabase';
import type { Database, Json } from '../database.types';

type JourneyRow = Database['public']['Tables']['competitive_journeys']['Row'];
type ParticipantRow = Database['public']['Tables']['journey_participants']['Row'];
type FailureRow = Database['public']['Tables']['journey_failures']['Row'];
type ConsequenceRow = Database['public']['Tables']['journey_consequences']['Row'];
type InviteRow = Database['public']['Tables']['journey_invites']['Row'];
type ReactionRow = Database['public']['Tables']['journey_reactions']['Row'];
type CheckInRow = Database['public']['Tables']['journey_check_ins']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

type JourneyVisibility = 'private' | 'public';
type ParticipantRole = 'owner' | 'member';
type ParticipantStatus = 'active' | 'left' | 'failed';
type ConsequenceType = 'text' | 'symbolic' | 'warning' | 'penalty';

const DUPLICATE_FAILURE_WINDOW_MS = 30_000;

export interface StructuredJourneyRules {
  noMoreThanFailuresPerWeek?: number;
  resetStreakOnFailure?: boolean;
  mandatoryDailyCheckIn?: boolean;
  syncToPersonal?: boolean;
}

export interface CreateCompetitiveJourneyInput {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  rulesText?: string;
  rules?: StructuredJourneyRules;
  maxFailures?: number | null;
  consequenceRules?: string;
  visibility?: JourneyVisibility;
  consequences?: Array<{
    failureThreshold: number;
    description: string;
    consequenceType?: ConsequenceType;
    symbol?: string;
  }>;
}

export interface InviteUserInput {
  username?: string;
  email?: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

interface JourneyAccess {
  journey: JourneyRow;
  membership: ParticipantRow | null;
  hasPendingInvite: boolean;
}

function toIsoDate(value: string | Date) {
  const d = dayjs(value);
  if (!d.isValid()) {
    throw new Error('Invalid date value');
  }
  return d.toISOString();
}

function asStructuredRules(raw: Json | null | undefined): StructuredJourneyRules {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const source = raw as Record<string, Json>;
  const noMoreThanFailuresPerWeek =
    typeof source.noMoreThanFailuresPerWeek === 'number'
      ? source.noMoreThanFailuresPerWeek
      : undefined;

  return {
    noMoreThanFailuresPerWeek,
    resetStreakOnFailure:
      typeof source.resetStreakOnFailure === 'boolean'
        ? source.resetStreakOnFailure
        : undefined,
    mandatoryDailyCheckIn:
      typeof source.mandatoryDailyCheckIn === 'boolean'
        ? source.mandatoryDailyCheckIn
        : undefined,
    syncToPersonal:
      typeof source.syncToPersonal === 'boolean' ? source.syncToPersonal : undefined,
  };
}

function mapJourney(row: JourneyRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    startDate: row.start_date,
    endDate: row.end_date,
    rules: {
      text: row.rules_text,
      structured: asStructuredRules(row.rules_json),
    },
    maxFailures: row.max_failures,
    consequenceRules: row.consequence_rules,
    visibility: row.visibility as JourneyVisibility,
    inviteCode: row.invite_code,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConsequence(row: ConsequenceRow) {
  return {
    id: row.id,
    journeyId: row.journey_id,
    failureThreshold: row.failure_threshold,
    description: row.description,
    consequenceType: row.consequence_type as ConsequenceType,
    symbol: row.symbol,
    createdAt: row.created_at,
  };
}

function mapInvite(row: InviteRow) {
  return {
    id: row.id,
    journeyId: row.journey_id,
    invitedBy: row.invited_by,
    inviteeUserId: row.invitee_user_id,
    inviteeEmail: row.invitee_email,
    inviteeUsername: row.invitee_username,
    token: row.token,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    inviteLinkPath: `/recovery?mode=competitive&journey=${row.journey_id}&invite=${row.token}`,
  };
}

function mapReaction(row: ReactionRow, usersById: Map<string, UserProfile>) {
  return {
    id: row.id,
    journeyId: row.journey_id,
    fromUserId: row.from_user_id,
    fromUsername: usersById.get(row.from_user_id)?.username || 'unknown',
    toUserId: row.to_user_id,
    toUsername: row.to_user_id ? usersById.get(row.to_user_id)?.username || 'unknown' : null,
    emoji: row.emoji,
    message: row.message,
    createdAt: row.created_at,
  };
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

async function getJourneyRow(journeyId: string) {
  const { data, error } = await supabase
    .from('competitive_journeys')
    .select('*')
    .eq('id', journeyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function getParticipantRow(
  journeyId: string,
  userId: string,
  allowedStatuses?: ParticipantStatus[]
) {
  let query = supabase
    .from('journey_participants')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('user_id', userId);

  if (allowedStatuses && allowedStatuses.length > 0) {
    query = query.in('status', allowedStatuses);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function getUsersByIds(userIds: string[]) {
  const unique = Array.from(new Set(userIds)).filter(Boolean);
  if (unique.length === 0) return new Map<string, UserProfile>();

  const { data, error } = await supabase
    .from('users')
    .select('id, username, email')
    .in('id', unique);

  if (error) throw new Error(error.message);

  return new Map(
    (data || []).map((row: Pick<UserRow, 'id' | 'username' | 'email'>) => [
      row.id,
      { id: row.id, username: row.username, email: row.email },
    ])
  );
}

async function ensureOwnerMembership(journeyId: string, userId: string) {
  const participant = await getParticipantRow(journeyId, userId, ['active', 'failed']);
  if (!participant || participant.role !== 'owner') {
    throw new Error('Only journey owner can perform this action');
  }
  return participant;
}

async function getAccess(journeyId: string, userId: string): Promise<JourneyAccess> {
  const journey = await getJourneyRow(journeyId);
  if (!journey) throw new Error('Journey not found');

  const [membership, { data: inviteRows, error: inviteError }] = await Promise.all([
    getParticipantRow(journeyId, userId),
    supabase
      .from('journey_invites')
      .select('id')
      .eq('journey_id', journeyId)
      .eq('status', 'pending')
      .eq('invitee_user_id', userId)
      .limit(1),
  ]);

  if (inviteError) throw new Error(inviteError.message);

  return {
    journey,
    membership: membership || null,
    hasPendingInvite: (inviteRows || []).length > 0,
  };
}

function normalizeConsequenceRows(
  rows: CreateCompetitiveJourneyInput['consequences']
): Database['public']['Tables']['journey_consequences']['Insert'][] {
  const normalized = (rows || [])
    .filter((row) => row.description.trim() && row.failureThreshold > 0)
    .map((row) => ({
      journey_id: '',
      failure_threshold: Math.floor(row.failureThreshold),
      description: row.description.trim(),
      consequence_type: (row.consequenceType || 'text') as ConsequenceType,
      symbol: row.symbol?.trim() || null,
    }));

  return normalized;
}

export async function createJourney(ownerId: string, data: CreateCompetitiveJourneyInput) {
  if (!data.name.trim()) {
    throw new Error('Journey name is required');
  }

  const startDate = toIsoDate(data.startDate);
  const endDate = data.endDate ? toIsoDate(data.endDate) : null;

  if (endDate && dayjs(endDate).isBefore(dayjs(startDate))) {
    throw new Error('End date must be after start date');
  }

  const { data: journey, error } = await supabase
    .from('competitive_journeys')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      owner_id: ownerId,
      start_date: startDate,
      end_date: endDate,
      rules_text: data.rulesText?.trim() || null,
      rules_json: (data.rules || {}) as unknown as Json,
      max_failures: data.maxFailures ?? null,
      consequence_rules: data.consequenceRules?.trim() || null,
      visibility: (data.visibility || 'private') as JourneyVisibility,
      invite_code: randomUUID().replaceAll('-', ''),
      is_active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const { error: ownerMembershipError } = await supabase
    .from('journey_participants')
    .insert({
      journey_id: journey.id,
      user_id: ownerId,
      role: 'owner',
      status: 'active',
      current_streak: 0,
      total_failures: 0,
    });

  if (ownerMembershipError) throw new Error(ownerMembershipError.message);

  const normalizedConsequences = normalizeConsequenceRows(data.consequences);
  if (normalizedConsequences.length > 0) {
    const payload = normalizedConsequences.map((row) => ({
      ...row,
      journey_id: journey.id,
    }));

    const { error: consequencesError } = await supabase
      .from('journey_consequences')
      .insert(payload);

    if (consequencesError) throw new Error(consequencesError.message);
  }

  return mapJourney(journey);
}

export async function inviteUser(journeyId: string, ownerId: string, input: InviteUserInput) {
  await ensureOwnerMembership(journeyId, ownerId);

  const username = input.username?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;

  let inviteeUserId: string | null = null;

  if (username) {
    const { data: userByUsername, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (usernameError) throw new Error(usernameError.message);
    inviteeUserId = userByUsername?.id || null;
  }

  if (!inviteeUserId && email) {
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailError) throw new Error(emailError.message);
    inviteeUserId = userByEmail?.id || null;
  }

  const token = randomUUID().replaceAll('-', '');

  const { data: invite, error } = await supabase
    .from('journey_invites')
    .insert({
      journey_id: journeyId,
      invited_by: ownerId,
      invitee_user_id: inviteeUserId,
      invitee_email: email,
      invitee_username: username,
      token,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapInvite(invite);
}

export async function joinJourney(
  journeyId: string,
  userId: string,
  input?: { token?: string; decision?: 'accept' | 'decline' }
) {
  let invite: InviteRow | null = null;

  if (input?.token) {
    const { data, error } = await supabase
      .from('journey_invites')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('token', input.token)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw new Error(error.message);
    invite = data || null;

    if (invite?.invitee_user_id && invite.invitee_user_id !== userId) {
      throw new Error('Invite token is not valid for this user');
    }
  } else {
    const { data, error } = await supabase
      .from('journey_invites')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    invite = data || null;
  }

  if (input?.decision === 'decline') {
    if (!invite) throw new Error('No pending invite found');

    const { error: declineError } = await supabase
      .from('journey_invites')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (declineError) throw new Error(declineError.message);

    return {
      joined: false,
      declined: true,
    };
  }

  const journey = await getJourneyRow(journeyId);
  if (!journey || !journey.is_active) throw new Error('Journey is not active');

  const existing = await getParticipantRow(journeyId, userId);
  if (existing?.status === 'active' || existing?.status === 'failed') {
    return {
      joined: true,
      alreadyJoined: true,
      participant: existing,
      journey: mapJourney(journey),
    };
  }

  const canJoinByVisibility = journey.visibility === 'public' || journey.owner_id === userId;
  if (!canJoinByVisibility && !invite) {
    throw new Error('Private journey requires an invite');
  }

  let participant: ParticipantRow | null = null;

  if (existing) {
    const { data, error } = await supabase
      .from('journey_participants')
      .update({
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    participant = data;
  } else {
    const { data, error } = await supabase
      .from('journey_participants')
      .insert({
        journey_id: journeyId,
        user_id: userId,
        role: userId === journey.owner_id ? 'owner' : 'member',
        status: 'active',
        current_streak: 0,
        total_failures: 0,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    participant = data;
  }

  if (invite) {
    const { error: inviteUpdateError } = await supabase
      .from('journey_invites')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (inviteUpdateError) throw new Error(inviteUpdateError.message);
  }

  return {
    joined: true,
    alreadyJoined: false,
    participant,
    journey: mapJourney(journey),
  };
}

export async function leaveJourney(journeyId: string, userId: string) {
  const participant = await getParticipantRow(journeyId, userId, ['active', 'failed']);

  if (!participant) {
    throw new Error('You are not a participant in this journey');
  }

  if (participant.role === 'owner') {
    throw new Error('Journey owner cannot leave. Transfer ownership or archive journey instead.');
  }

  const { error } = await supabase
    .from('journey_participants')
    .update({ status: 'left' })
    .eq('id', participant.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function evaluateConsequences(journeyId: string, userId: string) {
  const [journey, participant] = await Promise.all([
    getJourneyRow(journeyId),
    getParticipantRow(journeyId, userId, ['active', 'failed']),
  ]);

  if (!journey) throw new Error('Journey not found');
  if (!participant) throw new Error('Participant not found');

  const [
    { data: consequences, error: consequencesError },
    { data: existingStatuses, error: statusError },
  ] = await Promise.all([
    supabase
      .from('journey_consequences')
      .select('*')
      .eq('journey_id', journeyId)
      .order('failure_threshold', { ascending: true }),
    supabase
      .from('journey_consequence_statuses')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('participant_id', participant.id),
  ]);

  if (consequencesError) throw new Error(consequencesError.message);
  if (statusError) throw new Error(statusError.message);

  const statusByConsequenceId = new Map(
    (existingStatuses || []).map((status) => [status.consequence_id, status])
  );

  const newStatuses = (consequences || [])
    .filter((consequence) => participant.total_failures >= consequence.failure_threshold)
    .filter((consequence) => !statusByConsequenceId.has(consequence.id));

  if (newStatuses.length > 0) {
    const payload: Database['public']['Tables']['journey_consequence_statuses']['Insert'][] =
      newStatuses.map((consequence) => ({
        journey_id: journeyId,
        participant_id: participant.id,
        consequence_id: consequence.id,
        status: 'triggered',
      }));

    const { error: insertError } = await supabase
      .from('journey_consequence_statuses')
      .insert(payload);

    if (insertError) throw new Error(insertError.message);
  }

  const structuredRules = asStructuredRules(journey.rules_json);
  const sevenDaysAgo = dayjs().subtract(7, 'day').toISOString();

  const { data: weeklyFailures, error: weeklyError } = await supabase
    .from('journey_failures')
    .select('id')
    .eq('journey_id', journeyId)
    .eq('user_id', userId)
    .gte('timestamp', sevenDaysAgo);

  if (weeklyError) throw new Error(weeklyError.message);

  const weeklyFailuresCount = (weeklyFailures || []).length;
  const weeklyLimitExceeded =
    typeof structuredRules.noMoreThanFailuresPerWeek === 'number'
      ? weeklyFailuresCount > structuredRules.noMoreThanFailuresPerWeek
      : false;

  let participantStatus = participant.status as ParticipantStatus;

  if (
    journey.max_failures !== null &&
    participant.total_failures >= journey.max_failures &&
    participant.status !== 'failed'
  ) {
    const { error: failedStatusError } = await supabase
      .from('journey_participants')
      .update({ status: 'failed' })
      .eq('id', participant.id);

    if (failedStatusError) throw new Error(failedStatusError.message);
    participantStatus = 'failed';
  }

  let checkedInToday = true;
  if (structuredRules.mandatoryDailyCheckIn) {
    const { data: todayCheckIn, error: checkInError } = await supabase
      .from('journey_check_ins')
      .select('id')
      .eq('journey_id', journeyId)
      .eq('user_id', userId)
      .eq('check_in_date', dayjs().format('YYYY-MM-DD'))
      .maybeSingle();

    if (checkInError) throw new Error(checkInError.message);
    checkedInToday = !!todayCheckIn;
  }

  return {
    participantStatus,
    triggeredConsequences: newStatuses.map(mapConsequence),
    weeklyFailures: weeklyFailuresCount,
    weeklyLimitExceeded,
    mandatoryDailyCheckIn: !!structuredRules.mandatoryDailyCheckIn,
    checkedInToday,
  };
}

export async function calculateLeaderboard(journeyId: string) {
  const journey = await getJourneyRow(journeyId);
  if (!journey) throw new Error('Journey not found');

  const { data: participants, error: participantsError } = await supabase
    .from('journey_participants')
    .select('*')
    .eq('journey_id', journeyId)
    .in('status', ['active', 'failed']);

  if (participantsError) throw new Error(participantsError.message);

  const participantRows = participants || [];
  if (participantRows.length === 0) return [];

  const userMap = await getUsersByIds(participantRows.map((participant) => participant.user_id));

  const participantIdSet = participantRows.map((participant) => participant.id);

  const [
    { data: consequenceStatuses, error: consequenceStatusError },
    { data: weeklyFailures, error: weeklyFailuresError },
  ] = await Promise.all([
    supabase
      .from('journey_consequence_statuses')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('status', 'triggered')
      .in('participant_id', participantIdSet),
    supabase
      .from('journey_failures')
      .select('user_id')
      .eq('journey_id', journeyId)
      .gte('timestamp', dayjs().subtract(7, 'day').toISOString()),
  ]);

  if (consequenceStatusError) throw new Error(consequenceStatusError.message);
  if (weeklyFailuresError) throw new Error(weeklyFailuresError.message);

  const triggeredByParticipantId = new Map<string, number>();
  (consequenceStatuses || []).forEach((status) => {
    triggeredByParticipantId.set(
      status.participant_id,
      (triggeredByParticipantId.get(status.participant_id) || 0) + 1
    );
  });

  const weeklyFailuresByUserId = new Map<string, number>();
  (weeklyFailures || []).forEach((row) => {
    weeklyFailuresByUserId.set(row.user_id, (weeklyFailuresByUserId.get(row.user_id) || 0) + 1);
  });

  const now = dayjs();

  const leaderboard = participantRows
    .map((participant) => {
      const profile = userMap.get(participant.user_id);

      const baseline = dayjs(journey.start_date).isAfter(dayjs(participant.joined_at))
        ? dayjs(journey.start_date)
        : dayjs(participant.joined_at);

      const streakStart = participant.last_failure_at ? dayjs(participant.last_failure_at) : baseline;
      const currentStreakSeconds = Math.max(0, now.diff(streakStart, 'second'));

      const trackedDays = Math.max(1, now.diff(baseline, 'day') + 1);
      const streakDays = Math.floor(currentStreakSeconds / 86400);
      const safeDays = Math.max(0, trackedDays - participant.total_failures);
      const consistencyScore = Math.max(
        0,
        Math.min(100, Math.round(((safeDays + streakDays) / (trackedDays * 2)) * 100))
      );

      return {
        userId: participant.user_id,
        username: profile?.username || 'unknown',
        email: profile?.email || '',
        role: participant.role as ParticipantRole,
        status: participant.status as ParticipantStatus,
        currentStreak: currentStreakSeconds,
        currentStreakLabel: formatDuration(currentStreakSeconds),
        totalFailures: participant.total_failures,
        consistencyScore,
        weeklyFailures: weeklyFailuresByUserId.get(participant.user_id) || 0,
        triggeredConsequences: triggeredByParticipantId.get(participant.id) || 0,
      };
    })
    .sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (a.totalFailures !== b.totalFailures) return a.totalFailures - b.totalFailures;
      if (b.consistencyScore !== a.consistencyScore) return b.consistencyScore - a.consistencyScore;
      return a.username.localeCompare(b.username);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return leaderboard;
}

export async function recordJourneyFailure(journeyId: string, userId: string) {
  const [journey, participant] = await Promise.all([
    getJourneyRow(journeyId),
    getParticipantRow(journeyId, userId, ['active']),
  ]);

  if (!journey || !journey.is_active) throw new Error('Journey is not active');
  if (!participant) throw new Error('You must join this journey before logging failure');

  const { data: lastFailureRows, error: lastFailureError } = await supabase
    .from('journey_failures')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1);

  if (lastFailureError) throw new Error(lastFailureError.message);

  const lastFailure = (lastFailureRows || [])[0] || null;
  const now = new Date();

  if (lastFailure) {
    const elapsed = now.getTime() - new Date(lastFailure.timestamp).getTime();
    if (elapsed >= 0 && elapsed < DUPLICATE_FAILURE_WINDOW_MS) {
      const leaderboard = await calculateLeaderboard(journeyId);
      return {
        deduplicated: true,
        failure: {
          id: lastFailure.id,
          journeyId: lastFailure.journey_id,
          userId: lastFailure.user_id,
          timestamp: lastFailure.timestamp,
          createdAt: lastFailure.created_at,
        },
        leaderboard,
      };
    }
  }

  const { data: insertedFailure, error: insertFailureError } = await supabase
    .from('journey_failures')
    .insert({
      journey_id: journeyId,
      user_id: userId,
      timestamp: now.toISOString(),
    })
    .select('*')
    .single();

  if (insertFailureError) throw new Error(insertFailureError.message);

  const rules = asStructuredRules(journey.rules_json);
  const resetStreak = rules.resetStreakOnFailure ?? true;

  const participantUpdate: Database['public']['Tables']['journey_participants']['Update'] = {
    total_failures: participant.total_failures + 1,
  };

  if (resetStreak) {
    participantUpdate.current_streak = 0;
    participantUpdate.last_failure_at = now.toISOString();
  }

  const { error: participantUpdateError } = await supabase
    .from('journey_participants')
    .update(participantUpdate)
    .eq('id', participant.id);

  if (participantUpdateError) throw new Error(participantUpdateError.message);

  if (rules.syncToPersonal) {
    const { error: syncError } = await supabase.from('failure_logs').insert({
      user_id: userId,
      journey_id: null,
      timestamp: now.toISOString(),
      note: `Competitive journey failure: ${journey.name}`,
    });

    if (syncError) throw new Error(syncError.message);
  }

  const [consequenceResult, leaderboard] = await Promise.all([
    evaluateConsequences(journeyId, userId),
    calculateLeaderboard(journeyId),
  ]);

  return {
    deduplicated: false,
    failure: {
      id: insertedFailure.id,
      journeyId: insertedFailure.journey_id,
      userId: insertedFailure.user_id,
      timestamp: insertedFailure.timestamp,
      createdAt: insertedFailure.created_at,
    },
    consequenceResult,
    leaderboard,
  };
}

export async function recordJourneyCheckIn(journeyId: string, userId: string, note?: string) {
  const participant = await getParticipantRow(journeyId, userId, ['active']);
  if (!participant) throw new Error('You must be an active participant to check in');

  const today = dayjs().format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('journey_check_ins')
    .upsert(
      {
        journey_id: journeyId,
        user_id: userId,
        check_in_date: today,
        note: note?.trim() || null,
      },
      { onConflict: 'journey_id,user_id,check_in_date' }
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const { error: participantUpdateError } = await supabase
    .from('journey_participants')
    .update({ last_check_in_at: new Date().toISOString() })
    .eq('id', participant.id);

  if (participantUpdateError) throw new Error(participantUpdateError.message);

  const row = data as CheckInRow;

  return {
    id: row.id,
    journeyId: row.journey_id,
    userId: row.user_id,
    checkInDate: row.check_in_date,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function addJourneyReaction(
  journeyId: string,
  fromUserId: string,
  input: { toUserId?: string; emoji?: string; message?: string }
) {
  const participant = await getParticipantRow(journeyId, fromUserId, ['active', 'failed']);
  if (!participant) throw new Error('You must join this journey before reacting');

  const emoji = input.emoji?.trim() || '👏';

  const { data, error } = await supabase
    .from('journey_reactions')
    .insert({
      journey_id: journeyId,
      from_user_id: fromUserId,
      to_user_id: input.toUserId || null,
      emoji,
      message: input.message?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const usersById = await getUsersByIds([
    data.from_user_id,
    ...(data.to_user_id ? [data.to_user_id] : []),
  ]);

  return mapReaction(data, usersById);
}

export async function addJourneyConsequence(
  journeyId: string,
  userId: string,
  input: {
    failureThreshold: number;
    description: string;
    consequenceType?: ConsequenceType;
    symbol?: string;
  }
) {
  await ensureOwnerMembership(journeyId, userId);

  if (!input.description.trim()) {
    throw new Error('Consequence description is required');
  }

  if (!Number.isInteger(input.failureThreshold) || input.failureThreshold <= 0) {
    throw new Error('Failure threshold must be a positive integer');
  }

  const { data, error } = await supabase
    .from('journey_consequences')
    .insert({
      journey_id: journeyId,
      failure_threshold: input.failureThreshold,
      description: input.description.trim(),
      consequence_type: (input.consequenceType || 'text') as ConsequenceType,
      symbol: input.symbol?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapConsequence(data);
}

async function buildJourneySummaries(journeys: JourneyRow[], userId: string) {
  if (journeys.length === 0) return [];

  const journeyIds = journeys.map((journey) => journey.id);

  const [
    { data: participants, error: participantsError },
    { data: failures, error: failuresError },
  ] = await Promise.all([
    supabase
      .from('journey_participants')
      .select('*')
      .in('journey_id', journeyIds),
    supabase
      .from('journey_failures')
      .select('journey_id')
      .in('journey_id', journeyIds),
  ]);

  if (participantsError) throw new Error(participantsError.message);
  if (failuresError) throw new Error(failuresError.message);

  const participantRows = participants || [];
  const failureRows = failures || [];

  const participantCounts = new Map<string, number>();
  const myParticipant = new Map<string, ParticipantRow>();
  participantRows.forEach((participant) => {
    if (participant.status !== 'left') {
      participantCounts.set(
        participant.journey_id,
        (participantCounts.get(participant.journey_id) || 0) + 1
      );
    }

    if (participant.user_id === userId) {
      myParticipant.set(participant.journey_id, participant);
    }
  });

  const failureCounts = new Map<string, number>();
  failureRows.forEach((failure) => {
    failureCounts.set(failure.journey_id, (failureCounts.get(failure.journey_id) || 0) + 1);
  });

  return journeys.map((journey) => {
    const mapped = mapJourney(journey);
    const mine = myParticipant.get(journey.id);

    return {
      ...mapped,
      participantCount: participantCounts.get(journey.id) || 0,
      totalFailures: failureCounts.get(journey.id) || 0,
      myRole: (mine?.role || null) as ParticipantRole | null,
      myStatus: (mine?.status || null) as ParticipantStatus | null,
      myFailures: mine?.total_failures || 0,
    };
  });
}

export async function getJourneyCatalog(userId: string) {
  const { data: memberships, error: membershipsError } = await supabase
    .from('journey_participants')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'failed']);

  if (membershipsError) throw new Error(membershipsError.message);

  const memberJourneyIds = Array.from(
    new Set((memberships || []).map((membership) => membership.journey_id))
  );

  const [
    { data: memberJourneys, error: memberJourneyError },
    { data: publicJourneys, error: publicJourneyError },
    { data: invites, error: invitesError },
  ] = await Promise.all([
    memberJourneyIds.length > 0
      ? supabase
          .from('competitive_journeys')
          .select('*')
          .in('id', memberJourneyIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('competitive_journeys')
      .select('*')
      .eq('visibility', 'public')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('journey_invites')
      .select('*')
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  if (memberJourneyError) throw new Error(memberJourneyError.message);
  if (publicJourneyError) throw new Error(publicJourneyError.message);
  if (invitesError) throw new Error(invitesError.message);

  const joinedRows = (memberJourneys || []) as JourneyRow[];
  const publicNotJoinedRows = ((publicJourneys || []) as JourneyRow[]).filter(
    (journey) => !memberJourneyIds.includes(journey.id)
  );

  // Build summaries once for all displayed journeys to avoid duplicate full-table scans.
  const combinedRows = Array.from(
    new Map([...joinedRows, ...publicNotJoinedRows].map((row) => [row.id, row])).values()
  );
  const combinedSummaries = await buildJourneySummaries(combinedRows, userId);
  const summaryById = new Map(combinedSummaries.map((row) => [row.id, row]));

  const joined = joinedRows
    .map((row) => summaryById.get(row.id))
    .filter((row): row is NonNullable<typeof row> => !!row);

  const discoverable = publicNotJoinedRows
    .map((row) => summaryById.get(row.id))
    .filter((row): row is NonNullable<typeof row> => !!row);

  const inviteJourneyIds = Array.from(new Set((invites || []).map((invite) => invite.journey_id)));

  const knownJourneyMap = new Map(combinedRows.map((row) => [row.id, row]));
  const missingInviteJourneyIds = inviteJourneyIds.filter((id) => !knownJourneyMap.has(id));

  const { data: inviteJourneys, error: inviteJourneyLookupError } =
    missingInviteJourneyIds.length > 0
      ? await supabase
          .from('competitive_journeys')
          .select('*')
          .in('id', missingInviteJourneyIds)
      : { data: [], error: null };

  if (inviteJourneyLookupError) throw new Error(inviteJourneyLookupError.message);

  const inviteJourneyMap = new Map<string, JourneyRow>([
    ...Array.from(knownJourneyMap.entries()),
    ...((inviteJourneys || []) as JourneyRow[]).map(
      (journey): [string, JourneyRow] => [journey.id, journey]
    ),
  ]);

  return {
    journeys: joined,
    publicJourneys: discoverable,
    pendingInvites: (invites || []).map((invite) => ({
      ...mapInvite(invite),
      journey: inviteJourneyMap.get(invite.journey_id)
        ? mapJourney(inviteJourneyMap.get(invite.journey_id) as JourneyRow)
        : null,
    })),
  };
}

export async function getJourneyParticipants(journeyId: string, requesterId: string) {
  const access = await getAccess(journeyId, requesterId);

  const canAccess =
    access.journey.visibility === 'public' ||
    !!access.membership ||
    access.hasPendingInvite ||
    access.journey.owner_id === requesterId;

  if (!canAccess) {
    throw new Error('You do not have access to this journey');
  }

  const { data: participants, error } = await supabase
    .from('journey_participants')
    .select('*')
    .eq('journey_id', journeyId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(error.message);

  const rows = participants || [];
  const userMap = await getUsersByIds(rows.map((row) => row.user_id));

  return rows.map((participant) => ({
    id: participant.id,
    journeyId: participant.journey_id,
    userId: participant.user_id,
    username: userMap.get(participant.user_id)?.username || 'unknown',
    email: userMap.get(participant.user_id)?.email || '',
    role: participant.role as ParticipantRole,
    status: participant.status as ParticipantStatus,
    joinedAt: participant.joined_at,
    currentStreak: participant.current_streak,
    totalFailures: participant.total_failures,
    lastFailureAt: participant.last_failure_at,
    lastCheckInAt: participant.last_check_in_at,
  }));
}

export async function getJourneyDetails(journeyId: string, requesterId: string) {
  const access = await getAccess(journeyId, requesterId);

  const canAccess =
    access.journey.visibility === 'public' ||
    !!access.membership ||
    access.hasPendingInvite ||
    access.journey.owner_id === requesterId;

  if (!canAccess) {
    throw new Error('You do not have access to this journey');
  }

  const [
    { data: participantRowsData, error: participantRowsError },
    { data: failures, error: failuresError },
    { data: weeklyFailures, error: weeklyFailuresError },
    { data: consequences, error: consequencesError },
    { data: consequenceStatuses, error: consequenceStatusesError },
    { data: reactions, error: reactionsError },
    { data: invites, error: invitesError },
  ] = await Promise.all([
    supabase
      .from('journey_participants')
      .select('*')
      .eq('journey_id', journeyId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('journey_failures')
      .select('*')
      .eq('journey_id', journeyId)
      .order('timestamp', { ascending: false })
      .limit(80),
    supabase
      .from('journey_failures')
      .select('user_id')
      .eq('journey_id', journeyId)
      .gte('timestamp', dayjs().subtract(7, 'day').toISOString()),
    supabase
      .from('journey_consequences')
      .select('*')
      .eq('journey_id', journeyId)
      .order('failure_threshold', { ascending: true }),
    supabase
      .from('journey_consequence_statuses')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('status', 'triggered'),
    supabase
      .from('journey_reactions')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false })
      .limit(40),
    access.membership?.role === 'owner'
      ? supabase
          .from('journey_invites')
          .select('*')
          .eq('journey_id', journeyId)
          .order('created_at', { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (participantRowsError) throw new Error(participantRowsError.message);
  if (failuresError) throw new Error(failuresError.message);
  if (weeklyFailuresError) throw new Error(weeklyFailuresError.message);
  if (consequencesError) throw new Error(consequencesError.message);
  if (consequenceStatusesError) throw new Error(consequenceStatusesError.message);
  if (reactionsError) throw new Error(reactionsError.message);
  if (invitesError) throw new Error(invitesError.message);

  const participantRows = (participantRowsData || []) as ParticipantRow[];
  const activeParticipantsRows = participantRows.filter((row) => row.status !== 'left');

  const userIds = [
    ...participantRows.map((row) => row.user_id),
    ...(failures || []).map((failure) => failure.user_id),
    ...(reactions || []).flatMap((reaction) =>
      reaction.to_user_id ? [reaction.from_user_id, reaction.to_user_id] : [reaction.from_user_id]
    ),
  ];

  const usersById = await getUsersByIds(userIds);

  const participants = activeParticipantsRows.map((participant) => ({
    id: participant.id,
    journeyId: participant.journey_id,
    userId: participant.user_id,
    username: usersById.get(participant.user_id)?.username || 'unknown',
    email: usersById.get(participant.user_id)?.email || '',
    role: participant.role as ParticipantRole,
    status: participant.status as ParticipantStatus,
    joinedAt: participant.joined_at,
    currentStreak: participant.current_streak,
    totalFailures: participant.total_failures,
    lastFailureAt: participant.last_failure_at,
    lastCheckInAt: participant.last_check_in_at,
  }));

  const weeklyFailuresByUserId = new Map<string, number>();
  (weeklyFailures || []).forEach((row) => {
    weeklyFailuresByUserId.set(row.user_id, (weeklyFailuresByUserId.get(row.user_id) || 0) + 1);
  });

  const triggeredByParticipantId = new Map<string, number>();
  (consequenceStatuses || []).forEach((status) => {
    triggeredByParticipantId.set(
      status.participant_id,
      (triggeredByParticipantId.get(status.participant_id) || 0) + 1
    );
  });

  const now = dayjs();
  const leaderboard = activeParticipantsRows
    .map((participant) => {
      const profile = usersById.get(participant.user_id);

      const baseline = dayjs(access.journey.start_date).isAfter(dayjs(participant.joined_at))
        ? dayjs(access.journey.start_date)
        : dayjs(participant.joined_at);

      const streakStart = participant.last_failure_at ? dayjs(participant.last_failure_at) : baseline;
      const currentStreakSeconds = Math.max(0, now.diff(streakStart, 'second'));
      const trackedDays = Math.max(1, now.diff(baseline, 'day') + 1);
      const streakDays = Math.floor(currentStreakSeconds / 86400);
      const safeDays = Math.max(0, trackedDays - participant.total_failures);
      const consistencyScore = Math.max(
        0,
        Math.min(100, Math.round(((safeDays + streakDays) / (trackedDays * 2)) * 100))
      );

      return {
        userId: participant.user_id,
        username: profile?.username || 'unknown',
        email: profile?.email || '',
        role: participant.role as ParticipantRole,
        status: participant.status as ParticipantStatus,
        currentStreak: currentStreakSeconds,
        currentStreakLabel: formatDuration(currentStreakSeconds),
        totalFailures: participant.total_failures,
        consistencyScore,
        weeklyFailures: weeklyFailuresByUserId.get(participant.user_id) || 0,
        triggeredConsequences: triggeredByParticipantId.get(participant.id) || 0,
      };
    })
    .sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (a.totalFailures !== b.totalFailures) return a.totalFailures - b.totalFailures;
      if (b.consistencyScore !== a.consistencyScore) return b.consistencyScore - a.consistencyScore;
      return a.username.localeCompare(b.username);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const consequenceById = new Map((consequences || []).map((row) => [row.id, row]));

  const consequenceStatusByParticipant = (consequenceStatuses || []).reduce<
    Record<string, Array<{ id: string; description: string; triggeredAt: string; status: string }>>
  >((acc, status) => {
    const consequence = consequenceById.get(status.consequence_id);
    if (!consequence) return acc;

    const entry = {
      id: status.id,
      description: consequence.description,
      triggeredAt: status.triggered_at,
      status: status.status,
    };

    if (!acc[status.participant_id]) {
      acc[status.participant_id] = [];
    }

    acc[status.participant_id].push(entry);
    return acc;
  }, {});

  const structuredRules = asStructuredRules(access.journey.rules_json);

  return {
    journey: mapJourney(access.journey),
    participants,
    leaderboard,
    recentFailures: (failures || []).map((failure: FailureRow) => ({
      id: failure.id,
      journeyId: failure.journey_id,
      userId: failure.user_id,
      username: usersById.get(failure.user_id)?.username || 'unknown',
      timestamp: failure.timestamp,
      createdAt: failure.created_at,
    })),
    ruleSummary: {
      text: access.journey.rules_text,
      structured: structuredRules,
      maxFailures: access.journey.max_failures,
      consequenceRules: access.journey.consequence_rules,
    },
    consequences: (consequences || []).map(mapConsequence),
    consequenceStatusByParticipant,
    reactions: (reactions || []).map((reaction: ReactionRow) => mapReaction(reaction, usersById)),
    invites: (invites || []).map(mapInvite),
    myMembership: access.membership
      ? {
          id: access.membership.id,
          role: access.membership.role as ParticipantRole,
          status: access.membership.status as ParticipantStatus,
          totalFailures: access.membership.total_failures,
          currentStreak: access.membership.current_streak,
          lastFailureAt: access.membership.last_failure_at,
          joinedAt: access.membership.joined_at,
        }
      : null,
    canJoin: !access.membership && (access.journey.visibility === 'public' || access.hasPendingInvite),
  };
}

export async function deleteJourney(journeyId: string, requesterId: string) {
  // Verify the requester is the owner
  const { data: membership, error: membershipError } = await supabase
    .from('journey_participants')
    .select('role')
    .eq('journey_id', journeyId)
    .eq('user_id', requesterId)
    .single();

  if (membershipError || !membership) {
    throw new Error('Journey not found or you are not a member.');
  }

  if (membership.role !== 'owner') {
    throw new Error('Only the journey owner can delete.');
  }

  // Delete journey (this will cascade delete related records due to foreign keys)
  const { error: deleteError } = await supabase
    .from('competitive_journeys')
    .delete()
    .eq('id', journeyId);

  if (deleteError) {
    throw new Error('Failed to delete journey: ' + deleteError.message);
  }

  return { success: true };
}

export async function updateJourney(
  journeyId: string,
  requesterId: string,
  updates: {
    name?: string;
    description?: string | null;
    rulesText?: string | null;
    consequenceRules?: string | null;
    rules?: StructuredJourneyRules;
  }
) {
  // Verify the requester is the owner
  const { data: membership, error: membershipError } = await supabase
    .from('journey_participants')
    .select('role')
    .eq('journey_id', journeyId)
    .eq('user_id', requesterId)
    .single();

  if (membershipError || !membership) {
    throw new Error('Journey not found or you are not a member.');
  }

  if (membership.role !== 'owner') {
    throw new Error('Only the journey owner can edit.');
  }

  // Build update object
  const updateData: Partial<JourneyRow> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.rulesText !== undefined) updateData.rules_text = updates.rulesText;
  if (updates.consequenceRules !== undefined) updateData.consequence_rules = updates.consequenceRules;
  if (updates.rules !== undefined) updateData.rules_json = updates.rules as Json;

  const { error: updateError } = await supabase
    .from('competitive_journeys')
    .update(updateData)
    .eq('id', journeyId);

  if (updateError) {
    throw new Error('Failed to update journey: ' + updateError.message);
  }

  return { success: true };
}
