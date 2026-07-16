import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const getColor = (prob) => {
  if (prob >= 0.8) return "#ef4444";
  if (prob >= 0.5) return "#f59e0b";
  return "#22c55e";
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-700 border border-surface-500 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold">{d.tag}</p>
      <p className="text-slate-400 mt-1">Failure Prob: <span className="text-white">{(d.failure_probability * 100).toFixed(0)}%</span></p>
      <p className="text-slate-400">RUL: <span className="text-white">{d.rul_days} days</span></p>
    </div>
  );
};

export default function FailureProbChart({ alerts, loading }) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-40 bg-surface-600 rounded mb-4" />
        <div className="h-40 bg-surface-700 rounded" />
      </div>
    );
  }

  const data = [...alerts].sort((a, b) => b.failure_probability - a.failure_probability);

  return (
    <div className="card card-hover">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">Failure Probability by Equipment</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2640" vertical={false} />
          <XAxis dataKey="tag" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="failure_probability" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.failure_probability)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
