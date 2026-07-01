export interface LearningProviderAdapter {
  id: string;
  name: string;
  supportsOAuth: boolean;
  connect(): Promise<{ success: boolean; message?: string }>;
  disconnect(connectedAccountId: string): Promise<void>;
  syncCourses(connectedAccountId: string): Promise<unknown[]>;
  syncProgress(connectedAccountId: string): Promise<void>;
}
