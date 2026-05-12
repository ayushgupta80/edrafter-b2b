import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/users/forgot-password', { email });
      toast.success('Reset code sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/users/verify-code', { email, resetCode });
      toast.success('Code verified');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/users/reset-password', { email, resetCode, newPassword, confirmPassword });
      toast.success('Password reset successfully! Please login.');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-50/60 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-4 shadow-xl shadow-primary-500/20">
            <FileText className="text-white" size={26} />
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-[13px] text-slate-400 mt-1">Recover access to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-600 transition-colors mb-6">
            <ArrowLeft size={15} /> Back to login
          </Link>

          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-primary-600' : 'bg-slate-100'}`} />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={sendCode} className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[14px] bg-slate-50/50 placeholder:text-slate-300"
                  placeholder="you@company.com" required />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl text-[14px] font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98] transition-all duration-200">
                {submitting ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyCode} className="space-y-5">
              <p className="text-[13px] text-slate-400">Enter the 6-digit code sent to <span className="font-medium text-slate-600">{email}</span></p>
              <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[18px] bg-slate-50/50 text-center tracking-[0.3em] font-semibold placeholder:text-slate-300"
                maxLength={6} placeholder="000000" required />
              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl text-[14px] font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all duration-200">
                {submitting ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[14px] bg-slate-50/50 placeholder:text-slate-300"
                  placeholder="Enter new password" required />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[14px] bg-slate-50/50 placeholder:text-slate-300"
                  placeholder="Confirm new password" required />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl text-[14px] font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all duration-200">
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-100">
                <CheckCircle size={26} className="text-emerald-600" />
              </div>
              <p className="text-[15px] font-semibold text-slate-900 mb-1">Password Reset Successful</p>
              <p className="text-[13px] text-slate-400 mb-5">You can now login with your new password.</p>
              <Link to="/login" className="inline-flex px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
