import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Wallet, Clock } from 'lucide-react';

export default function TopUp() {
  const { profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [refNo, setRefNo] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingTopUps = profile?.pendingTopUps || [];
  const hasPending = pendingTopUps.length > 0;
  const pendingTopup = hasPending ? pendingTopUps[0] : null;

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await API.post('/users/topups', { quantity: Number(amount) });
      toast.success('Top-up request submitted');
      setAmount('');
      refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTopup = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/topups/${pendingTopup._id}`, { refNo, paymentNote });
      toast.success('Payment details updated');
      refreshProfile();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Top Up Wallet</h1>

      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center animate-fade-in">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-emerald-100">
          <Wallet size={26} className="text-emerald-600" />
        </div>
        <p className="text-[13px] text-slate-400">Current Balance</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">₹{profile?.user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>

      {hasPending ? (
        <div className="bg-white rounded-2xl border border-amber-100 ring-1 ring-amber-100 p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Pending Top-Up Request</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Requested {new Date(pendingTopup.createdAt).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="bg-amber-50/50 rounded-xl px-4 py-3 mb-4">
            <p className="text-[13px] text-slate-600">Amount: <span className="font-bold text-slate-900">₹{pendingTopup.amount?.toLocaleString('en-IN')}</span></p>
          </div>

          <form onSubmit={handleUpdateTopup} className="space-y-3">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Reference Number</label>
              <input value={refNo || pendingTopup.refNo} onChange={(e) => setRefNo(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" placeholder="Enter payment ref number" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Payment Note</label>
              <input value={paymentNote || pendingTopup.paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" placeholder="Add a note" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 active:scale-[0.97] shadow-md shadow-primary-500/20 transition-all">
              Update Payment Details
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleRequest} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="text-[15px] font-bold text-slate-900">Request Top-Up</h2>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" placeholder="Enter amount" />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 active:scale-[0.97] shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <p className="text-[11px] text-slate-400 text-center">Your top-up request will be reviewed by admin.</p>
        </form>
      )}
    </div>
  );
}
