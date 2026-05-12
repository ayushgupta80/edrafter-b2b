import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import StatCard from '../components/StatCard';
import {
  ShoppingCart, CheckCircle, Users, IndianRupee,
  MessageSquare, Wallet, Plus, TrendingUp, ArrowRight,
  Clock, Package, AlertCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const statusColors = {
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Processing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-red-50 text-red-600 ring-1 ring-red-200',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100 text-[13px]">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-500">
          <span className="font-medium" style={{ color: p.color }}>{p.name}:</span>{' '}
          {p.name === 'Revenue' ? `₹${p.value?.toLocaleString('en-IN')}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) {
      setAnalyticsLoading(true);
      API.get('/admin/analytics')
        .then(({ data }) => {
          const statusArr = Object.entries(data.ordersByStatus || {}).map(([status, count]) => ({ status, count }));
          setAnalytics({
            monthly: data.monthlyData || [],
            statusBreakdown: statusArr,
            topClients: data.topClients || [],
            recentActivity: data.recentActivity || [],
          });
        })
        .catch(() => {})
        .finally(() => setAnalyticsLoading(false));
    }
  }, [user?.isAdmin]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-[13px] text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.isAdmin;
  const stats = isAdmin ? profile.adminStats : profile.stats;
  const recentOrders = profile.user?.orders || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-slate-400 font-medium">Welcome back</p>
          <h1 className="text-[26px] font-extrabold text-slate-900 mt-0.5 tracking-tight leading-tight">{profile.user?.name}</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{isAdmin ? 'Admin Dashboard' : profile.user?.company}</p>
        </div>
        <Link
          to="/orders/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 active:scale-[0.97] transition-all duration-200 self-start"
        >
          <Plus size={15} /> New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <div className="animate-slide-up stagger-1"><StatCard icon={IndianRupee} label="Total Revenue" value={`₹${(stats?.totalSales || 0).toLocaleString('en-IN')}`} color="green" /></div>
            <div className="animate-slide-up stagger-2"><StatCard icon={Users} label="Clients" value={stats?.totalClients || 0} color="purple" /></div>
            <div className="animate-slide-up stagger-3"><StatCard icon={ShoppingCart} label="Orders" value={stats?.totalOrders || 0} color="primary" /></div>
            <div className="animate-slide-up stagger-4"><StatCard icon={CheckCircle} label="Completed" value={stats?.completedOrders || 0} color="green" /></div>
          </>
        ) : (
          <>
            <div className="animate-slide-up stagger-1"><StatCard icon={Wallet} label="Balance" value={`₹${(profile.user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="green" /></div>
            <div className="animate-slide-up stagger-2"><StatCard icon={ShoppingCart} label="Orders" value={stats?.totalOrders || 0} color="primary" /></div>
            <div className="animate-slide-up stagger-3"><StatCard icon={CheckCircle} label="Completed" value={stats?.completedOrders || 0} color="green" /></div>
            <div className="animate-slide-up stagger-4"><StatCard icon={MessageSquare} label="Tickets" value={stats?.userTickets || 0} color="amber" /></div>
          </>
        )}
      </div>

      {isAdmin && analytics && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Revenue Overview</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">Last 6 months</p>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Orders</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue</span>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2} fill="url(#colorOrders)" />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-fade-in">
              <h2 className="text-[15px] font-bold text-slate-900 mb-1">Order Status</h2>
              <p className="text-[12px] text-slate-400 mb-4">Distribution by status</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {analytics.statusBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Orders']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {analytics.statusBreakdown.map((s, i) => (
                  <div key={s.status} className="flex items-center gap-2 text-[12px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-slate-500">{s.status}</span>
                    <span className="font-bold text-slate-800 ml-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {analytics.topClients?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  <h2 className="text-[15px] font-bold text-slate-900">Top Clients</h2>
                </div>
                <Link to="/clients" className="text-[13px] text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 group transition-colors">
                  View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">#</th>
                      <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Client</th>
                      <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Company</th>
                      <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analytics.topClients.map((c, i) => (
                      <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-400 font-medium">{i + 1}</td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-6 py-3.5 text-slate-500">{c.company}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-800">₹{c.totalSpent?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analytics.recentActivity?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <h2 className="text-[15px] font-bold text-slate-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {analytics.recentActivity.map((a, i) => (
                  <div key={i} className="px-6 py-3.5 flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'Credit' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {a.type === 'Credit' ? <ArrowDownRight size={15} className="text-emerald-500" /> : <ArrowUpRight size={15} className="text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{a.description}</p>
                      <p className="text-[11px] text-slate-400">{a.userName} &middot; {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`text-[13px] font-bold shrink-0 ${a.type === 'Credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {a.type === 'Credit' ? '+' : '-'}₹{a.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isAdmin && profile.user?.serviceCharges?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="text-[15px] font-bold text-slate-900">Your Service Charges</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">State</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Charges/Unit</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profile.user.serviceCharges.map((sc, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{sc.product?.state || 'N/A'}</td>
                    <td className="px-6 py-3.5 text-slate-600">₹{sc.charges}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${sc.product?.serviceable ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-red-50 text-red-500 ring-1 ring-red-200'}`}>
                        {sc.product?.serviceable ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />
              <h2 className="text-[15px] font-bold text-slate-900">Recent Orders</h2>
            </div>
            <Link to="/orders" className="text-[13px] text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 group transition-colors">
              View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">ID</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">First Party</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Qty</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link to={`/orders/${o._id}`} className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">#{o._idd}</Link>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{o.firstParty}</td>
                    <td className="px-6 py-3.5 text-slate-600">{o.quantity}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">₹{o.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColors[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
