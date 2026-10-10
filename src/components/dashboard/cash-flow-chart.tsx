"use client";

import { useState } from "react";
import { EllipsisVertical, Info } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { flowDatasets, type FlowPoint, type FlowRange } from "./data";
import { cn } from "@/lib/utils";

const INCOME_COLOR = "#a78bfa";
const EXPENSE_COLOR = "#f59e0b";

const RANGES: { value: FlowRange; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/* ---------- Custom x-axis tick: highlights the active month ---------- */

interface FlowTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
  activeLabel?: string;
}

function FlowTick({ x, y, payload, activeLabel }: FlowTickProps) {
  const value = String(payload?.value ?? "");
  const isActive = value === activeLabel;
  return (
    <text
      x={Number(x ?? 0)}
      y={Number(y ?? 0)}
      dy={14}
      textAnchor="middle"
      fill={isActive ? "#26262b" : "#a1a1aa"}
      fontSize={11.5}
      fontWeight={isActive ? 600 : 400}
      style={{ transition: "fill 200ms ease" }}
    >
      {value}
    </text>
  );
}

/* --------------------- Custom tooltip card --------------------- */

function FlowTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as FlowPoint;
  return (
    <div className="min-w-[170px] rounded-xl border border-neutral-100 bg-white px-3.5 py-3 shadow-xl shadow-neutral-900/10">
      <p className="text-xs font-semibold text-neutral-800">{point.title}</p>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: INCOME_COLOR }}
          />
          <span className="text-neutral-400">Income</span>
          <span className="ml-auto font-semibold tabular-nums text-neutral-800">
            ${point.income}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: EXPENSE_COLOR }}
          />
          <span className="text-neutral-400">Expense</span>
          <span className="ml-auto font-semibold tabular-nums text-neutral-800">
            ${point.expense}
          </span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Dots ----------------------------- */

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  key?: string | number;
}

export function CashFlowChart({ className }: { className?: string }) {
  const [range, setRange] = useState<FlowRange>("monthly");
  const [activeIndex, setActiveIndex] = useState(
    flowDatasets.monthly.pinnedIndex
  );
  const [leaveTick, setLeaveTick] = useState(0);
  const dataset = flowDatasets[range];

  const handleRangeChange = (value: string) => {
    const next = value as FlowRange;
    setRange(next);
    setActiveIndex(flowDatasets[next].pinnedIndex);
  };

  const activeLabel = dataset.points[activeIndex]?.label;

  const incomeDot = ({ cx, cy, index, key }: DotProps) => {
    if (cx == null || cy == null || index !== activeIndex)
      return <g key={key} />;
    return (
      <g key={key}>
        <circle
          cx={cx}
          cy={cy}
          r={11}
          fill={INCOME_COLOR}
          opacity={0.3}
          className="ff-ping"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#ffffff"
          stroke={INCOME_COLOR}
          strokeWidth={2.5}
        />
      </g>
    );
  };

  const expenseDot = ({ cx, cy, index, key }: DotProps) => {
    if (cx == null || cy == null || index !== activeIndex)
      return <g key={key} />;
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={4}
        fill="#ffffff"
        stroke={EXPENSE_COLOR}
        strokeWidth={2.5}
      />
    );
  };

  return (
    <section
      className={cn(
        "ff-card rounded-2xl border border-neutral-200/70 bg-white p-5",
        className
      )}
    >
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[15px] font-semibold text-neutral-900">
            Cash Flow Analytics
          </h3>
          <Info className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1">
          <Select value={range} onValueChange={handleRangeChange}>
            <SelectTrigger
              aria-label="Chart range"
              className="h-8 w-[112px] rounded-lg border-none bg-transparent px-2.5 text-[13px] font-medium text-neutral-600 shadow-none hover:bg-neutral-100 focus:ring-0 focus:ring-offset-0 [&>svg]:size-4 [&>svg]:text-neutral-400"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[120px] rounded-xl border-neutral-100">
              {RANGES.map((r) => (
                <SelectItem
                  key={r.value}
                  value={r.value}
                  className="rounded-lg text-[13px]"
                >
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            aria-label="More options"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <EllipsisVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-3 h-[248px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataset.points}
            margin={{ top: 12, right: 32, bottom: 0, left: 0 }}
            onMouseMove={(state: { activeTooltipIndex?: number }) => {
              const idx = state.activeTooltipIndex;
              if (typeof idx === "number" && idx >= 0 && idx !== activeIndex) {
                setActiveIndex(idx);
              }
            }}
            onMouseLeave={() => {
              setActiveIndex(dataset.pinnedIndex);
              setLeaveTick((t) => t + 1);
            }}
          >
            <CartesianGrid vertical={false} stroke="#f1f1f3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={<FlowTick activeLabel={activeLabel} />}
            />
            <YAxis
              domain={[60, 980]}
              ticks={[100, 300, 500, 700, 900]}
              axisLine={false}
              tickLine={false}
              width={46}
              tickFormatter={(value: number) => `$${value}`}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />
            <Tooltip
              key={`${range}-${activeIndex}-${leaveTick}`}
              defaultIndex={Math.min(activeIndex, dataset.points.length - 1)}
              cursor={{ stroke: "#d4d4d8", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={<FlowTooltip />}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke={EXPENSE_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              dot={expenseDot}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke={INCOME_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              dot={incomeDot}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
