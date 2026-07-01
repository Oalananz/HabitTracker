import type { LearningProviderAdapter } from './types';

// Manual provider adapter — this is the universal fallback that works for
// ANY learning website. It never makes network calls, never asks for or
// stores credentials, and never touches cookies or tokens. "Connecting"
// this provider is a no-op; users add course links directly instead.
export const manualProvider: LearningProviderAdapter = {
  id: 'manual',
  name: 'Manual Course Link',
  supportsOAuth: false,

  async connect() {
    return {
      success: true,
      message: 'Manual tracking does not require a connection step — add a course link directly.',
    };
  },

  async disconnect(_connectedAccountId: string): Promise<void> {
    // No-op: manual tracking never establishes a real connection.
  },

  async syncCourses(_connectedAccountId: string): Promise<unknown[]> {
    // No-op: manual tracking never auto-syncs.
    return [];
  },

  async syncProgress(_connectedAccountId: string): Promise<void> {
    // No-op: manual tracking never auto-syncs.
  },
};
