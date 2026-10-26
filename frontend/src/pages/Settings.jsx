import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, User, Bell, HelpCircle, Key, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [toastText, setToastText] = useState('');
  
  // Dummy Settings Fields
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [matchingAlerts, setMatchingAlerts] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const triggerToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast('Passwords do not match.');
      return;
    }
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerToast('Password reset successfully (Mocked).');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-xs font-semibold">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure account options, notifications, and reset your password</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Status Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <User size={14} className="text-primary-500" />
              Account Status
            </h3>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Username</span>
              <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-3">Registered Email</span>
              <p className="font-bold text-slate-800 truncate">{user.email}</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-3">Access Tier</span>
              <p className="font-bold text-primary-600 capitalize mt-0.5">{user.role} Authorization</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <HelpCircle size={14} className="text-primary-500" />
              Support & Help
            </h3>
            <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <p>For questions or assistance regarding CareerFlow resume parsers or PDF layouts, contact our support team:</p>
              <a href="mailto:support@careerflow.com" className="text-primary-600 font-bold block hover:underline">support@careerflow.com</a>
            </div>
          </div>
        </div>

        {/* Center/Right Side: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Notification toggles */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Bell size={14} className="text-primary-500" />
              Preferences
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Email Alerts</h4>
                  <p className="text-slate-400 mt-0.5">Receive reminders when interview stages update</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 rounded border-slate-350"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Recommended Job Matching</h4>
                  <p className="text-slate-400 mt-0.5">Alert me when a job matches my profile skills</p>
                </div>
                <input
                  type="checkbox"
                  checked={matchingAlerts}
                  onChange={(e) => setMatchingAlerts(e.target.checked)}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 rounded border-slate-350"
                />
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Key size={14} className="text-primary-500" />
              Change Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label>Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="block w-full mt-1 bg-slate-50 border rounded-xl px-3.5 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full mt-1 bg-slate-50 border rounded-xl px-3.5 py-2"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full mt-1 bg-slate-50 border rounded-xl px-3.5 py-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4.5 py-2.5 text-xs font-bold text-white bg-navy-800 hover:bg-navy-950 rounded-xl transition-colors"
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
