import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-primary-200/30 to-primary-100/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/20 to-primary-50/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-gradient-to-br from-emerald-50/20 to-teal-50/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-5 shadow-xl shadow-primary-500/25">
            <FileText className="text-white" size={24} />
          </div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">eDrafter B2B</h1>
          <p className="text-[13px] text-slate-400 mt-1.5 font-medium">Stamp Paper Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-7 space-y-5">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-2 uppercase tracking-wide">Email or User ID</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[14px] bg-slate-50/50 placeholder:text-slate-300 hover:border-slate-300 transition-colors"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-2 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[14px] bg-slate-50/50 pr-11 placeholder:text-slate-300 hover:border-slate-300 transition-colors"
                placeholder="Enter password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-[13px] text-primary-600 hover:text-primary-700 font-semibold transition-colors">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl text-[14px] font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98] transition-all duration-200"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
