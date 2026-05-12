import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Download, Upload, FileText, CheckCircle, XCircle,
  Clock, Loader, Eye, X, ChevronLeft, ChevronRight, File
} from 'lucide-react';

const statusConfig = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-400' },
  Processing: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-400' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-400' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', dot: 'bg-red-400' },
};

function StampPreviewModal({ stamps, initialIndex, onClose, baseUrl }) {
  const [idx, setIdx] = useState(initialIndex);
  const stamp = stamps[idx];
  const fileUrl = `${baseUrl}${stamp.file}`;
  const isPdf = stamp.file?.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-white/80 text-sm font-medium">Stamp #{stamp.id}</span>
          <span className="text-white/40 text-xs">{idx + 1} of {stamps.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={(e) => e.stopPropagation()}>
            <Download size={16} />
          </a>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-4 gap-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-colors shrink-0">
          <ChevronLeft size={24} />
        </button>

        <div className="flex-1 max-w-5xl h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
          {isPdf ? (
            <iframe src={fileUrl} className="w-full h-full" title={`Stamp ${stamp.id}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 bg-slate-50">
              <img src={fileUrl} alt={`Stamp ${stamp.id}`} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          )}
        </div>

        <button onClick={() => setIdx(Math.min(stamps.length - 1, idx + 1))} disabled={idx === stamps.length - 1}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-colors shrink-0">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex justify-center gap-2 pb-4 px-4 overflow-x-auto">
        {stamps.map((s, i) => (
          <button key={s.id} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
              i === idx ? 'bg-white text-primary-700 ring-2 ring-primary-400 scale-110' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}>
            #{s.id}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(null);
  const fileInputRef = useRef(null);
  const invoiceInputRef = useRef(null);

  const fetchOrder = async () => {
    try {
      const { data } = await API.get(`/users/orders/${id}`);
      setOrder(data);
    } catch (e) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusChange = async (action) => {
    const confirmMsg = {
      accept: 'Accept this order and begin processing?',
      complete: 'Mark this order as completed?',
      cancel: 'Cancel this order? Amount will be refunded.',
    };
    if (!confirm(confirmMsg[action])) return;
    try {
      const endpoints = { accept: 'accept-order', complete: 'complete-order', cancel: 'cancel-order' };
      await API.put(`/admin/${endpoints[action]}/${id}`);
      toast.success('Order updated');
      fetchOrder();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    }
  };

  const handleFileUpload = async (e, type) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    setUploading(true);
    try {
      const endpoint = type === 'invoice' ? 'upload-invoice' : 'upload-files';
      await API.post(`/admin/${endpoint}/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(type === 'invoice' ? 'Invoice uploaded' : `${files.length} stamp(s) uploaded`);
      fetchOrder();
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async () => {
    try {
      const response = await API.get(`/users/download-order/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${order._idd}-stamps.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!order) return <div className="text-center py-16 text-slate-400">Order not found</div>;

  const sc = statusConfig[order.status] || statusConfig.Pending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors self-start">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Order #{order._idd}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {order.status}
            </span>
          </div>
          <p className="text-[13px] text-slate-400 mt-1">Created {new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-50">
              <h2 className="text-[15px] font-bold text-slate-900">Order Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  ['First Party', order.firstParty],
                  ['Second Party', order.secondParty],
                  ['Address', order.address],
                  ['Purchased By', order.purchasedBy],
                  ['State', order.product?.state || '-'],
                  ['Duty Paid By', order.dutyPaidBy],
                  ['Purpose / Article', order.purpose],
                  ['Quantity', order.quantity],
                  ['Denomination', `₹${order.denomination}`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                    <p className="text-[14px] font-medium text-slate-800">{val}</p>
                  </div>
                ))}
                <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-extrabold text-primary-700">₹{order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stamps Grid */}
          {order.stampsUploaded?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  <h2 className="text-[15px] font-bold text-slate-900">Stamp Papers</h2>
                  <span className="text-[11px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full ml-1">{order.stampsUploaded.length}</span>
                </div>
                <button onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 text-[13px] text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  <Download size={14} /> Download ZIP
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {order.stampsUploaded.map((s, i) => {
                    const isPdf = s.file?.toLowerCase().endsWith('.pdf');
                    return (
                      <button
                        key={s.id}
                        onClick={() => setPreviewIdx(i)}
                        className="group relative bg-slate-50 hover:bg-primary-50 rounded-xl border border-slate-100 hover:border-primary-200 p-4 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer"
                      >
                        <div className="w-12 h-14 flex items-center justify-center">
                          {isPdf ? (
                            <div className="w-full h-full bg-red-50 rounded-lg flex items-center justify-center ring-1 ring-red-100">
                              <FileText size={22} className="text-red-500" />
                            </div>
                          ) : (
                            <img src={`/uploads/${s.file}`} alt="" className="w-full h-full object-cover rounded-lg ring-1 ring-slate-200" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] font-bold text-slate-700 group-hover:text-primary-700">Stamp #{s.id}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{s.file?.split('-').pop()}</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-1 rounded-md bg-primary-600 text-white">
                            <Eye size={12} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Invoice */}
          {order.invoice && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50">
                <h2 className="text-[15px] font-bold text-slate-900">Invoice</h2>
              </div>
              <div className="p-4">
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  {order.invoice.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={`/uploads/${order.invoice}`} className="w-full h-[500px]" title="Invoice" />
                  ) : (
                    <img src={`/uploads/${order.invoice}`} alt="Invoice" className="w-full" />
                  )}
                </div>
                <a href={`/uploads/${order.invoice}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-[13px] text-primary-600 hover:text-primary-700 font-semibold">
                  <Eye size={14} /> Open in new tab
                </a>
              </div>
            </div>
          )}

          {/* CSV Data */}
          {order.csvStr && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50">
                <h2 className="text-[15px] font-bold text-slate-900">CSV Data</h2>
              </div>
              <div className="p-4">
                <pre className="text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono text-slate-600 leading-relaxed">{order.csvStr}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Admin Actions */}
        {user?.isAdmin && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <h2 className="text-[15px] font-bold text-slate-900">Actions</h2>
              </div>
              <div className="p-4 space-y-2.5">
                {order.status === 'Pending' && (
                  <button onClick={() => handleStatusChange('accept')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/20 active:scale-[0.97] transition-all duration-200">
                    <Clock size={15} /> Accept Order
                  </button>
                )}
                {(order.status === 'Pending' || order.status === 'Processing') && (
                  <button onClick={() => handleStatusChange('complete')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:from-emerald-700 hover:to-emerald-600 shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-all duration-200">
                    <CheckCircle size={15} /> Mark Completed
                  </button>
                )}
                {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                  <button onClick={() => handleStatusChange('cancel')}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-red-100 transition-all">
                    <XCircle size={15} /> Cancel Order
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <h2 className="text-[15px] font-bold text-slate-900">Upload Files</h2>
              </div>
              <div className="p-4 space-y-3">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'stamps')} multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 hover:border-primary-300 rounded-xl p-5 transition-colors disabled:opacity-50 group">
                  {uploading ? (
                    <Loader size={20} className="animate-spin text-primary-500" />
                  ) : (
                    <Upload size={20} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                  )}
                  <span className="text-[13px] font-medium text-slate-500 group-hover:text-primary-600 transition-colors">
                    Upload Stamp Papers
                  </span>
                  <span className="text-[11px] text-slate-400">PDF, JPG, PNG (max 10MB each)</span>
                </button>

                <input type="file" ref={invoiceInputRef} onChange={(e) => handleFileUpload(e, 'invoice')} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                <button onClick={() => invoiceInputRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-primary-300 px-4 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all disabled:opacity-50">
                  <File size={15} /> Upload Invoice
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <h2 className="text-[15px] font-bold text-slate-900">Timeline</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <TimelineItem label="Created" date={order.createdAt} active />
                  <TimelineItem label="Accepted" date={order.acceptedAt} active={!!order.acceptedAt} />
                  <TimelineItem label="Completed" date={order.completedAt} active={order.status === 'Completed'} />
                  {order.status === 'Cancelled' && <TimelineItem label="Cancelled" date={order.completedAt} active isRed />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stamp Preview Modal */}
      {previewIdx !== null && order.stampsUploaded?.length > 0 && (
        <StampPreviewModal
          stamps={order.stampsUploaded}
          initialIndex={previewIdx}
          onClose={() => setPreviewIdx(null)}
          baseUrl="/uploads/"
        />
      )}
    </div>
  );
}

function TimelineItem({ label, date, active, isRed }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${active ? (isRed ? 'bg-red-400' : 'bg-primary-500') : 'bg-slate-200'}`} />
        <div className="w-px h-6 bg-slate-100" />
      </div>
      <div>
        <p className={`text-[13px] font-medium ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</p>
        {date && <p className="text-[11px] text-slate-400">{new Date(date).toLocaleString('en-IN')}</p>}
      </div>
    </div>
  );
}
