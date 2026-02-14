"use client";

import { useState, useEffect } from "react";
import { 
  User, Bell, Shield, Palette, Globe, Save, Check, Mail, Phone, Building2, 
  Lock, Eye, EyeOff, Clock, Calendar, DollarSign, AlertTriangle, 
  Download, Upload, Database, Server, Moon, Sun, Monitor, Zap
} from "lucide-react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Profile Data
  const { data: profileData, error: profileError } = useSWR('/api/settings/profile', fetcher, {
    fallbackData: {
      name: "Ash Mohale",
      email: "ash@yeha.co.za",
      role: "FACILITATOR"
    }
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "+27 82 123 4567",
    organization: "YEHA - Youth Education",
    bio: "Passionate educator dedicated to empowering youth through quality training programs."
  });

  // Notification Settings
  const { data: notificationSettings, error: notificationError } = useSWR('/api/settings/notifications', fetcher);
  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    pushNotifications: true,
    attendanceAlerts: true,
    assessmentReminders: true,
    weeklyReports: false,
    dailyDigest: false,
    moderationAlerts: true,
    studentProgressUpdates: true,
  });

  // Reminder Preferences
  const { data: reminderSettings, error: reminderError } = useSWR('/api/settings/reminders', fetcher);
  const [reminderForm, setReminderForm] = useState({
    emailRemindersEnabled: false,
    browserNotificationsEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    timeZone: "Africa/Johannesburg",
  });

  // System Settings
  const { data: systemSettings, error: systemError } = useSWR('/api/settings/system', fetcher);
  const [systemForm, setSystemForm] = useState({
    organizationName: "YEHA - Youth Education",
    timezone: "Africa/Johannesburg",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    language: "en",
    currency: "ZAR",
    attendanceGracePeriod: 15,
    assessmentPassMark: 70,
    autoBackup: true,
    backupFrequency: "daily",
    maintenanceMode: false,
  });

  // Appearance Settings
  const { data: appearanceSettings, error: appearanceError } = useSWR('/api/settings/appearance', fetcher);
  const [appearanceForm, setAppearanceForm] = useState({
    theme: "light",
    colorScheme: "blue",
    sidebarPosition: "left",
    compactMode: false,
    fontSize: "medium",
    showAvatars: true,
    animationsEnabled: true,
  });

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Update forms when data loads
  useEffect(() => {
    const userData = profileData?.data || profileData;
    if (userData && userData.name) {
      setProfileForm(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
      }));
    }
  }, [profileData]);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationForm(notificationSettings);
    }
  }, [notificationSettings]);

  useEffect(() => {
    if (systemSettings) {
      setSystemForm(systemSettings);
    }
  }, [systemSettings]);

  useEffect(() => {
    if (appearanceSettings) {
      setAppearanceForm(appearanceSettings);
    }
  }, [appearanceSettings]);

  useEffect(() => {
    if (reminderSettings) {
      setReminderForm(reminderSettings);
    }
  }, [reminderSettings]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSavedSuccess(false);
    
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      await mutate('/api/settings/profile');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setSavedSuccess(false);
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notificationForm),
      });

      if (!response.ok) throw new Error('Failed to save notifications');

      await mutate('/api/settings/notifications');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving notifications:', error);
      alert('Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    setSaving(true);
    setSavedSuccess(false);
    
    try {
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(systemForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save system settings');
      }

      await mutate('/api/settings/system');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      alert(error.message || 'Failed to save system settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    setSaving(true);
    setSavedSuccess(false);
    
    try {
      const response = await fetch('/api/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appearanceForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save appearance settings');
      }

      await mutate('/api/settings/appearance');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving appearance settings:', error);
      alert(error.message || 'Failed to save appearance settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (securityForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    setSavedSuccess(false);
    
    try {
      const response = await fetch('/api/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(securityForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReminders = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/settings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reminderForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save reminder preferences');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving reminder preferences:', error);
      alert(error.message || 'Failed to save reminder preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "reminders", icon: Clock, label: "Reminders" },
    { id: "system", icon: Server, label: "System" },
    { id: "appearance", icon: Palette, label: "Appearance" },
    { id: "security", icon: Shield, label: "Security" },
  ];
  
  return (
    <>
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="p-8">
                {/* ...existing code... */}

                <div className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-blue-600 text-3xl font-semibold">
                      {profileForm.name ? profileForm.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AM'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Profile Photo</h4>
                      <p className="text-sm text-slate-600 mb-3">Upload a professional photo</p>
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Organization
                      </label>
                      <input
                        type="text"
                        value={profileForm.organization}
                        onChange={(e) => setProfileForm({...profileForm, organization: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={profileData?.role || "Facilitator"}
                        disabled
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg cursor-not-allowed"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {savedSuccess && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        Saved successfully!
                      </div>
                    )}
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="ml-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Notification Preferences</h3>
                  <p className="text-slate-600 dark:text-slate-400">Choose how you want to receive updates and alerts</p>
                </div>

                <div className="space-y-6">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: Mail },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser', icon: Bell },
                    { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Get notified about attendance issues', icon: AlertTriangle },
                    { key: 'assessmentReminders', label: 'Assessment Reminders', desc: 'Reminders for upcoming assessments', icon: Calendar },
                    { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly progress summary', icon: Calendar },
                    { key: 'dailyDigest', label: 'Daily Digest', desc: 'Daily summary of activities', icon: Mail },
                    { key: 'moderationAlerts', label: 'Moderation Alerts', desc: 'Alerts for items requiring moderation', icon: Shield },
                    { key: 'studentProgressUpdates', label: 'Student Progress Updates', desc: 'Notifications about student achievements', icon: User },
                  ].map((setting) => {
                    const Icon = setting.icon;
                    return (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{setting.label}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{setting.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotificationForm({
                            ...notificationForm,
                            [setting.key]: !notificationForm[setting.key as keyof typeof notificationForm]
                          })}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            notificationForm[setting.key as keyof typeof notificationForm]
                              ? 'bg-blue-600'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                              notificationForm[setting.key as keyof typeof notificationForm]
                                ? 'translate-x-7'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {savedSuccess && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        Saved successfully!
                      </div>
                    )}
                    <button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="ml-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === "system" && (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">System Configuration</h3>
                  <p className="text-slate-600 dark:text-slate-400">Manage system-wide settings and preferences</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={systemForm.organizationName}
                        onChange={(e) => setSystemForm({...systemForm, organizationName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Timezone
                      </label>
                      <select
                        value={systemForm.timezone}
                        onChange={(e) => setSystemForm({...systemForm, timezone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Date Format
                      </label>
                      <select
                        value={systemForm.dateFormat}
                        onChange={(e) => setSystemForm({...systemForm, dateFormat: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Time Format
                      </label>
                      <select
                        value={systemForm.timeFormat}
                        onChange={(e) => setSystemForm({...systemForm, timeFormat: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="12h">12-hour</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Language
                      </label>
                      <select
                        value={systemForm.language}
                        onChange={(e) => setSystemForm({...systemForm, language: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="af">Afrikaans</option>
                        <option value="zu">Zulu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Currency
                      </label>
                      <select
                        value={systemForm.currency}
                        onChange={(e) => setSystemForm({...systemForm, currency: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ZAR">ZAR (R)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Attendance Grace Period (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={systemForm.attendanceGracePeriod}
                        onChange={(e) => setSystemForm({...systemForm, attendanceGracePeriod: parseInt(e.target.value)})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Zap className="w-4 h-4 inline mr-2" />
                        Assessment Pass Mark (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={systemForm.assessmentPassMark}
                        onChange={(e) => setSystemForm({...systemForm, assessmentPassMark: parseInt(e.target.value)})}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Backup Settings */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      <Database className="w-5 h-5 inline mr-2" />
                      Backup Settings
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white">Automatic Backups</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Enable automatic database backups</p>
                        </div>
                        <button
                          onClick={() => setSystemForm({...systemForm, autoBackup: !systemForm.autoBackup})}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            systemForm.autoBackup ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                              systemForm.autoBackup ? 'translate-x-7' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {systemForm.autoBackup && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Backup Frequency
                          </label>
                          <select
                            value={systemForm.backupFrequency}
                            onChange={(e) => setSystemForm({...systemForm, backupFrequency: e.target.value})}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Maintenance Mode */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div>
                        <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          Maintenance Mode
                        </h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Temporarily disable system access</p>
                      </div>
                      <button
                        onClick={() => setSystemForm({...systemForm, maintenanceMode: !systemForm.maintenanceMode})}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          systemForm.maintenanceMode ? 'bg-yellow-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            systemForm.maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {savedSuccess && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        Saved successfully!
                      </div>
                    )}
                    <button
                      onClick={handleSaveSystem}
                      disabled={saving}
                      className="ml-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Appearance Settings</h3>
                  <p className="text-slate-600 dark:text-slate-400">Customize the look and feel of your interface</p>
                </div>

                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'auto', label: 'Auto', icon: Monitor },
                      ].map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <button
                            key={theme.value}
                            onClick={() => setAppearanceForm({...appearanceForm, theme: theme.value})}
                            className={`p-4 border-2 rounded-lg transition-colors ${
                              appearanceForm.theme === theme.value
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                            }`}
                          >
                            <Icon className={`w-6 h-6 mx-auto mb-2 ${
                              appearanceForm.theme === theme.value ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'
                            }`} />
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{theme.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Color Scheme
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'blue', color: 'bg-blue-600' },
                        { value: 'purple', color: 'bg-purple-600' },
                        { value: 'green', color: 'bg-green-600' },
                        { value: 'orange', color: 'bg-orange-600' },
                        { value: 'red', color: 'bg-red-600' },
                      ].map((scheme) => (
                        <button
                          key={scheme.value}
                          onClick={() => setAppearanceForm({...appearanceForm, colorScheme: scheme.value})}
                          className={`w-12 h-12 rounded-lg ${scheme.color} ${
                            appearanceForm.colorScheme === scheme.value
                              ? 'ring-4 ring-slate-300 dark:ring-slate-600'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Font Size
                    </label>
                    <select
                      value={appearanceForm.fontSize}
                      onChange={(e) => setAppearanceForm({...appearanceForm, fontSize: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-4">
                    {[
                      { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing for more content' },
                      { key: 'showAvatars', label: 'Show Avatars', desc: 'Display user profile pictures' },
                      { key: 'animationsEnabled', label: 'Enable Animations', desc: 'Smooth transitions and effects' },
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white">{setting.label}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{setting.desc}</p>
                        </div>
                        <button
                          onClick={() => setAppearanceForm({
                            ...appearanceForm,
                            [setting.key]: !appearanceForm[setting.key as keyof typeof appearanceForm]
                          })}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            appearanceForm[setting.key as keyof typeof appearanceForm]
                              ? 'bg-blue-600'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                              appearanceForm[setting.key as keyof typeof appearanceForm]
                                ? 'translate-x-7'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {savedSuccess && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        Saved successfully!
                      </div>
                    )}
                    <button
                      onClick={handleSaveAppearance}
                      disabled={saving}
                      className="ml-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Appearance'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === "reminders" && (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reminder Preferences</h3>
                  <p className="text-slate-600 dark:text-slate-400">Configure how you receive reminders for lessons and plans</p>
                </div>

                <div className="space-y-6">
                  {/* Email Reminders */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Email Reminders</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderForm.emailRemindersEnabled}
                          onChange={(e) => setReminderForm({...reminderForm, emailRemindersEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive email notifications for upcoming lessons and plans
                    </p>
                  </div>

                  {/* Browser Notifications */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-green-600" />
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Browser Notifications</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderForm.browserNotificationsEnabled}
                          onChange={(e) => setReminderForm({...reminderForm, browserNotificationsEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pop-up notifications on your browser for instant alerts
                    </p>
                  </div>

                  {/* Quiet Hours */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Moon className="w-5 h-5" />
                      Quiet Hours
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">No reminders will be sent during these hours</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={reminderForm.quietHoursStart}
                          onChange={(e) => setReminderForm({...reminderForm, quietHoursStart: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={reminderForm.quietHoursEnd}
                          onChange={(e) => setReminderForm({...reminderForm, quietHoursEnd: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Timezone
                    </label>
                    <select
                      value={reminderForm.timeZone}
                      onChange={(e) => setReminderForm({...reminderForm, timeZone: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Africa/Johannesburg">South Africa (SAST)</option>
                      <option value="Africa/Cairo">Egypt (EAT)</option>
                      <option value="Africa/Lagos">Nigeria (WAT)</option>
                      <option value="Africa/Nairobi">Kenya (EAT)</option>
                      <option value="Europe/London">UK (GMT/BST)</option>
                      <option value="Europe/Paris">Europe (CET/CEST)</option>
                      <option value="America/New_York">USA - Eastern (EST/EDT)</option>
                      <option value="America/Chicago">USA - Central (CST/CDT)</option>
                      <option value="America/Denver">USA - Mountain (MST/MDT)</option>
                      <option value="America/Los_Angeles">USA - Pacific (PST/PDT)</option>
                      <option value="Asia/Dubai">UAE (GST)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Asia/Tokyo">Japan (JST)</option>
                      <option value="Australia/Sydney">Australia (AEDT/AEST)</option>
                    </select>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    {savedSuccess && (
                      <div className="mr-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Saved successfully!</span>
                      </div>
                    )}
                    <button
                      onClick={handleSaveReminders}
                      disabled={saving}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Security Settings</h3>
                  <p className="text-slate-600 dark:text-slate-400">Manage your password and security preferences</p>
                </div>

                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      <Lock className="w-5 h-5 inline mr-2" />
                      Change Password
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={securityForm.currentPassword}
                            onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                            className="w-full px-4 py-2.5 pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                            className="w-full px-4 py-2.5 pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={securityForm.confirmPassword}
                          onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      <Shield className="w-5 h-5 inline mr-2" />
                      Password Requirements
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li>• At least 8 characters long</li>
                      <li>• Include uppercase and lowercase letters</li>
                      <li>• Include at least one number</li>
                      <li>• Include at least one special character</li>
                    </ul>
                  </div>

                  {savedSuccess && (
                    <div className="flex items-center gap-2 text-green-600 font-medium p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Check className="w-5 h-5" />
                      Password changed successfully!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
