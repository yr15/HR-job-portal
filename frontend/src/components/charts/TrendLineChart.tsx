import { useState, type MouseEvent } from "react";
import type { ApplicationsByDay } from "../../types";

const WIDTH = 600;
const HEIGHT = 200;
const PADDING_LEFT = 32;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 20;
const LINE_COLOR = "#2a78d6";

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendLineChart({ data }: { data: ApplicationsByDay[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = Math.max(1, ...data.map((d) => d.count));
  const plotWidth = WIDTH - PADDING_LEFT;
  const plotHeight = HEIGHT - PADDING_BOTTOM - PADDING_TOP;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const xFor = (i: number) => PADDING_LEFT + i * stepX;
  const yFor = (value: number) => PADDING_TOP + plotHeight - (value / maxValue) * plotHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.count)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${PADDING_TOP + plotHeight} L ${xFor(0)} ${PADDING_TOP + plotHeight} Z`;

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const index = Math.round((pointerX - PADDING_LEFT) / (stepX || 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  };

  const tickIndices = data.map((_, i) => i).filter((i) => i % 3 === 0 || i === data.length - 1);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxHeight: 240 }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* gridlines */}
        {[0, 0.5, 1].map((fraction) => (
          <line
            key={fraction}
            x1={PADDING_LEFT}
            x2={WIDTH}
            y1={PADDING_TOP + plotHeight * fraction}
            y2={PADDING_TOP + plotHeight * fraction}
            stroke="#e1e0d9"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        ))}
        <text x={0} y={PADDING_TOP + 4} fontSize={11} fill="#898781">
          {maxValue}
        </text>
        <text x={0} y={PADDING_TOP + plotHeight + 4} fontSize={11} fill="#898781">
          0
        </text>

        <path d={areaPath} fill={LINE_COLOR} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {tickIndices.map((i) => (
          <text key={i} x={xFor(i)} y={HEIGHT - 4} fontSize={10} fill="#52514e" textAnchor="middle">
            {formatShortDate(data[i].date)}
          </text>
        ))}

        {/* end-point marker + direct label */}
        <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1].count)} r={4} fill={LINE_COLOR} stroke="#fcfcfb" strokeWidth={2} />
        <text
          x={xFor(data.length - 1)}
          y={yFor(data[data.length - 1].count) - 10}
          textAnchor="end"
          fontSize={12}
          fontWeight={600}
          fill="#0b0b0b"
        >
          {data[data.length - 1].count}
        </text>

        {hoverIndex !== null && (
          <>
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PADDING_TOP}
              y2={PADDING_TOP + plotHeight}
              stroke="#c3c2b7"
              strokeWidth={1}
            />
            <circle cx={xFor(hoverIndex)} cy={yFor(data[hoverIndex].count)} r={4} fill={LINE_COLOR} stroke="#fcfcfb" strokeWidth={2} />
          </>
        )}
      </svg>
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
          }}
        >
          <span className="font-semibold text-slate-900">{data[hoverIndex].count}</span>{" "}
          <span className="text-slate-500">applications on {formatShortDate(data[hoverIndex].date)}</span>
        </div>
      )}
    </div>
  );
}
