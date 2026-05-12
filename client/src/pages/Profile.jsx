import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { User, Building, Mail, Phone, MapPin, FileText, Key, Shield, Edit2, ChevronRight, X, Check, Copy } from 'lucide-react';

const infoItems = (u) => [
  { label: 'Email', value: u.email, icon: Mail, bg: 'bg-primary-50', iconColor: 'text-primary-500', key: 'email', readOnly: true },
  { label: 'Phone', value: u.phone || '-', icon: Phone, bg: 'bg-emerald-50', iconColor: 'text-emerald-500', key: 'phone' },
  { label: 'Address', value: u.address || '-', icon: MapPin, bg: 'bg-orange-50', iconColor: 'text-orange-500', key: 'address' },
  { label: 'GSTIN', value: u.gstin || '-', icon: FileText, bg: 'bg-blue-50', iconColor: 'text-blue-500', key: 'gstin' },
  { label: 'User ID', value: u.userId, icon: Building, bg: 'bg-indigo-50', iconColor: 'text-indigo-500', key: 'userId', readOnly: true },
  { label: 'Wallet Balance', value: `₹${u.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: Key, bg: 'bg-teal-50', iconColor: 'text-teal-500', isBalance: true, readOnly: true },
];

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [copied, setCopied] = useState(false);

  const startEditing = () => {
    const u = profile.user;
    setEditForm({ name: u.name, company: u.company, phone: u.phone || '', address: u.address || '', gstin: u.gstin || '' });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    setSubmitting(true);
    try {
      await API.put('/users/profile', editForm);
      toast.success('Profile updated');
      setEditing(false);
      refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.put('/users/change-password', { oldPassword, newPassword });
      toast.success('Password changed');
      setShowPwForm(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(profile.user.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile?.user) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  const u = profile.user;
  const items = infoItems(u);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Profile</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Manage your account information and preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
        <div className="p-6 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200/60 rounded-full flex items-center justify-center">
                <User size={28} className="text-primary-500" />
              </div>
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-xl font-extrabold text-slate-900 tracking-tight bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full" />
                    <input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="text-[13px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full" placeholder="Company" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{u.name}</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">Active</span>
                    </div>
                    <p className="text-[13px] text-slate-400 mt-0.5">{u.company}</p>
                  </>
                )}
              </div>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <X size={16} className="text-slate-400" />
                </button>
                <button onClick={handleSaveProfile} disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 disabled:opacity-50 active:scale-[0.97] transition-all">
                  <Check size={14} /> {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={startEditing} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Edit2 size={13} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Phone', key: 'phone', icon: Phone, bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
                { label: 'Address', key: 'address', icon: MapPin, bg: 'bg-orange-50', iconColor: 'text-orange-500' },
                { label: 'GSTIN', key: 'gstin', icon: FileText, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
              ].map(({ label, key, icon: Icon, bg, iconColor }) => (
                <div key={key} className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/70">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">{label}</p>
                    <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full text-[14px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 transition-colors" />
                  </div>
                </div>
              ))}
              {items.filter(i => i.readOnly).map(({ label, value, icon: Icon, bg, iconColor, isBalance }) => (
                <div key={label} className={`flex items-center gap-3.5 p-4 rounded-xl ${isBalance ? 'bg-teal-50/50 ring-1 ring-teal-100' : 'bg-slate-50/70'} opacity-60`}>
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
                    <p className={`text-[14px] font-semibold truncate ${isBalance ? 'text-teal-700 text-[17px] font-bold' : 'text-slate-800'}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map(({ label, value, icon: Icon, bg, iconColor, isBalance }) => (
                <div key={label} className={`flex items-center gap-3.5 p-4 rounded-xl ${isBalance ? 'bg-teal-50/50 ring-1 ring-teal-100' : 'bg-slate-50/70'}`}>
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
                    <p className={`text-[14px] font-semibold truncate ${isBalance ? 'text-teal-700 text-[17px] font-bold' : 'text-slate-800'}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-fade-in">
        {!showPwForm ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Change Password</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Update your password regularly</p>
              </div>
            </div>
            <button
              onClick={() => setShowPwForm(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-[13px] font-semibold hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/20 active:scale-[0.97] transition-all duration-200"
            >
              Change Password <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50">
                <Shield size={20} className="text-white" />
              </div>
              <h2 className="text-[15px] font-bold text-slate-900">Change Password</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Current Password</label>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 placeholder:text-slate-300 hover:border-slate-300 transition-colors" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 placeholder:text-slate-300 hover:border-slate-300 transition-colors" placeholder="Enter new password" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPwForm(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-[13px] font-semibold hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/20 disabled:opacity-50 active:scale-[0.97] transition-all duration-200">
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {u.api_enabled && u.api_key && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">API Access</h2>
              <p className="text-[13px] text-slate-400 mt-0.5">Your API key for programmatic access</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">Enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-50/70 px-4 py-3 rounded-xl text-[13px] font-mono break-all text-slate-700 ring-1 ring-slate-100">{u.api_key}</code>
            <button onClick={copyApiKey} className="shrink-0 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors" title="Copy">
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
