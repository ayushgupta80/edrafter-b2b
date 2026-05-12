import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Lock, Unlock, Edit2, Trash2, X } from 'lucide-react';

const statusColors = {
  Open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'Low' });

  const isOwner = ticket?.user?._id === user?._id || ticket?.user === user?._id;

  const fetchTicket = async () => {
    try { const { data } = await API.get(`/users/tickets/${id}`); setTicket(data); }
    catch (e) { toast.error('Failed to load ticket'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchTicket(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    try { await API.post(`/users/tickets/${id}/reply`, { message: reply }); setReply(''); fetchTicket(); toast.success('Reply sent'); }
    catch { toast.error('Failed to send reply'); }
  };

  const toggleStatus = async () => {
    const endpoint = ticket.status === 'Closed' ? 'open' : 'close';
    try { await API.post(`/users/tickets/${id}/${endpoint}`); fetchTicket(); toast.success(`Ticket ${endpoint === 'close' ? 'closed' : 'reopened'}`); }
    catch { toast.error('Failed to update status'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/tickets/${id}`, editForm);
      toast.success('Ticket updated');
      setEditing(false);
      fetchTicket();
    } catch { toast.error('Failed to update ticket'); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;
    try {
      await API.delete(`/users/tickets/${id}`);
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch { toast.error('Failed to delete ticket'); }
  };

  const openEditForm = () => {
    setEditForm({ title: ticket.title, description: ticket.description, priority: ticket.priority });
    setEditing(true);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (!ticket) return <div className="text-center py-16 text-slate-400">Ticket not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><ArrowLeft size={20} className="text-slate-500" /></button>
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{ticket.title}</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{ticket.user?.name} &middot; {new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <button onClick={openEditForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit Ticket"><Edit2 size={15} /></button>
              <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete Ticket"><Trash2 size={15} /></button>
            </>
          )}
          <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${statusColors[ticket.status]}`}>{ticket.status}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            ticket.priority === 'Urgent' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' :
            ticket.priority === 'High' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' :
            ticket.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' :
            'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
          }`}>{ticket.priority} Priority</span>
        </div>
        <p className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
      </div>

      {ticket.replies?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[15px] font-bold text-slate-900">Replies</h2>
          {ticket.replies.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-slate-800">{r.repliedBy}</span>
                <span className="text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      {ticket.status !== 'Closed' ? (
        <form onSubmit={handleReply} className="bg-white rounded-2xl border border-slate-100 p-5">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply..."
            rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 mb-3 placeholder:text-slate-300" />
          <div className="flex justify-between">
            <button type="button" onClick={toggleStatus}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
              <Lock size={14} /> Close Ticket
            </button>
            <button type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">
              <Send size={14} /> Send
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-slate-400 mb-3">This ticket is closed.</p>
          <button onClick={toggleStatus} className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium hover:bg-slate-50 text-slate-500 transition-colors">
            <Unlock size={14} /> Reopen Ticket
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-2xl animate-scale-in">
            <button onClick={() => setEditing(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-400" /></button>
            <h2 className="text-lg font-bold text-slate-900 mb-5">Edit Ticket</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Title</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Priority</label>
                <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50">
                  <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
