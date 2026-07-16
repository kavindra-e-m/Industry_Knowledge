export default function StatRing({ value, max = 100, size = 120, stroke = 8, color = "#34D399", label, sublabel, loading }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = circ * pct;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="ib-skeleton rounded-full" style={{ width: size, height: size }} />
        <div className="ib-skeleton h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E3A5F" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-sora text-white leading-none">{value}{max === 100 ? "%" : ""}</span>
          {sublabel && <span className="text-[10px] text-[#4A6080] mt-0.5 uppercase tracking-wider">{sublabel}</span>}
        </div>
      </div>
      {label && <p className="text-[11px] text-[#8BA3C7] text-center font-jakarta">{label}</p>}
    </div>
  );
}
