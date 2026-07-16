import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

export default function ComplianceScoreRing({ score, loading }) {
  const color = getScoreColor(score);
  const data = [{ value: score, fill: color }];

  if (loading) {
    return (
      <div className="card animate-pulse flex items-center justify-center h-40">
        <div className="w-24 h-24 rounded-full bg-surface-600" />
      </div>
    );
  }

  return (
    <div className="card card-hover flex flex-col items-center justify-center">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 self-start">Compliance Score</p>
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={data}
          >
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#1c2640" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-slate-500">/ 100</span>
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color }}>
        {score >= 80 ? "Compliant" : score >= 60 ? "Partial" : "Non-Compliant"}
      </p>
    </div>
  );
}
