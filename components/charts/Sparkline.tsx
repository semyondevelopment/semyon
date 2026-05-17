"use client";
import { motion } from "framer-motion";

export default function Sparkline({
  data, width = 320, height = 90, color = "#d1fa6e", fill = true, label,
}: {
  data: { x: number; y: number; label?: string }[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  label?: string;
}) {
  if (!data.length) {
    return <div className="text-xs text-sub">No data yet.</div>;
  }
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const sx = (x: number) => pad + (maxX === minX ? w / 2 : ((x - minX) / (maxX - minX)) * w);
  const sy = (y: number) => pad + (maxY === minY ? h / 2 : (1 - (y - minY) / (maxY - minY)) * h);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${sx(d.x).toFixed(1)},${sy(d.y).toFixed(1)}`).join(" ");
  const area = `${path} L${sx(maxX).toFixed(1)},${(height - pad).toFixed(1)} L${sx(minX).toFixed(1)},${(height - pad).toFixed(1)} Z`;
  const last = data[data.length - 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {fill && (
          <motion.path
            d={area}
            fill={color} fillOpacity={0.12}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
          />
        )}
        <motion.path
          d={path}
          fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        />
        {data.map((d, i) => (
          <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={i === data.length - 1 ? 3.5 : 1.8} fill={color} />
        ))}
      </svg>
      {label && (
        <div className="mt-1 flex items-baseline justify-between text-[11px] text-sub">
          <span>{label}</span>
          <span className="tabular-nums" style={{ color }}>{last.label ?? last.y.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
