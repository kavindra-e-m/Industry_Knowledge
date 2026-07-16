const STATUS_COLOR = {
  critical: "bg-critical",
  warning: "bg-warning",
  healthy: "bg-healthy",
  info: "bg-info",
};

export default function EquipmentHealthCard({ alerts, loading }) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 bg-surface-600 rounded mb-4" />
        <div className="grid grid-cols-3 gap-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-14 bg-surface-600 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Equipment Status</p>
        <span className="badge bg-surface-700 text-slate-400">{alerts.length} units</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {alerts.map((a) => (
          <div
            key={a.equipment_id}
            className="bg-surface-700 rounded-lg p-2.5 border border-surface-600 hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[a.severity]} ${a.severity === "critical" ? "animate-pulse" : ""}`} />
              <span className="text-[10px] text-slate-400 font-mono">{a.tag}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">{a.predicted_component}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{a.rul_days}d RUL</p>
          </div>
        ))}
      </div>
    </div>
  );
}
