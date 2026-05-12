import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Search, Bell, ChevronDown, ShoppingCart, Wallet, MessageSquare, ArrowUpCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const notifRef = useRef(null);
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    setShowNotifs(!showNotifs);
    if (showNotifs) return;
    setNotifsLoading(true);
    try {
      const { data } = await API.get('/users/transactions?limit=8');
      const txns = Array.isArray(data) ? data : data.transactions || [];
      setNotifications(txns.slice(0, 8).map((t) => ({
        id: t._id,
        icon: t.type === 'Credit' ? ArrowUpCircle : ShoppingCart,
        color: t.type === 'Credit' ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50',
        title: t.description,
        amount: `${t.type === 'Credit' ? '+' : '-'}₹${t.amount?.toLocaleString('en-IN')}`,
        amountColor: t.type === 'Credit' ? 'text-emerald-600' : 'text-red-500',
        time: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      })));
    } catch {
      setNotifications([]);
    } finally {
      setNotifsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[270px] transition-all duration-300">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100/80 px-5 py-3 lg:px-8">
          <div className="flex items-center justify-between max-w-[1400px] mx-auto">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} className="text-slate-500" />
            </button>

            <div className="hidden lg:flex items-center relative">
              <Search size={16} className="absolute left-3.5 text-slate-300" />
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-10 pr-16 py-2 w-[280px] bg-slate-50 border border-slate-200 rounded-xl text-[13px] placeholder:text-slate-300 hover:border-slate-300 transition-colors"
              />
              <div className="absolute right-3 flex items-center gap-0.5 text-[10px] text-slate-300 font-medium bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                <span>&#8984;</span><span>K</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notifRef}>
                <button onClick={loadNotifications} className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <Bell size={19} className="text-slate-400" />
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <h3 className="text-[14px] font-bold text-slate-900">Recent Activity</h3>
                      <button onClick={() => setShowNotifs(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <X size={14} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-[13px] text-slate-400">No recent activity</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}>
                              <n.icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-slate-700 font-medium truncate">{n.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[12px] font-bold ${n.amountColor}`}>{n.amount}</span>
                                <span className="text-[11px] text-slate-400">{n.time}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100">
                      <button onClick={() => { navigate('/transactions'); setShowNotifs(false); }}
                        className="w-full text-center text-[13px] text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                        View all transactions
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {profile?.user && (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 pl-4 border-l border-slate-100">
                    <div className="text-right hidden sm:block">
                      <p className="text-[13px] font-semibold text-slate-800 leading-tight">{profile.user.name}</p>
                      <p className="text-[11px] text-slate-400">{profile.user.company || profile.user.email}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[12px] font-bold shadow-md shadow-orange-200/50 ring-2 ring-white">
                      {profile.user.name?.charAt(0)}
                    </div>
                    <ChevronDown size={14} className={`text-slate-300 hidden sm:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in z-50">
                      <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                        My Profile
                      </button>
                      <button onClick={() => { navigate('/transactions'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                        Transactions
                      </button>
                      <div className="h-px bg-slate-100" />
                      <button onClick={logout}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors font-medium">
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-5 lg:p-8 max-w-[1400px] mx-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
