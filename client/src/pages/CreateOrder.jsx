import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function CreateOrder() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.isAdmin;

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstParty: '', secondParty: '', address: '', purchasedBy: '',
    product: '', dutyPaidBy: '', purpose: '', quantity: 1, denomination: 100,
    client: '', csvStr: '',
  });

  useEffect(() => {
    if (isAdmin) {
      API.get('/admin/users').then(({ data }) => setClients(data));
      API.get('/admin/products').then(({ data }) => setProducts(data));
    } else if (profile?.products) {
      setProducts(profile.products);
    }
  }, [isAdmin, profile]);

  const serviceableProducts = isAdmin
    ? products.filter((p) => p.serviceable)
    : products.filter((p) => {
        if (!p.serviceable) return false;
        return profile?.user?.serviceCharges?.some((sc) => sc.product?._id === p._id || sc.product === p._id);
      });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = isAdmin ? '/admin/create-order' : '/users/create-order';
      const payload = { ...form, quantity: Number(form.quantity), denomination: Number(form.denomination) };
      const { data } = await API.post(endpoint, payload);
      toast.success(`Order created! Total: ₹${data.totalAmount?.toFixed(2)}`);
      refreshProfile();
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><ArrowLeft size={20} className="text-slate-500" /></button>
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Create New Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 animate-fade-in">
        {isAdmin && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Client *</label>
            <select name="client" value={form.client} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50">
              <option value="">Select a client</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name} - {c.company} (₹{c.balance?.toFixed(2)})</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">First Party *</label>
            <input name="firstParty" value={form.firstParty} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Second Party *</label>
            <input name="secondParty" value={form.secondParty} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Address *</label>
          <textarea name="address" value={form.address} onChange={handleChange} required rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Purchased By *</label>
            <input name="purchasedBy" value={form.purchasedBy} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">State (Product) *</label>
            <select name="product" value={form.product} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50">
              <option value="">Select a state</option>
              {serviceableProducts.map((p) => <option key={p._id} value={p._id}>{p.state}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Duty Paid By *</label>
            <input name="dutyPaidBy" value={form.dutyPaidBy} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Purpose / Article *</label>
            <input name="purpose" value={form.purpose} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Quantity *</label>
            <input name="quantity" type="number" min={1} value={form.quantity} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Denomination (₹) *</label>
            <input name="denomination" type="number" min={1} value={form.denomination} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
          </div>
        </div>

        {!isAdmin && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">CSV Data (optional)</label>
            <textarea name="csvStr" value={form.csvStr} onChange={handleChange} rows={3} placeholder="Paste CSV data here..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 font-mono placeholder:text-slate-300" />
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 disabled:opacity-50 active:scale-[0.97] transition-all duration-200">
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
