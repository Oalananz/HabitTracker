import { supabase } from '../supabase';

// Connections service for the Safe Learning Website Connections feature.
//
// IMPORTANT: this file NEVER writes to access_token_encrypted or
// refresh_token_encrypted. No OAuth flow is implemented in this version —
// those columns exist only for a future provider integration. The only
// supported connection methods here are manual course-link entry (and the
// CSV import UI, which also calls createManualCourseLink per row).

export interface LearningProviderRow {
  id: string;
  name: string;
  type: 'oauth' | 'api_key' | 'manual' | 'extension';
  websiteUrl: string | null;
  isEnabled: boolean;
}

export interface ConnectedLearningAccount {
  id: string;
  userId: string;
  providerId: string | null;
  providerName: string | null;
  displayName: string | null;
  externalAccountId: string | null;
  status: 'connected' | 'expired' | 'disconnected' | 'error';
  lastSyncedAt: string | null;
  createdAt: string;
}

export async function getLearningProviders(): Promise<LearningProviderRow[]> {
  const { data, error } = await supabase
    .from('learning_providers' as any)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    websiteUrl: p.website_url ?? null,
    isEnabled: p.is_enabled ?? false,
  }));
}

export async function getConnectedAccounts(userId: string): Promise<ConnectedLearningAccount[]> {
  const { data, error } = await supabase
    .from('connected_learning_accounts' as any)
    .select('*, learning_providers(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    providerId: a.provider_id ?? null,
    providerName: a.learning_providers?.name ?? null,
    displayName: a.display_name ?? null,
    externalAccountId: a.external_account_id ?? null,
    status: a.status,
    lastSyncedAt: a.last_synced_at ?? null,
    createdAt: a.created_at,
  }));
}

export async function disconnectAccount(accountId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('connected_learning_accounts' as any)
    .update({
      status: 'disconnected',
      // Defensively clear any token columns — this version never wrote to
      // them in the first place, but clear them on disconnect regardless.
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function createManualCourseLink(
  userId: string,
  data: {
    title: string;
    courseUrl: string;
    provider?: string;
    progressPercentage?: number;
    targetCompletionDate?: string;
  }
) {
  const progressPercentage = data.progressPercentage ?? 0;
  const status = progressPercentage >= 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started';

  // This is the universal fallback import path — works for ANY website,
  // no API or login required. Just stores a link + manually-entered progress.
  const { data: course, error } = await supabase
    .from('learning_courses' as any)
    .insert({
      user_id: userId,
      title: data.title,
      provider: data.provider || null,
      course_url: data.courseUrl,
      status,
      progress_percentage: progressPercentage,
      life_area: 'learning',
      target_completion_date: data.targetCompletionDate || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return course;
}
