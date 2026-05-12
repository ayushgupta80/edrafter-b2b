import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowUpCircle, CheckCircle, Clock, User } from 'lucide-react';

export default function TopupRequests() {
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopups = async () => {
    try {
      const { data } = await API.get('/admin/topup-requests');
      setTopups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopups(); }, []);

  const handleApprove = async (topup) => {
    if (!confirm(`Approve ₹${topup.amount?.toLocaleString('en-IN')} top-up for ${topup.user?.name || 'this user'}?`)) return;
    try {
      await API.post(`/admin/approve-topup/${topup._id}`);
      toast.success('Top-up approved and balance credited');
      fetchTopups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const pending = topups.filter(t => t.status === 'Pending');
  const approved = topups.filter(t => t.status === 'Approved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Top-Up Requests</h1>
        <p className="text-sm text-slate-400 mt-1">Review and approve client balance top-up requests</p>
      </div>

      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-amber-500" />
          <h2 className="text-[15px] font-bold text-slate-900">Pending Requests</h2>
          {pending.length > 0 && (
            <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <ArrowUpCircle size={32} className="mx-auto text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">No pending top-up requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((t) => (
              <div key={t._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <User size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">{t.user?.name || 'Unknown'}</p>
                      <p className="text-[12px] text-slate-400">{t.user?.email} &middot; {t.user?.company}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[12px]">
                        <span className="text-slate-500">Amount: <span className="font-bold text-slate-800">₹{t.amount?.toLocaleString('en-IN')}</span></span>
                        {t.refNo && t.refNo.trim() !== '' && (
                          <span className="text-slate-500">Ref: <span className="font-medium text-slate-700">{t.refNo}</span></span>
                        )}
                        {t.paymentNote && t.paymentNote.trim() !== '' && (
                          <span className="text-slate-500">Note: <span className="font-medium text-slate-700">{t.paymentNote}</span></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{new Date(t.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <button onClick={() => handleApprove(t)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:from-emerald-700 hover:to-emerald-600 shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-all duration-200 shrink-0 self-start">
                    <CheckCircle size={15} /> Approve & Credit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved history */}
      {approved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-emerald-500" />
            <h2 className="text-[15px] font-bold text-slate-900">Approved</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Client</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ref No</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {approved.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-800">{t.user?.name}</td>
                      <td className="px-6 py-3.5 font-semibold text-emerald-600">+₹{t.amount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-3.5 text-slate-500">{t.refNo || '-'}</td>
                      <td className="px-6 py-3.5 text-slate-400 text-[13px]">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
