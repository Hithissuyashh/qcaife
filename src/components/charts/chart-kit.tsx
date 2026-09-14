import type { ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

export const SERIES_COLOR = {
  neutral: "var(--foreground)",
  signal: "var(--signal)",
  ai: "var(--ai)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  fault: "var(--fault)",
  muted: "var(--muted-foreground)",
} as const;

export type SeriesAccent = keyof typeof SERIES_COLOR;

export interface Series {
  key: string;
  label: string;
  accent: SeriesAccent;
  /** Emphasised series render thicker and paint last. */
  emphasis?: boolean;
  dashed?: boolean;
}

const axisProps = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" },
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
} as const;

export function Legend({ series, className }: { series: Series[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-1.5", className)}>
      {series.map((s) => (
        <span
          key={s.key}
          className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground"
        >
          <span
            aria-hidden
            className="inline-block h-px w-4"
            style={{
              backgroundColor: SERIES_COLOR[s.accent],
              height: s.emphasis ? 2 : 1,
              opacity: s.dashed ? 0.7 : 1,
            }}
          />
          <span className={s.emphasis ? "text-foreground" : undefined}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

function TooltipCard({
  active,
  payload,
  label,
  xLabel,
  format,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; dataKey?: string | number; value?: number; color?: string }>;
  label?: string | number;
  xLabel: string;
  format: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[13rem] rounded-md border border-border bg-popover/95 px-3 py-2.5 shadow-xl backdrop-blur-[2px]">
      <div className="num mb-2 text-[0.6875rem] text-muted-foreground">
        {xLabel} {typeof label === "number" ? label.toPrecision(6) : label}
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-baseline justify-between gap-4 text-[0.75rem]"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                aria-hidden
                className="inline-block h-px w-3"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="num tabular-nums text-foreground">
              {typeof entry.value === "number" ? format(entry.value) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TelemetryChartProps {
  data: Array<Record<string, number | null>>;
  series: Series[];
  xKey: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  logX?: boolean;
  logY?: boolean;
  formatY: (value: number) => string;
  formatX?: (value: number) => string;
  empty?: ReactNode;
}

export function TelemetryChart({
  data,
  series,
  xKey,
  xLabel = "t",
  yLabel,
  height = 260,
  logX = false,
  logY = false,
  formatY,
  formatX,
  empty,
}: TelemetryChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border/70 text-[0.75rem] text-muted-foreground"
        style={{ height }}
      >
        {empty ?? "No samples received"}
      </div>
    );
  }

  const ordered = [...series].sort(
    (a, b) => Number(Boolean(a.emphasis)) - Number(Boolean(b.emphasis)),
  );

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 14, bottom: 16, left: 4 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
          <XAxis
            {...axisProps}
            dataKey={xKey}
            type="number"
            scale={logX ? "log" : "linear"}
            domain={logX ? [1, "auto"] : ["dataMin", "dataMax"]}
            tickFormatter={(v: number) => (formatX ? formatX(v) : String(v))}
            minTickGap={28}
            label={{
              value: xLabel,
              position: "insideBottomRight",
              offset: -8,
              fill: "var(--muted-foreground)",
              fontSize: 10,
            }}
          />
          <YAxis
            {...axisProps}
            width={78}
            scale={logY ? "log" : "linear"}
            domain={logY ? ["auto", "auto"] : ["auto", "auto"]}
            tickFormatter={formatY}
            {...(yLabel
              ? {
                  label: {
                    value: yLabel,
                    angle: -90,
                    position: "insideLeft" as const,
                    fill: "var(--muted-foreground)",
                    fontSize: 10,
                  },
                }
              : {})}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={
              <TooltipCard xLabel={xLabel} format={formatY} />
            }
          />
          {ordered.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={SERIES_COLOR[s.accent]}
              strokeWidth={s.emphasis ? 1.75 : 1}
              strokeDasharray={s.dashed ? "3 3" : undefined}
              strokeOpacity={s.emphasis ? 1 : 0.78}
              dot={false}
              activeDot={{ r: 2.5, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Sparkline used in instrumentation rows. */
export function Sparkline({
  data,
  accent = "signal",
  height = 34,
}: {
  data: Array<{ x: number; y: number | null }>;
  accent?: SeriesAccent;
  height?: number;
}) {
  if (data.length < 2) {
    return <div style={{ height }} className="w-full rounded-sm bg-secondary/30" />;
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 0, bottom: 3, left: 0 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <XAxis hide dataKey="x" type="number" domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="y"
            stroke={SERIES_COLOR[accent]}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
