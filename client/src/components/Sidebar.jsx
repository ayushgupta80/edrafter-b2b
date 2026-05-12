import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Users, Package, CreditCard,
  MessageSquare, LogOut, Plus, Wallet, FileText, X, ArrowUpCircle, User, ChevronDown, Code
} from 'lucide-react';

const adminLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/orders/new', icon: Plus, label: 'Create Order' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/products', icon: Package, label: 'Products (States)' },
  { to: '/transactions', icon: CreditCard, label: 'Transactions' },
  { to: '/topup-requests', icon: ArrowUpCircle, label: 'Top-Up Requests' },
  { to: '/tickets', icon: MessageSquare, label: 'Tickets' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const clientLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'My Orders' },
  { to: '/orders/new', icon: Plus, label: 'New Order' },
  { to: '/transactions', icon: CreditCard, label: 'Transactions' },
  { to: '/tickets', icon: MessageSquare, label: 'Support' },
  { to: '/topup', icon: Wallet, label: 'Top Up' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ open, onClose }) {
  const { user, profile, logout } = useAuth();
  const baseLinks = user?.isAdmin ? adminLinks : clientLinks;
  const links = (!user?.isAdmin && profile?.user?.api_enabled)
    ? [...baseLinks.slice(0, -1), { to: '/developer', icon: Code, label: 'API Docs' }, ...baseLinks.slice(-1)]
    : baseLinks;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[270px] bg-[#1a1942] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <FileText size={19} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">eDrafter</h1>
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.12em]">
                {user?.isAdmin ? 'Admin Panel' : 'Client Portal'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} className="text-white/50" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pt-2 space-y-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to + label}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-[10px] rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/25 font-semibold'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          {profile?.user && !user?.isAdmin && (
            <div className="mx-0.5 mb-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] uppercase tracking-[0.1em] text-emerald-400/80 font-semibold">Wallet Balance</p>
              <p className="text-[18px] font-extrabold text-emerald-400 mt-1 tracking-tight">
                ₹{(profile.user.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div className="h-px bg-white/10 mb-3" />

          <div className="flex items-center gap-3 px-1 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[12px] font-bold text-white shadow-sm shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
            </div>
            <ChevronDown size={14} className="text-white/30 shrink-0" />
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-rose-400 hover:bg-white/5 w-full transition-all duration-200"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
