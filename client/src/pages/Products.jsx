import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ state: '', serviceable: true });

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/admin/products');
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/admin/products/${editing}`, form);
        toast.success('State updated');
      } else {
        await API.post('/admin/products', form);
        toast.success('State added');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ state: '', serviceable: true });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this state? This will also remove it from all client service charges.')) return;
    try {
      await API.delete(`/admin/products/${id}`);
      toast.success('State deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Products (States)</h1>
          <p className="text-sm text-slate-400 mt-0.5">{products.length} state{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ state: '', serviceable: true }); }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">
          <Plus size={15} /> Add State
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 hover:border-slate-200 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-primary-600" />
                </div>
                <h3 className="text-[14px] font-semibold text-slate-900">{p.state}</h3>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${p.serviceable ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-red-50 text-red-500 ring-1 ring-red-200'}`}>
                {p.serviceable ? 'Serviceable' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditing(p._id); setForm({ state: p.state, serviceable: p.serviceable }); setShowForm(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={() => handleDelete(p._id)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium border border-red-200 rounded-xl hover:bg-red-50 text-red-500 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-scale-in">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-400" /></button>
            <h2 className="text-lg font-bold text-slate-900 mb-5">{editing ? 'Edit State' : 'Add State'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">State Name *</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50" />
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700 p-3 bg-slate-50/50 rounded-xl">
                <input type="checkbox" checked={form.serviceable} onChange={(e) => setForm({ ...form, serviceable: e.target.checked })} className="rounded border-slate-300 text-primary-600" />
                Serviceable
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-[13px] font-semibold hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.97] transition-all duration-200">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
