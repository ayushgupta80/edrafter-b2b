import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, Plus } from 'lucide-react';

const statusConfig = {
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Processing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-red-50 text-red-600 ring-1 ring-red-200',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await API.get('/users/orders');
        setOrders(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o._idd?.toString().includes(q) || o.firstParty?.toLowerCase().includes(q) ||
        o.secondParty?.toLowerCase().includes(q) || o.user?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">{user?.isAdmin ? 'All Orders' : 'My Orders'}</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/orders/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 active:scale-[0.97] transition-all duration-200 self-start">
          <Plus size={15} /> New Order
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, party name..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-white placeholder:text-slate-300 hover:border-slate-300 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Order ID</th>
                {user?.isAdmin && <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Client</th>}
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">First Party</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">State</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Qty</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={user?.isAdmin ? 8 : 7} className="px-6 py-16 text-center text-slate-300 text-sm">No orders found</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link to={`/orders/${o._id}`} className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">#{o._idd}</Link>
                    </td>
                    {user?.isAdmin && <td className="px-6 py-3.5 text-slate-600">{o.user?.name || '-'}</td>}
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{o.firstParty}</td>
                    <td className="px-6 py-3.5 text-slate-500">{o.product?.state || '-'}</td>
                    <td className="px-6 py-3.5 text-slate-600">{o.quantity}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">₹{o.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusConfig[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-[13px]">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
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
