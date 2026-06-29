'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { clearAllLocalData } from '@/lib/offline/db';
import { LIFE_AREAS } from '@/lib/lifeAreas';
import { useToast } from '@/store/useToast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, userPreferences, fetchUserPreferences, saveUserPreferences, setUser } = useStore();
  const { addToast } = useToast();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Controlled profile inputs
  const [username, setUsername] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Preferences (sourced from the store once loaded)
  const [focusGoal, setFocusGoal] = useState(6);
  const [sleepGoal, setSleepGoal] = useState(7);
  const [alerts, setAlerts] = useState(true);

  useEffect(() => {
    setUsername(user?.username || '');
    setStatusMsg(user?.statusMessage || '');
  }, [user]);

  useEffect(() => {
    void fetchUserPreferences();
  }, [fetchUserPreferences]);

  useEffect(() => {
    if (userPreferences) {
      setFocusGoal(userPreferences.focusGoalHours);
      setSleepGoal(userPreferences.sleepGoalHours);
      setAlerts(userPreferences.achievementAlerts);
    }
  }, [userPreferences]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), statusMessage: statusMsg.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setUser(data.user);
      addToast('Profile saved', 'success', 2000);
    } catch {
      addToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async () => {
    setSaving(true);
    try {
      await saveUserPreferences({ focusGoalHours: focusGoal, sleepGoalHours: sleepGoal, achievementAlerts: alerts });
      addToast('Preferences saved', 'success', 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleRerunOnboarding = async () => {
    await saveUserPreferences({ onboardingCompleted: false });
    try { localStorage.removeItem('lifeAreasOnboardingDismissed'); } catch { /* ignore */ }
    router.push('/onboarding');
  };

  const handleClearLocalCache = async () => {
    setShowClearConfirm(false);
    await clearAllLocalData();
    addToast('Local cache cleared — re-syncing…', 'info', 2500);
    window.location.href = '/today';
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const focusAreas = userPreferences?.focusAreas || [];

  return (
    <div className="space-y-8 animate-page-enter">
      <header>
        <div className="font-label text-xs uppercase tracking-widest text-primary mb-2">&gt; TERMINAL_CONFIG</div>
        <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tighter text-on-surface uppercase">Configuration</h1>
        <p className="font-body text-on-surface-variant mt-2">Adjust your profile, goals, focus areas, and local data.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/profile</h3>
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">USERNAME_ALIAS</label>
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
              <span className="text-primary font-mono text-sm">&gt;</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0" id="settings-username" />
            </div>
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">STATUS_MESSAGE</label>
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
              <span className="text-primary font-mono text-sm">&gt;</span>
              <input type="text" value={statusMsg} onChange={(e) => setStatusMsg(e.target.value)} className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0" placeholder="Compiling habits..." id="settings-status" />
            </div>
          </div>

          <button onClick={handleSaveProfile} disabled={saving} className="w-full px-4 py-2 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Goals & Preferences */}
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/preferences</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">FOCUS_GOAL (h)</label>
                <input type="number" min={0} max={24} step={0.5} value={focusGoal} onChange={(e) => setFocusGoal(parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-on-surface text-sm focus:border-primary/50 focus:ring-0" />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">SLEEP_GOAL (h)</label>
                <input type="number" min={0} max={24} step={0.5} value={sleepGoal} onChange={(e) => setSleepGoal(parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-on-surface text-sm focus:border-primary/50 focus:ring-0" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="font-label text-xs uppercase tracking-wider text-on-surface">ACHIEVEMENT_ALERTS</div>
                <div className="font-body text-xs text-on-surface-variant mt-0.5">Toasts when you unlock achievements.</div>
              </div>
              <button onClick={() => setAlerts((a) => !a)} className={`toggle-switch ${alerts ? 'active' : ''}`} aria-pressed={alerts} />
            </div>

            <button onClick={handleSavePrefs} disabled={saving} className="w-full px-4 py-2 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              SAVE PREFERENCES
            </button>
          </div>

          {/* Life Areas / onboarding */}
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">grid_view</span>
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/life_areas</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIFE_AREAS.map((area) => {
                const on = focusAreas.length === 0 || focusAreas.includes(area.id);
                return (
                  <span key={area.id} className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px]" style={{ color: on ? area.color : '#8a8f98', backgroundColor: on ? `${area.color}1a` : 'transparent', border: `1px solid ${on ? `${area.color}40` : 'rgba(255,255,255,0.08)'}` }}>
                    {area.shortLabel}
                  </span>
                );
              })}
            </div>
            <button onClick={handleRerunOnboarding} className="w-full px-4 py-2.5 bg-surface-container-high border border-outline-variant/20 rounded-sm font-label text-xs uppercase text-on-surface-variant hover:text-primary transition-colors">
              Re-run setup / edit focus areas
            </button>
          </div>

          {/* Data */}
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-tertiary">database</span>
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; system/data</h3>
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              Clears this device&apos;s offline cache and re-syncs from the server. Your account data is not deleted.
            </p>
            <button onClick={() => setShowClearConfirm(true)} className="w-full px-4 py-2.5 border border-outline-variant/30 rounded-sm font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
              Clear local cache & re-sync
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
        <div className="font-mono text-[10px] text-outline">SYSTEM_VERSION: v2.0.0</div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-on-surface-variant hover:text-error transition-colors font-label text-xs uppercase tracking-wider" id="settings-logout">
          <span className="material-symbols-outlined text-[16px]">logout</span>
          TERMINATE SESSION
        </button>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] animate-fade-in" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-surface-container border border-outline-variant/30 rounded-md p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-tertiary text-[20px]">cached</span>
              <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">Clear local cache</h3>
            </div>
            <p className="font-body text-sm text-on-surface-variant mb-5">
              This clears offline data stored on this device and re-pulls from the server. Unsynced offline changes will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-xs font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
              <button onClick={handleClearLocalCache} className="px-4 py-2 bg-tertiary text-on-tertiary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-colors">Clear Cache</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
