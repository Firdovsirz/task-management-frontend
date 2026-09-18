'use client';

import { KeyRound, Mail } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/topbar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandMark, Button, Card, CardHeader, Field, Input, Select } from '@/components/ui';
import { apiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useChangePassword, useUpdateProfile } from '@/lib/queries';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function ProfilePage() {
  const { user, refresh, login } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmailNotifications(user.emailNotifications);
  }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync({ fullName: fullName.trim(), emailNotifications });
      await refresh();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(apiError(error, 'The profile could not be saved.'));
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('The new passwords do not match.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      // The server retires every token issued before the change - this session's included - so
      // sign straight back in with the new password rather than being bounced to the login page.
      if (user) await login(user.email, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed - other sessions have been signed out');
    } catch (error) {
      toast.error(apiError(error, 'The password could not be changed.'));
    }
  }

  return (
    <>
      <Topbar title="Profile" subtitle="Your account, reminders and appearance" />

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[820px] space-y-6">
          <div className="flex items-center gap-5">
            <BrandMark className="h-14 w-14 text-ink-800" />
            <div className="min-w-0">
              <p className="eyebrow">Owner</p>
              <h2 className="serif mt-1 truncate text-[32px] leading-tight text-ink-900">{user?.fullName}</h2>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-[12px] text-ink-500">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
            </div>
          </div>

          <p className="font-mono text-[11px] text-ink-400">
            {user?.createdAt && <>Workspace since {formatDate(user.createdAt)}</>}
            {user?.lastLoginAt && <> · last sign-in {formatDateTime(user.lastLoginAt)}</>}
          </p>

          <Card>
            <CardHeader title="Details" />
            <form onSubmit={saveProfile} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                </Field>
                <Field label="Deadline reminders" hint="Every morning, for tasks due today or tomorrow">
                  <Select
                    value={emailNotifications ? 'true' : 'false'}
                    onChange={(event) => setEmailNotifications(event.target.value === 'true')}
                  >
                    <option value="true">In the app and by e-mail</option>
                    <option value="false">In the app only</option>
                  </Select>
                </Field>
              </div>
              <p className="text-xs leading-relaxed text-ink-400">
                The sign-in e-mail comes from <span className="font-mono text-ink-500">OWNER_EMAIL</span> on the
                server - change it there and restart to use a different address.
              </p>
              <div className="flex justify-end">
                <Button type="submit" loading={updateProfile.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Appearance" />
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[14px] text-ink-900">Theme</p>
                <p className="text-[12.5px] text-ink-500">Light, dark, or follow the system - like firdovsirzaev.online.</p>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          <Card>
            <CardHeader title="Password" icon={<KeyRound className="h-3.5 w-3.5" />} />
            <form onSubmit={savePassword} className="space-y-4 p-5">
              <Field label="Current password" required>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" required hint="At least 8 characters">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
                <Field label="Repeat new password" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={changePassword.isPending}>
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
