import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, Key, ChevronDown, ChevronRight, Globe, Lock, Zap } from 'lucide-react';

const API_BASE = 'https://api.edrafterb2b.in/api/v1';

const endpoints = [
  {
    method: 'GET',
    path: '/me',
    title: 'Get Account Info',
    desc: 'Returns your account details including name, email, balance, and company info.',
    request: null,
    response: `{
  "name": "Your Name",
  "email": "you@company.com",
  "balance": 50000,
  "company": "Your Company",
  "phone": "9876543210",
  "gstin": "22AAAAA0000A1Z5"
}`,
  },
  {
    method: 'GET',
    path: '/products',
    title: 'List Products (States)',
    desc: 'Returns all serviceable states/products. Use the product _id when creating orders.',
    request: null,
    response: `[
  {
    "_id": "664a1b...",
    "state": "Maharashtra",
    "serviceable": true
  },
  {
    "_id": "664a1c...",
    "state": "Karnataka",
    "serviceable": true
  }
]`,
  },
  {
    method: 'POST',
    path: '/orders',
    title: 'Create Order',
    desc: 'Place a new stamp paper order. Amount is auto-calculated and deducted from your balance.',
    request: `{
  "firstParty": "John Doe",
  "secondParty": "Jane Smith",
  "address": "123 Main Street, Mumbai",
  "purchasedBy": "John Doe",
  "product_id": "664a1b...",
  "dutyPaidBy": "Buyer",
  "purpose": "Sale Agreement",
  "quantity": 10,
  "denomination": 100
}`,
    response: `{
  "message": "Order created successfully",
  "order": { "_idd": 100042, "status": "Pending", ... },
  "totalAmount": 1250.50
}`,
    fields: [
      { name: 'firstParty', type: 'string', required: true, desc: 'Name of the first party' },
      { name: 'secondParty', type: 'string', required: true, desc: 'Name of the second party' },
      { name: 'address', type: 'string', required: true, desc: 'Delivery address' },
      { name: 'purchasedBy', type: 'string', required: true, desc: 'Name of purchaser' },
      { name: 'product_id', type: 'string', required: true, desc: 'Product ID from /products endpoint' },
      { name: 'dutyPaidBy', type: 'string', required: true, desc: 'Who pays the duty (e.g. "Buyer")' },
      { name: 'purpose', type: 'string', required: true, desc: 'Purpose or article type' },
      { name: 'quantity', type: 'number', required: true, desc: 'Number of stamp papers' },
      { name: 'denomination', type: 'number', required: true, desc: 'Value per stamp paper in ₹' },
    ],
  },
  {
    method: 'GET',
    path: '/orders',
    title: 'List Orders',
    desc: 'Returns all your orders sorted by newest first, with stamp file URLs.',
    request: null,
    response: `[
  {
    "_idd": 100042,
    "firstParty": "John Doe",
    "status": "Completed",
    "quantity": 10,
    "totalAmount": 1250.50,
    "product": { "state": "Maharashtra" },
    "stampsUploaded": [
      { "id": 1, "file": "https://..." }
    ]
  }
]`,
  },
  {
    method: 'GET',
    path: '/orders/:id',
    title: 'Get Order by ID',
    desc: 'Get a specific order by its numeric ID (_idd). Returns full order details with file URLs.',
    request: null,
    response: `{
  "_idd": 100042,
  "firstParty": "John Doe",
  "secondParty": "Jane Smith",
  "status": "Completed",
  "quantity": 10,
  "denomination": 100,
  "totalAmount": 1250.50,
  "stampsUploaded": [...]
}`,
  },
];

const methodColors = {
  GET: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  POST: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
};

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="relative">
      {label && <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>}
      <div className="bg-[#1e1e2e] rounded-xl p-4 text-[12px] font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </div>
      <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" style={label ? { top: '1.75rem' } : {}}>
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
      </button>
    </div>
  );
}

function EndpointCard({ ep }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${methodColors[ep.method]}`}>{ep.method}</span>
        <code className="text-[13px] font-mono text-slate-700 font-semibold">{ep.path}</code>
        <span className="text-[13px] text-slate-400 ml-2 hidden sm:inline">{ep.title}</span>
        <div className="ml-auto shrink-0">
          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
          <p className="text-[13px] text-slate-600">{ep.desc}</p>

          {ep.fields && (
            <div>
              <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-2">Request Body</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-2 pr-4 font-semibold text-slate-400">Field</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-400">Type</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-400">Required</th>
                      <th className="pb-2 font-semibold text-slate-400">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ep.fields.map((f) => (
                      <tr key={f.name}>
                        <td className="py-2 pr-4 font-mono font-semibold text-slate-800">{f.name}</td>
                        <td className="py-2 pr-4 text-slate-500">{f.type}</td>
                        <td className="py-2 pr-4">{f.required ? <span className="text-red-500 font-semibold">Yes</span> : <span className="text-slate-400">No</span>}</td>
                        <td className="py-2 text-slate-500">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ep.request && <CodeBlock code={ep.request} label="Example Request" />}
          {ep.response && <CodeBlock code={ep.response} label="Example Response" />}
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const apiKey = profile?.user?.api_key;
  const apiEnabled = profile?.user?.api_enabled;

  const copyKey = () => { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (!apiEnabled) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">API Access Not Enabled</h2>
          <p className="text-[13px] text-slate-400 max-w-sm mx-auto">Contact your administrator to enable API access for your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">API Documentation</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Integrate eDrafter into your applications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-3">
            <Globe size={18} className="text-primary-600" />
          </div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Base URL</p>
          <code className="text-[13px] font-mono font-semibold text-slate-800">{API_BASE}</code>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
            <Lock size={18} className="text-orange-600" />
          </div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Auth Header</p>
          <code className="text-[13px] font-mono font-semibold text-slate-800">x-api-key</code>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <Zap size={18} className="text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Format</p>
          <code className="text-[13px] font-mono font-semibold text-slate-800">JSON</code>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Key size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Your API Key</h2>
              <p className="text-[12px] text-slate-400">Include this in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">x-api-key</code> header</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-[#1e1e2e] px-4 py-3 rounded-xl text-[13px] font-mono text-emerald-400 break-all">{apiKey}</code>
          <button onClick={copyKey} className="shrink-0 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-slate-900 mb-1">Quick Start</h2>
        <p className="text-[13px] text-slate-400 mb-3">Test your API key with a simple cURL command:</p>
        <CodeBlock code={`curl -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\\n  ${API_BASE}/me`} />
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">Endpoints</h2>
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <EndpointCard key={ep.method + ep.path} ep={ep} />
          ))}
        </div>
      </div>
    </div>
  );
}
