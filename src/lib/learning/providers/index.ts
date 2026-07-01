import type { LearningProviderAdapter } from './types';
import { manualProvider } from './manualProvider';

export { manualProvider };

const providers: Record<string, LearningProviderAdapter> = {
  manual: manualProvider,
};

// Future OAuth/API-key providers (e.g. Coursera, Udemy) register themselves
// in this map once a real authorization flow is implemented. For now only
// the no-op manual provider is available.
export function getProvider(id: string): LearningProviderAdapter | undefined {
  return providers[id];
}
