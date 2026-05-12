import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/users/transactions');
        setTransactions(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = transactions.filter((t) => {
    if (typeFilter !== 'All' && t.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.description?.toLowerCase().includes(q) || t.user?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Transactions</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-white placeholder:text-slate-300 hover:border-slate-300 transition-colors" />
        </div>
        <div className="flex gap-1.5">
          {['All', 'Credit', 'Debit'].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                typeFilter === t ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Type</th>
                {user?.isAdmin && <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Client</th>}
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Amount</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Before</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">After</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Description</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={user?.isAdmin ? 7 : 6} className="px-6 py-16 text-center text-slate-300 text-sm">No transactions found</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        t.type === 'Credit' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-red-50 text-red-500 ring-1 ring-red-200'
                      }`}>
                        {t.type === 'Credit' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {t.type}
                      </span>
                    </td>
                    {user?.isAdmin && <td className="px-6 py-3.5 text-slate-600 font-medium">{t.user?.name || '-'}</td>}
                    <td className={`px-6 py-3.5 font-bold tabular-nums ${t.type === 'Credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.type === 'Credit' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 tabular-nums">₹{t.balanceBefore?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-slate-400 tabular-nums">₹{t.balanceAfter?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-slate-600">{t.description}</td>
                    <td className="px-6 py-3.5 text-slate-400 text-[13px]">{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
