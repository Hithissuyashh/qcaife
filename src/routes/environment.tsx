import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Sparkline, TelemetryChart, type SeriesAccent } from "@/components/charts/chart-kit";
import { PageHeader, Section } from "@/components/primitives";
import { useTelemetry } from "@/hooks/telemetry-context";
import { age, fixed } from "@/lib/format";
import { buildSeries, sparkData, tickPlain } from "@/lib/series";
import type { ClockSample, Num } from "@/types/telemetry";

export const Route = createFileRoute("/environment")({
  head: () => ({
    meta: [
      { title: "Environment — QuantumClockAI" },
      {
        name: "description",
        content:
          "Laboratory environment instrumentation: temperature, magnetic field, laser power, chamber pressure and humidity feeding the clock disturbance model.",
      },
      { property: "og:title", content: "Environment — QuantumClockAI" },
      {
        property: "og:description",
        content: "Lab environment channels driving the clock disturbance model.",
      },
    ],
  }),
  component: EnvironmentPage,
});

interface Channel {
  key: string;
  label: string;
  unit: string;
  digits: number;
  accent: SeriesAccent;
  get: (sample: ClockSample) => Num;
}

const CHANNELS: Channel[] = [
  { key: "temperature", label: "Temperature", unit: "K", digits: 4, accent: "warn", get: (s) => s.environment.temperature },
  { key: "magnetic", label: "Magnetic field", unit: "T", digits: 6, accent: "signal", get: (s) => s.environment.magnetic },
  { key: "laser_power", label: "Laser power", unit: "W", digits: 5, accent: "ai", get: (s) => s.environment.laser_power },
  { key: "pressure", label: "Pressure", unit: "Pa", digits: 6, accent: "ok", get: (s) => s.environment.pressure },
  { key: "humidity", label: "Humidity", unit: "%RH", digits: 3, accent: "muted", get: (s) => s.environment.humidity },
];

function EnvironmentPage() {
  const { latest, history, lastMessageAt } = useTelemetry();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const picks = Object.fromEntries(CHANNELS.map((c) => [c.key, c.get]));
  const data = buildSeries(history, picks);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Laboratory environment"
        subtitle="Instrumentation channels sampled at the simulation timestep. Each channel perturbs the atomic reference through the physical noise model."
        meta={
          <span className="num text-[0.6875rem] text-muted-foreground">
            dt {fixed(latest?.environment.dt ?? null, 4)} s
          </span>
        }
      />

      <div className="divide-y divide-hairline border-y border-hairline">
        {CHANNELS.map((channel) => {
          const value = latest ? channel.get(latest) : null;
          return (
            <div
              key={channel.key}
              className="grid grid-cols-[minmax(0,10rem)_minmax(0,12rem)_1fr_minmax(0,8rem)] items-center gap-6 py-4 transition-colors duration-200 hover:bg-secondary/20"
            >
              <div className="text-[0.8125rem] text-foreground">{channel.label}</div>
              <div>
                <span className="num text-lg tabular-nums text-foreground">
                  {fixed(value, channel.digits)}
                </span>
                <span className="ml-1.5 text-[0.6875rem] text-muted-foreground">
                  {channel.unit}
                </span>
              </div>
              <Sparkline data={sparkData(history, channel.get)} accent={channel.accent} />
              <div className="num text-right text-[0.6875rem] text-muted-foreground/70">
                {age(lastMessageAt, now)}
              </div>
            </div>
          );
        })}
      </div>

      <Section title="Environment time series">
        <TelemetryChart
          data={data}
          series={CHANNELS.map((c) => ({
            key: c.key,
            label: `${c.label} (${c.unit})`,
            accent: c.accent,
          }))}
          xKey="t"
          xLabel="t (s)"
          height={300}
          formatY={tickPlain}
        />
        <p className="mt-3 text-[0.6875rem] text-muted-foreground/70">
          Channels share one axis; use the crosshair readout for per-channel values in native units.
        </p>
      </Section>
    </div>
  );
}
