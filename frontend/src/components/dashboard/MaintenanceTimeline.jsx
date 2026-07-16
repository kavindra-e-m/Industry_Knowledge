const SEVERITY_COLOR = {
  critical: "border-critical bg-critical/10 text-critical",
  warning: "border-warning bg-warning/10 text-warning",
  healthy: "border-healthy bg-healthy/10 text-healthy",
  info: "border-info bg-info/10 text-info",
};

export default function MaintenanceTimeline({ alerts, loading }) {
  if (loading) {
    return (
      <div className="card animate-pulse space-y-3">
        <div className="h-4 w-36 bg-surface-600 rounded" />
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-surface-700 rounded" />)}
      </div>
    );
  }

  const sorted = [...alerts].sort((a, b) => a.rul_days - b.rul_days);

  return (
    <div className="card card-hover">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">Maintenance Timeline</p>
      <div className="space-y-2">
        {sorted.map((a) => (
          <div key={a.equipment_id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${SEVERITY_COLOR[a.severity]}`}>
            <div className="text-center min-w-[40px]">
              <p className="text-lg font-bold leading-none">{a.rul_days}</p>
              <p className="text-[9px] uppercase opacity-70">days</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{a.tag} — {a.predicted_component}</p>
              <p className="text-[10px] opacity-70 truncate">{a.suggested_work_order.slice(0, 60)}…</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
