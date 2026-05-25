'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';

export default function SettingsPage() {
  const { user, logout } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const username = user?.username || '';
  const statusMsg = user?.statusMessage || '';

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleSaveProfile = useCallback(async () => {
    const usernameInput = document.getElementById('settings-username') as HTMLInputElement;
    const statusInput = document.getElementById('settings-status') as HTMLInputElement;
    if (!usernameInput) return;

    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          statusMessage: statusInput?.value?.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      useStore.getState().setUser(data.user);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, []);

  const handleClearAllData = useCallback(async () => {
    setShowClearConfirm(false);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
    } catch {
      // silently fail
    }
  }, []);

  return (
    <div className="space-y-8 animate-page-enter">
        <header className="flex justify-between items-start">
          <div>
            <div className="font-label text-xs uppercase tracking-widest text-primary mb-2">&gt; TERMINAL_CONFIG</div>
            <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tighter text-on-surface uppercase">
              Configuration
            </h1>
            <p className="font-body text-on-surface-variant mt-2">
              Adjust system parameters, interface preferences, and data sovereignty controls.
              Changes are staged until committed.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">person</span>
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/profile</h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant">account_circle</span>
              </div>
              <button className="px-3 py-1.5 bg-surface-container-high border border-outline-variant/20 rounded-sm font-label text-xs uppercase text-on-surface-variant hover:text-primary transition-colors">
                UPDATE_AVATAR
              </button>
            </div>

            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">USERNAME_ALIAS</label>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2">
                <span className="text-primary font-mono text-sm">&gt;</span>
                <input
                  type="text"
                  defaultValue={username}
                  className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
                  id="settings-username"
                />
              </div>
            </div>

            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">STATUS_MESSAGE</label>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2">
                <span className="text-primary font-mono text-sm">&gt;</span>
                <input
                  type="text"
                  defaultValue={statusMsg}
                  className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                  placeholder="Compiling habits..."
                  id="settings-status"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full px-4 py-2 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </div>

          {/* Notifications */}
          <div className="space-y-6">
            <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">notifications</span>
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/notifications</h3>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-label text-xs uppercase tracking-wider text-on-surface">MILESTONE_ALERTS</div>
                  <div className="font-body text-xs text-on-surface-variant mt-0.5">System broadcasts on streak achievements.</div>
                </div>
                <div className="toggle-switch active" />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-label text-xs uppercase tracking-wider text-on-surface">DAILY_CRON_REMINDERS</div>
                  <div className="font-body text-xs text-on-surface-variant mt-0.5">Automated ping for incomplete dailies.</div>
                </div>
                <div className="toggle-switch active" />
              </div>
            </div>

            {/* Data */}
            <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary">database</span>
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/data</h3>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant/20 rounded-sm font-label text-xs uppercase text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  EXPORT_LOGS (.json)
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant/20 rounded-sm font-label text-xs uppercase text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  IMPORT_BACKUP
                </button>
              </div>

              {/* Danger Zone */}
              <div className="bg-error-container/10 border border-error/20 rounded-sm p-4 mt-4">
                <div className="font-label text-xs uppercase tracking-wider text-error font-bold mb-2">DANGER_ZONE: PURGE_ALL_RECORDS</div>
                <p className="font-body text-xs text-on-surface-variant mb-3">
                  Warning: Executing this command will irreversibly wipe all habit history, streaks, and system configurations. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full px-4 py-2.5 border border-error/30 rounded-sm font-headline font-bold text-xs uppercase tracking-wider text-error hover:bg-error/10 transition-colors"
                >
                  EXECUTE SUDO RM -RF /HABITS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
          <div className="font-mono text-[10px] text-outline">
            SYSTEM_VERSION: v1.0.0-stable
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-on-surface-variant hover:text-error transition-colors font-label text-xs uppercase tracking-wider"
            id="settings-logout"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            TERMINATE SESSION
          </button>
        </div>

        {showClearConfirm && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] animate-fade-in"
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="bg-surface-container border border-error/30 rounded-md p-6 max-w-sm w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
                  Confirm Clear
                </h3>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-5">
                This will permanently delete all habit history, streaks, and system configurations. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-xs font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllData}
                  className="px-4 py-2 bg-error text-on-error text-xs font-label uppercase font-bold rounded-sm hover:bg-error/90 transition-colors"
                >
                  Confirm Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
