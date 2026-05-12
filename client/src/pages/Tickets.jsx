import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, X, MessageCircle } from 'lucide-react';

const statusColors = {
  Open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};
const priorityColors = {
  Low: 'bg-slate-100 text-slate-500', Medium: 'bg-yellow-50 text-yellow-700',
  High: 'bg-orange-50 text-orange-600', Urgent: 'bg-red-50 text-red-600',
};

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Low' });

  useEffect(() => { API.get('/users/tickets').then(({ data }) => setTickets(data)).finally(() => setLoading(false)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/tickets', form);
      toast.success('Ticket created');
      setShowNew(false);
      setForm({ title: '', description: '', priority: 'Low' });
      const { data } = await API.get('/users/tickets');
      setTickets(data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">{user?.isAdmin ? 'All Tickets' : 'Support'}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        {!user?.isAdmin && (
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">
            <Plus size={15} /> New Ticket
          </button>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <MessageCircle size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm text-slate-400">No tickets yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t._id} to={`/tickets/${t._id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 hover:border-slate-200 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-900">{t.title}</h3>
                  <p className="text-[13px] text-slate-400 mt-1 line-clamp-1">{t.description}</p>
                  {user?.isAdmin && t.user && (
                    <p className="text-[11px] text-slate-400 mt-1.5">By {t.user.name} &middot; {t.user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${priorityColors[t.priority]}`}>{t.priority}</span>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
                <span>{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                <span className="flex items-center gap-1"><MessageSquare size={11} /> {t.replies?.length || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-2xl animate-scale-in">
            <button onClick={() => setShowNew(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-400" /></button>
            <h2 className="text-lg font-bold text-slate-900 mb-5">New Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50">
                  <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
