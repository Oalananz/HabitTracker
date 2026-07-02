'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { clearAllLocalData } from '@/lib/offline/db';
import { LIFE_AREAS } from '@/lib/lifeAreas';
import { useToast } from '@/store/useToast';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/components/ui/useConfirm';

type SettingsTab = 'profile' | 'preferences' | 'life-areas' | 'data' | 'appearance' | 'advanced';

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: 'person' },
  { key: 'preferences', label: 'Preferences', icon: 'tune' },
  { key: 'life-areas', label: 'Life Areas', icon: 'grid_view' },
  { key: 'data', label: 'Data & Backup', icon: 'cloud_done' },
  { key: 'appearance', label: 'Appearance', icon: 'palette' },
  { key: 'advanced', label: 'Advanced', icon: 'build' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, userPreferences, fetchUserPreferences, saveUserPreferences, setUser } = useStore();
  const { addToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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
    if (!(await confirm({
      title: 'Clear local cache',
      message: "This clears offline data stored on this device and re-pulls from the server. Unsynced offline changes will be lost.",
      confirmLabel: 'Clear cache',
    }))) return;
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
    <div className="space-y-6 animate-page-enter">
      {ConfirmDialog}
      <PageHeader title="Settings" eyebrow="system/settings" description="Manage your profile, preferences, and data." />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-outline-variant/10 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-label border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-on-surface-variant/70 border-transparent hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card className="max-w-lg space-y-5">
          <div>
            <label className="text-xs text-on-surface-variant/80 block mb-1.5" htmlFor="settings-username">Username</label>
            <Input id="settings-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant/80 block mb-1.5" htmlFor="settings-status">Status message</label>
            <Input id="settings-status" type="text" value={statusMsg} onChange={(e) => setStatusMsg(e.target.value)} placeholder="What are you working on?" />
          </div>
          <Button variant="primary" onClick={handleSaveProfile} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </Card>
      )}

      {activeTab === 'preferences' && !userPreferences && (
        <Card className="max-w-lg space-y-3">
          <div className="h-4 w-32 animate-shimmer rounded-md" />
          <div className="h-9 w-full animate-shimmer rounded-sm" />
          <div className="h-9 w-full animate-shimmer rounded-sm" />
        </Card>
      )}

      {activeTab === 'preferences' && userPreferences && (
        <Card className="max-w-lg space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-on-surface-variant/80 block mb-1.5">Focus goal (hours/day)</label>
              <Input type="number" min={0} max={24} step={0.5} value={focusGoal} onChange={(e) => setFocusGoal(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant/80 block mb-1.5">Sleep goal (hours/night)</label>
              <Input type="number" min={0} max={24} step={0.5} value={sleepGoal} onChange={(e) => setSleepGoal(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-on-surface">Achievement alerts</div>
              <div className="text-xs text-on-surface-variant/80 mt-0.5">Toasts when you unlock achievements.</div>
            </div>
            <button onClick={() => setAlerts((a) => !a)} className={`toggle-switch ${alerts ? 'active' : ''}`} aria-pressed={alerts} />
          </div>
          <Button variant="primary" onClick={handleSavePrefs} disabled={saving} className="w-full">
            Save preferences
          </Button>
        </Card>
      )}

      {activeTab === 'life-areas' && (
        <Card className="max-w-lg space-y-4">
          <p className="text-sm text-on-surface-variant">Areas you're currently focused on. Others stay hidden from quick-add menus.</p>
          <div className="flex flex-wrap gap-1.5">
            {LIFE_AREAS.map((area) => {
              const on = focusAreas.length === 0 || focusAreas.includes(area.id);
              return (
                <span
                  key={area.id}
                  className="text-xs px-2 py-1 rounded-sm"
                  style={{
                    color: on ? area.color : 'var(--color-on-surface-variant)',
                    backgroundColor: on ? `${area.color}1a` : 'transparent',
                    border: `1px solid ${on ? `${area.color}40` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {area.shortLabel}
                </span>
              );
            })}
          </div>
          <Button variant="secondary" onClick={handleRerunOnboarding} className="w-full">
            Re-run setup / edit focus areas
          </Button>
        </Card>
      )}

      {activeTab === 'data' && (
        <Card className="max-w-lg space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[20px]">cloud_done</span>
            <span className="text-sm font-medium text-on-surface">Auto-sync is on</span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Your data saves locally first and syncs to the cloud automatically — when the
            app goes idle, when you switch tabs, or as soon as you're back online. There's
            nothing to back up manually.
          </p>
        </Card>
      )}

      {activeTab === 'appearance' && (
        <Card className="max-w-lg space-y-3">
          <p className="text-sm text-on-surface-variant">
            This app currently uses a single dark theme. More appearance options may be
            added here in the future.
          </p>
        </Card>
      )}

      {activeTab === 'advanced' && (
        <Card className="max-w-lg space-y-3">
          <h3 className="text-sm font-medium text-on-surface">Clear local cache & re-sync</h3>
          <p className="text-sm text-on-surface-variant">
            Clears this device's offline cache and re-syncs from the server. Your account
            data is not deleted.
          </p>
          <Button variant="secondary" onClick={handleClearLocalCache}>
            Clear local cache & re-sync
          </Button>
        </Card>
      )}

      {/* Logout */}
      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
        <div className="text-xs text-on-surface-variant/50">Version 2.0.0</div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-on-surface-variant hover:text-error transition-colors text-sm" id="settings-logout">
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Log out
        </button>
      </div>
    </div>
  );
}
