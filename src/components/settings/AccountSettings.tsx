'use client';

import { useState, type FormEvent } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MIN_PASSWORD_LENGTH = 6;

async function send(url: string, method: 'POST' | 'DELETE', body: Record<string, string>) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

const labelClass = 'text-xs text-on-surface-variant/80 block mb-1.5';

/** Change email, change password, and delete the account. */
export default function AccountSettings() {
  const { user, setUser, logout } = useStore();
  const { addToast } = useToast();
  const [busy, setBusy] = useState<null | 'email' | 'password' | 'delete'>(null);

  const [email, setEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('email');
    try {
      const data = await send('/api/auth/email', 'POST', { email, password: emailPassword });
      if (data.user) setUser(data.user);
      setEmailPassword('');
      addToast('Email updated', 'success', 2500);
    } catch (err) {
      addToast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('The new passwords don’t match', 'error');
      return;
    }
    setBusy('password');
    try {
      await send('/api/auth/password', 'POST', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password changed. Your other devices were signed out.', 'success', 3500);
    } catch (err) {
      addToast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('delete');
    try {
      await send('/api/auth/account', 'DELETE', { password: deletePassword, confirm: deleteConfirm });
      await logout(); // clears this device's offline copy too
      window.location.href = '/';
    } catch (err) {
      addToast((err as Error).message, 'error');
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="space-y-4">
        <h3 className="text-sm font-medium text-on-surface">Email</h3>
        <form onSubmit={changeEmail} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="account-email">Email address</label>
            <Input id="account-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="account-email-password">Current password</label>
            <Input id="account-email-password" type="password" autoComplete="current-password" required value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="primary" className="w-full" disabled={busy !== null || email.trim() === user?.email}>
            {busy === 'email' ? 'Saving…' : 'Change email'}
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-sm font-medium text-on-surface">Password</h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="account-current-password">Current password</label>
            <Input id="account-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="account-new-password">New password</label>
            <Input id="account-new-password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="account-confirm-password">Confirm new password</label>
            <Input id="account-confirm-password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <p className="text-xs text-on-surface-variant/80">Changing your password signs out every other device.</p>
          <Button type="submit" variant="primary" className="w-full" disabled={busy !== null}>
            {busy === 'password' ? 'Saving…' : 'Change password'}
          </Button>
        </form>
      </Card>

      <Card className="space-y-4 border border-error/40">
        <h3 className="text-sm font-medium text-error">Delete account</h3>
        <p className="text-sm text-on-surface-variant">
          Permanently deletes your account and everything in it: day records, tasks, habits, goals,
          plans, journeys, money, learning and reviews. This can’t be undone. You can download a copy
          first under <span className="text-on-surface">Data &amp; Backup</span>.
        </p>
        <form onSubmit={deleteAccount} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="account-delete-password">Current password</label>
            <Input id="account-delete-password" type="password" autoComplete="current-password" required value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="account-delete-confirm">
              Type <span className="font-mono text-error">DELETE</span> to confirm
            </label>
            <Input id="account-delete-confirm" type="text" autoComplete="off" required value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          </div>
          <Button type="submit" variant="danger" className="w-full" disabled={busy !== null || deleteConfirm !== 'DELETE' || !deletePassword}>
            {busy === 'delete' ? 'Deleting…' : 'Delete my account'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
