/**
 * Network status manager.
 * Tracks online/offline state and provides reactive hooks.
 */

type NetworkListener = (isOnline: boolean) => void;

class NetworkStatusManager {
  private listeners = new Set<NetworkListener>();
  private _isOnline: boolean;

  constructor() {
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setStatus(true));
      window.addEventListener('offline', () => this.setStatus(false));
    }
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  private setStatus(online: boolean): void {
    if (this._isOnline === online) return;
    this._isOnline = online;
    this.listeners.forEach((fn) => fn(online));
  }

  /** Subscribe to network status changes */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Perform a connectivity check by pinging the server */
  async checkConnectivity(serverUrl?: string): Promise<boolean> {
    try {
      const url = serverUrl || '/api/auth/me';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);
      this.setStatus(true);
      return res.ok || res.status === 401; // 401 = server reachable but not authed
    } catch {
      this.setStatus(false);
      return false;
    }
  }
}

export const networkStatus = new NetworkStatusManager();
