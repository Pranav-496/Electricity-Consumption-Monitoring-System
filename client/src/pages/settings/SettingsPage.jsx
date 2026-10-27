import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Save, LogOut } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const SettingsPage = () => {
  const { user, logout, isAdmin, refreshProfile } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Alert settings state (Admin only)
  const [alertSettings, setAlertSettings] = useState({
    high_consumption_threshold: 500,
    percentage_increase_threshold: 50,
    overdue_days_threshold: 1
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);

    if (isAdmin) {
      const fetchAlertSettings = async () => {
        try {
          setIsLoadingSettings(true);
          const res = await api.get('/alerts/settings');
          if (res.data) setAlertSettings(res.data);
        } catch (err) {
          console.error('Failed to load alert rules', err);
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchAlertSettings();
    }
  }, [user, isAdmin]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await api.patch('/auth/profile', { full_name: fullName });
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSaveAlertRules = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.patch('/alerts/settings', {
        high_consumption_threshold: Number(alertSettings.high_consumption_threshold),
        percentage_increase_threshold: Number(alertSettings.percentage_increase_threshold),
        overdue_days_threshold: Number(alertSettings.overdue_days_threshold)
      });
      toast.success('Alert threshold rules updated successfully');
    } catch (err) {
      toast.error('Failed to update alert rules: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System & Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your portal identity, security credentials, and grid monitoring threshold rules.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">User Profile Information</h2>
            <p className="text-xs text-slate-500">Your registered account credentials and authentication role</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Authentication Role
              </label>
              <div className="mt-1">
                <Badge variant={user?.role}>{user?.role?.toUpperCase()}</Badge>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Username
              </label>
              <p className="font-mono text-sm font-semibold text-slate-800 mt-1">{user?.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Email is managed via authentication security provider"
            />

            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Johnathan Doe"
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isUpdatingProfile} icon={Save}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Grid Alert Rules Configuration (Admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Configurable Alert Rules & Thresholds</h2>
              <p className="text-xs text-slate-500">
                Set dynamic limits that trigger High Consumption and Abnormal Usage notices
              </p>
            </div>
          </div>

          {isLoadingSettings ? (
            <div className="py-6 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <form onSubmit={handleSaveAlertRules} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="High Consumption Limit (kWh)"
                  type="number"
                  step="1"
                  value={alertSettings.high_consumption_threshold}
                  onChange={(e) => setAlertSettings({ ...alertSettings, high_consumption_threshold: e.target.value })}
                  helperText="Absolute monthly threshold"
                  required
                />

                <Input
                  label="Surge Increase Threshold (%)"
                  type="number"
                  step="1"
                  value={alertSettings.percentage_increase_threshold}
                  onChange={(e) => setAlertSettings({ ...alertSettings, percentage_increase_threshold: e.target.value })}
                  helperText="% spike over prior period"
                  required
                />

                <Input
                  label="Overdue Grace Period (Days)"
                  type="number"
                  step="1"
                  value={alertSettings.overdue_days_threshold}
                  onChange={(e) => setAlertSettings({ ...alertSettings, overdue_days_threshold: e.target.value })}
                  helperText="Days after due date"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" isLoading={isSavingSettings} icon={Save}>
                  Update Alert Rules
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Danger / Session Zone */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">End Active Session</h2>
          <p className="text-xs text-slate-500 mt-0.5">Disconnect credentials and clear persistent browser state</p>
        </div>
        <Button variant="danger" onClick={logout} icon={LogOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
