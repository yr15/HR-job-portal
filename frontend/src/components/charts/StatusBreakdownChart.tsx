import { useState } from "react";

interface BarDatum {
  label: string;
  value: number;
  colorRole: "neutral" | "good" | "critical";
}

const COLOR_HEX: Record<BarDatum["colorRole"], string> = {
  neutral: "#2a78d6",
  good: "#0ca30c",
  critical: "#d03b3b",
};

const CHART_HEIGHT = 160;
const BAR_WIDTH = 24;
const BAR_GAP = 48;
const AXIS_Y = CHART_HEIGHT;

export function StatusBreakdownChart({ data }: { data: BarDatum[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const width = data.length * (BAR_WIDTH + BAR_GAP);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${CHART_HEIGHT + 32}`} className="w-full" style={{ maxHeight: 220 }}>
        <line
          x1={0}
          y1={AXIS_Y}
          x2={width}
          y2={AXIS_Y}
          stroke="#c3c2b7"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * (CHART_HEIGHT - 24);
          const x = i * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
          const y = AXIS_Y - barHeight;
          const isHovered = hoverIndex === i;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={barHeight > 0 ? y : AXIS_Y - 2}
                width={BAR_WIDTH}
                height={Math.max(barHeight, 2)}
                rx={4}
                fill={COLOR_HEX[d.colorRole]}
                opacity={isHovered ? 0.85 : 1}
                onPointerEnter={() => setHoverIndex(i)}
                onPointerLeave={() => setHoverIndex(null)}
                style={{ cursor: "pointer" }}
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="#0b0b0b"
              >
                {d.value}
              </text>
              <text
                x={x + BAR_WIDTH / 2}
                y={AXIS_Y + 20}
                textAnchor="middle"
                fontSize={12}
                fill="#52514e"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${((hoverIndex * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2 + BAR_WIDTH / 2) / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
          }}
        >
          <span className="font-semibold text-slate-900">{data[hoverIndex].value}</span>{" "}
          <span className="text-slate-500">{data[hoverIndex].label}</span>
        </div>
      )}
    </div>
  );
}
