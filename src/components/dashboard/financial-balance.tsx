"use client";

import { useState, type CSSProperties } from "react";
import { balanceSegments } from "./data";
import { cn } from "@/lib/utils";

const SIZE = 200;
const R = 80;
const STROKE = 24;
const C = 2 * Math.PI * R; // ≈ 502.65
const GAP = 8; // gap between segments, in path units

interface DonutArc {
  id: string;
  label: string;
  value: number;
  color: string;
  len: number;
  start: number;
}

function buildArcs(segments: typeof balanceSegments): DonutArc[] {
  let acc = 0;
  return segments.map((seg) => {
    const len = (seg.value / 100) * C;
    const arc = { ...seg, len, start: acc };
    acc += len;
    return arc;
  });
}

export function FinancialBalance({ className }: { className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = balanceSegments.find((s) => s.id === hovered);
  const arcs = buildArcs(balanceSegments);

  return (
    <section
      className={cn(
        "ff-card flex flex-col rounded-2xl border border-neutral-200/70 bg-white p-5",
        className
      )}
    >
      <h3 className="text-[15px] font-semibold text-neutral-900">
        Financial Balance
      </h3>

      {/* Donut */}
      <div className="relative mx-auto mt-4 h-[200px] w-[200px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Financial balance distribution"
          className="h-full w-full"
        >
          {arcs.map((arc, i) => {
            const dash = Math.max(arc.len - GAP, 6);
            const rotation = -90 + (arc.start / C) * 360 + (GAP / 2 / C) * 360;
            const isHovered = hovered === arc.id;
            return (
              <circle
                key={arc.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={arc.color}
                strokeWidth={isHovered ? STROKE + 5 : STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                transform={`rotate(${rotation} ${SIZE / 2} ${SIZE / 2})`}
                className="ff-donut-segment cursor-pointer transition-[stroke-width] duration-200"
                style={
                  {
                    "--seg-len": `${dash}`,
                    "--seg-rest": `${C - dash}`,
                    animationDelay: `${i * 130}ms`,
                  } as CSSProperties
                }
                onMouseEnter={() => setHovered(arc.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{`${arc.label}: ${arc.value}%`}</title>
              </circle>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p
            key={active?.id ?? "default"}
            className="text-[32px] font-bold leading-none tracking-tight text-neutral-900"
          >
            {active ? active.value : "48"}
            <span className="text-base font-medium text-neutral-300">%</span>
          </p>
          <p className="mt-1.5 text-[11.5px] text-neutral-400">
            {active ? active.label : "From Yesterday"}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {balanceSegments.map((seg) => (
          <button
            key={seg.id}
            type="button"
            onMouseEnter={() => setHovered(seg.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(seg.id)}
            onBlur={() => setHovered(null)}
            className="group flex items-center gap-1.5 text-[11.5px] text-neutral-500 transition-colors hover:text-neutral-800"
          >
            <span
              className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label}
          </button>
        ))}
      </div>
    </section>
  );
}
