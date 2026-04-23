'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export default function SettingsPage() {
  const { user, logout } = useStore();
  const [username, setUsername] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setStatusMsg(user.statusMessage || '');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  value={statusMsg}
                  onChange={(e) => setStatusMsg(e.target.value)}
                  className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
                  placeholder="Compiling habits..."
                  id="settings-status"
                />
              </div>
            </div>
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
                <button className="w-full px-4 py-2.5 border border-error/30 rounded-sm font-headline font-bold text-xs uppercase tracking-wider text-error hover:bg-error/10 transition-colors">
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
      </div>
  );
}
