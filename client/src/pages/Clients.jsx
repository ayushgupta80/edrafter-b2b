import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Wallet, MinusCircle, X, Users } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [topupModal, setTopupModal] = useState(null);
  const [deductModal, setDeductModal] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [deductAmount, setDeductAmount] = useState('');
  const [deductReason, setDeductReason] = useState('');

  const blankForm = {
    name: '', company: '', email: '', phone: '', address: '', gstin: '',
    userId: '', password: '', serviceCharges: [], api_enabled: false, api_key: '',
  };
  const [form, setForm] = useState(blankForm);

  const fetchData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([API.get('/admin/users'), API.get('/admin/products')]);
      setClients(cRes.data);
      setProducts(pRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (client) => {
    setEditing(client._id);
    setForm({
      name: client.name, company: client.company, email: client.email,
      phone: client.phone || '', address: client.address || '', gstin: client.gstin || '',
      userId: client.userId, password: '', balance: client.balance,
      serviceCharges: client.serviceCharges?.map((sc) => ({
        product: sc.product?._id || sc.product, charges: sc.charges, shipping: sc.shipping,
      })) || [],
      api_enabled: client.api_enabled || false, api_key: client.api_key || '',
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...blankForm, serviceCharges: products.map((p) => ({ product: p._id, charges: 0, shipping: 0 })) });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/admin/users/${editing}`, form);
        toast.success('Client updated');
      } else {
        await API.post('/admin/create-user', form);
        toast.success('Client created');
      }
      setShowForm(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleTopup = async () => {
    if (!topupAmount || Number(topupAmount) <= 0) return;
    try {
      await API.post('/admin/topup', { client: topupModal._id, quantity: Number(topupAmount) });
      toast.success('Balance topped up');
      setTopupModal(null); setTopupAmount(''); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Top-up failed'); }
  };

  const handleDeduct = async () => {
    if (!deductAmount || Number(deductAmount) <= 0) return;
    try {
      await API.post('/admin/deduct', { client: deductModal._id, quantity: Number(deductAmount), reason: deductReason || 'Admin deduction' });
      toast.success('Balance deducted');
      setDeductModal(null); setDeductAmount(''); setDeductReason(''); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Deduction failed'); }
  };

  const updateServiceCharge = (index, field, value) => {
    const updated = [...form.serviceCharges];
    updated[index] = { ...updated[index], [field]: Number(value) };
    setForm({ ...form, serviceCharges: updated });
  };

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">
          <Plus size={15} /> Add Client
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-white placeholder:text-slate-300 hover:border-slate-300 transition-colors" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Users size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm text-slate-400">No clients found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Name</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Company</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Email</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">User ID</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Balance</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">API</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{c.company}</td>
                    <td className="px-6 py-3.5 text-slate-600">{c.email}</td>
                    <td className="px-6 py-3.5 text-slate-400 text-[13px]">{c.userId}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800 tabular-nums">₹{c.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${c.api_enabled ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'}`}>
                        {c.api_enabled ? 'Enabled' : 'Off'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => { setTopupModal(c); setTopupAmount(''); }} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 transition-colors" title="Top Up"><Wallet size={14} /></button>
                        <button onClick={() => { setDeductModal(c); setDeductAmount(''); setDeductReason(''); }} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors" title="Deduct"><MinusCircle size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[3px] z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-scale-in flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2.5rem)]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
              <form id="client-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ['Name *', 'name', 'text', true], ['Company *', 'company', 'text', true],
                    ['Email *', 'email', 'email', true], ['Phone', 'phone', 'text', false],
                    ['User ID *', 'userId', 'text', true], [editing ? 'Password (leave blank to keep)' : 'Password *', 'password', 'password', !editing],
                    ['GSTIN', 'gstin', 'text', false], ['Address', 'address', 'text', false],
                  ].map(([label, key, type, req]) => (
                    <div key={key}>
                      <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
                      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={req}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 hover:border-slate-300 transition-colors" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-slate-50/70 rounded-xl">
                  <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
                    <input type="checkbox" checked={form.api_enabled} onChange={(e) => setForm({ ...form, api_enabled: e.target.checked })} className="rounded border-slate-300 text-primary-600" />
                    Enable API Access
                  </label>
                  {form.api_enabled && (
                    <input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="API Key"
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-[13px] bg-white" />
                  )}
                </div>

                <div>
                  <h3 className="text-[12px] font-semibold text-slate-600 mb-3 uppercase tracking-wide">Service Charges per State</h3>
                  <div className="space-y-2">
                    {form.serviceCharges.map((sc, i) => {
                      const prod = products.find((p) => p._id === sc.product);
                      return (
                        <div key={i} className="flex items-center gap-3 text-[13px]">
                          <span className="w-28 sm:w-32 text-slate-600 font-medium truncate shrink-0">{prod?.state || 'Unknown'}</span>
                          <input type="number" value={sc.charges} onChange={(e) => updateServiceCharge(i, 'charges', e.target.value)} placeholder="Charges"
                            className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
                          <input type="number" value={sc.shipping} onChange={(e) => updateServiceCharge(i, 'shipping', e.target.value)} placeholder="Shipping"
                            className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" form="client-form" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.98] transition-all">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {topupModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Top Up Balance</h2>
            <p className="text-[13px] text-slate-400 mb-5">{topupModal.name} &middot; Current: ₹{topupModal.balance?.toFixed(2)}</p>
            <input type="number" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="Amount" min={1}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setTopupModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleTopup} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-200 active:scale-[0.98] transition-all">Add Funds</button>
            </div>
          </div>
        </div>
      )}

      {deductModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Deduct Balance</h2>
            <p className="text-[13px] text-slate-400 mb-5">{deductModal.name} &middot; Current: ₹{deductModal.balance?.toFixed(2)}</p>
            <input type="number" value={deductAmount} onChange={(e) => setDeductAmount(e.target.value)} placeholder="Amount" min={1}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 mb-3" />
            <input value={deductReason} onChange={(e) => setDeductReason(e.target.value)} placeholder="Reason"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setDeductModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDeduct} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[13px] font-semibold hover:bg-red-700 shadow-md shadow-red-200 active:scale-[0.98] transition-all">Deduct</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
