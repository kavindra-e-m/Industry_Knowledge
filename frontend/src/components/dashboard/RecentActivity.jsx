import { useState, useEffect } from "react";

const ACTIVITY_FEED = [
  { id: 1, type: "alert", msg: "PUMP-A1 failure probability crossed 85% threshold", time: "2m ago", color: "text-critical" },
  { id: 2, type: "work_order", msg: "Work order WO-20240115 created for MOTOR-E1", time: "5m ago", color: "text-warning" },
  { id: 3, type: "compliance", msg: "IEC 60034 certification expired for MOTOR-E1", time: "18m ago", color: "text-critical" },
  { id: 4, type: "ai", msg: "AI detected bearing degradation pattern on COMP-B3", time: "31m ago", color: "text-info" },
  { id: 5, type: "resolved", msg: "VALVE-D7 inspection completed — no action required", time: "1h ago", color: "text-healthy" },
];

export default function RecentActivity() {
  const [items, setItems] = useState(ACTIVITY_FEED);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => [
        { id: Date.now(), type: "alert", msg: `Live: AI updated risk score for PUMP-A1`, time: "just now", color: "text-critical" },
        ...prev.slice(0, 4),
      ]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Recent Activity</p>
        <span className="flex items-center gap-1 text-[10px] text-healthy">
          <span className="w-1.5 h-1.5 rounded-full bg-healthy animate-pulse" /> Live
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 animate-fade-in">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.color.replace("text-", "bg-")}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${item.color}`}>{item.msg}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
