export default function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const themes = {
    primary: { bg: 'bg-primary-50', icon: 'text-primary-600', ring: 'ring-primary-100', glow: 'group-hover:shadow-primary-100/60' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100', glow: 'group-hover:shadow-emerald-100/60' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100', glow: 'group-hover:shadow-amber-100/60' },
    red: { bg: 'bg-red-50', icon: 'text-red-500', ring: 'ring-red-100', glow: 'group-hover:shadow-red-100/60' },
    purple: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-100', glow: 'group-hover:shadow-violet-100/60' },
  };
  const t = themes[color];

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-xl ${t.glow} hover:-translate-y-0.5 transition-all duration-300 ease-out group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-2">{label}</p>
          <p className="text-[26px] font-extrabold text-slate-900 leading-none tracking-tight">{value}</p>
          {sub && <p className="text-[12px] text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${t.bg} ring-1 ${t.ring} group-hover:scale-110 transition-transform duration-300 ease-out`}>
          <Icon size={20} className={t.icon} />
        </div>
      </div>
    </div>
  );
}
