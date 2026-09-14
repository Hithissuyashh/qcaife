import { createFileRoute } from "@tanstack/react-router";

import { SERIES_COLOR, TelemetryChart, type SeriesAccent } from "@/components/charts/chart-kit";
import { Label, PageHeader, Readout, Section } from "@/components/primitives";
import { useTelemetry } from "@/hooks/telemetry-context";
import { eng } from "@/lib/format";
import { buildSeries, tickExp } from "@/lib/series";
import type { ClockSample, Num } from "@/types/telemetry";

export const Route = createFileRoute("/noise")({
  head: () => ({
    meta: [
      { title: "Noise Observatory — QuantumClockAI" },
      {
        name: "description",
        content:
          "Physical noise decomposition of the optical clock: white, random walk, flicker, laser phase, quantum projection noise, Zeeman, blackbody and aging terms.",
      },
      { property: "og:title", content: "Noise Observatory — QuantumClockAI" },
      {
        property: "og:description",
        content: "Per-component physical noise budget of the clock digital twin.",
      },
    ],
  }),
  component: NoisePage,
});

interface Component {
  key: string;
  label: string;
  accent: SeriesAccent;
  get: (sample: ClockSample) => Num;
}

const COMPONENTS: Component[] = [
  { key: "white", label: "White", accent: "signal", get: (s) => s.noise.white },
  { key: "random_walk", label: "Random walk", accent: "ai", get: (s) => s.noise.random_walk },
  { key: "flicker", label: "Flicker", accent: "ok", get: (s) => s.noise.flicker },
  { key: "laser_phase", label: "Laser phase", accent: "warn", get: (s) => s.noise.laser_phase },
  { key: "qpn", label: "QPN", accent: "muted", get: (s) => s.noise.qpn },
  { key: "temperature", label: "Temperature", accent: "fault", get: (s) => s.noise.temperature },
  { key: "zeeman", label: "Zeeman", accent: "signal", get: (s) => s.noise.zeeman },
  { key: "blackbody", label: "Blackbody", accent: "ai", get: (s) => s.noise.blackbody },
  { key: "aging", label: "Aging", accent: "muted", get: (s) => s.noise.aging },
];

function NoisePage() {
  const { latest, history } = useTelemetry();

  const contributions = COMPONENTS.map((component) => {
    const value = latest ? component.get(latest) : null;
    return { ...component, value, magnitude: value === null ? null : Math.abs(value) };
  });

  const maxMagnitude = Math.max(
    ...contributions.map((c) => c.magnitude ?? 0),
    Number.EPSILON,
  );

  const timeSeries = buildSeries(history, {
    ...Object.fromEntries(COMPONENTS.map((c) => [c.key, c.get])),
    total: (s) => s.noise.total,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Noise observatory"
        subtitle="Instantaneous decomposition of the physical noise acting on the oscillator and atomic reference, in frequency units."
        meta={
          <Readout
            label="Total noise"
            value={eng(latest?.noise.total ?? null)}
            unit="Hz"
            size="md"
          />
        }
      />

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[24rem_1fr]">
        <Section title="Contribution — current sample">
          <div className="divide-y divide-hairline border-y border-hairline">
            {contributions.map((component) => {
              const width =
                component.magnitude === null
                  ? 0
                  : Math.max(1, (component.magnitude / maxMagnitude) * 100);
              return (
                <div key={component.key} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.8125rem] text-foreground">{component.label}</span>
                    <span className="num text-[0.75rem] tabular-nums text-muted-foreground">
                      {eng(component.value)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full bg-secondary/50">
                    <div
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${width}%`,
                        backgroundColor: SERIES_COLOR[component.accent],
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Label className="mt-3">
            Bars scaled to the largest absolute component in the current sample
          </Label>
        </Section>

        <Section title="Noise time series">
          <TelemetryChart
            data={timeSeries}
            series={[
              ...COMPONENTS.map((c) => ({ key: c.key, label: c.label, accent: c.accent })),
              { key: "total", label: "Total", accent: "neutral" as const, emphasis: true },
            ]}
            xKey="t"
            xLabel="t (s)"
            yLabel="Hz"
            height={420}
            formatY={tickExp}
          />
        </Section>
      </div>
    </div>
  );
}
