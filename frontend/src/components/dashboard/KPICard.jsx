export default function KPICard({ label, value, unit, trend, color = "brand", icon, loading }) {
  const colorMap = {
    brand: "text-brand border-brand/20 bg-brand/5",
    critical: "text-critical border-critical/20 bg-critical/5",
    warning: "text-warning border-warning/20 bg-warning/5",
    healthy: "text-healthy border-healthy/20 bg-healthy/5",
    info: "text-info border-info/20 bg-info/5",
  };

  return (
    <div className={`card card-hover border ${colorMap[color]} animate-fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-surface-600 rounded animate-pulse" />
      ) : (
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-bold text-white">{value}</span>
          {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
        </div>
      )}
      {trend && (
        <p className={`text-xs mt-2 ${trend.startsWith("+") ? "text-critical" : "text-healthy"}`}>
          {trend} vs last 24h
        </p>
      )}
    </div>
  );
}
