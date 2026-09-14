import { createFileRoute } from "@tanstack/react-router";

import { Legend, SERIES_COLOR, TelemetryChart, type Series } from "@/components/charts/chart-kit";
import { Label, PageHeader, Panel, Section, Tag } from "@/components/primitives";
import { eng, pct } from "@/lib/format";
import {
  ALLAN_DEVIATION,
  CONTROLLER_METRICS,
  FEATURE_IMPORTANCE,
  IMPROVEMENTS,
} from "@/lib/research";

export const Route = createFileRoute("/stability")({
  head: () => ({
    meta: [
      { title: "Stability — AI vs Kalman — QuantumClockAI" },
      {
        name: "description",
        content:
          "Offline validation of AI-assisted control: Allan deviation versus a Kalman-only baseline, RMS/STD/maximum offset improvements and Transformer feature importance.",
      },
      { property: "og:title", content: "Stability — AI vs Kalman — QuantumClockAI" },
      {
        property: "og:description",
        content: "Allan deviation and multi-seed improvement statistics for the AI-assisted servo.",
      },
    ],
  }),
  component: StabilityPage,
});

const ALLAN_SERIES: Series[] = [
  { key: "kalman", label: "Kalman", accent: "signal" },
  { key: "ai", label: "AI-assisted", accent: "ai", emphasis: true },
];

const GROUP_ACCENT = {
  quantum: "ai",
  signal: "signal",
  environment: "ok",
  noise: "muted",
} as const;

function StabilityPage() {
  const allanData = ALLAN_DEVIATION.map((point) => ({
    t: point.tau,
    kalman: point.kalman,
    ai: point.ai,
  }));

  const maxWeight = FEATURE_IMPORTANCE[0].weight;

  return (
    <div className="space-y-12">
      <PageHeader
        title="Stability & controller comparison"
        subtitle="Frozen offline validation artefacts. These results are produced by multi-seed batch runs and are never mixed with the live telemetry stream."
        meta={<Tag accent="warn">Offline validation</Tag>}
      />

      <Section
        title="AI vs Kalman — Allan deviation"
        aside={<Legend series={ALLAN_SERIES} />}
      >
        <div className="rounded-md border border-hairline p-5">
          <TelemetryChart
            data={allanData}
            series={ALLAN_SERIES}
            xKey="t"
            xLabel="averaging time τ (s)"
            yLabel="σy(τ)"
            height={340}
            logX
            logY
            formatY={(v) => v.toExponential(0)}
            formatX={(v) => `${v}`}
          />
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4 border-t border-hairline pt-3">
            <Label className="max-w-md normal-case tracking-normal">
              AI improvement increases with averaging time — the Transformer
              suppresses the low-frequency drift the Kalman filter cannot anticipate.
            </Label>
            <span className="num text-[0.6875rem] text-muted-foreground/70">
              log–log axes · τ = 1 … 1000 s
            </span>
          </div>
        </div>
      </Section>

      <Section title="Validated multi-seed improvement">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-hairline bg-hairline md:grid-cols-3">
          {IMPROVEMENTS.map((item) => (
            <div key={item.metric} className="bg-card/50 p-5">
              <Label>{item.metric} improvement</Label>
              <div className="num mt-2 text-[2rem] leading-none tracking-[-0.02em] text-ok">
                {item.mean.toFixed(2)}
                <span className="text-lg">%</span>
              </div>
              <div className="num mt-2 text-[0.6875rem] text-muted-foreground">
                ± {item.sigma.toFixed(2)}% across seeds
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Kalman-only vs AI-assisted">
        <div className="overflow-hidden rounded-md border border-hairline">
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="label-xs px-5 py-2.5 font-medium">Metric</th>
                <th className="label-xs px-5 py-2.5 text-right font-medium">Kalman-only</th>
                <th className="label-xs px-5 py-2.5 text-right font-medium">AI-assisted</th>
                <th className="label-xs px-5 py-2.5 text-right font-medium">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {CONTROLLER_METRICS.map((row) => {
                const delta = ((row.kalman - row.ai) / row.kalman) * 100;
                return (
                  <tr key={row.metric} className="transition-colors hover:bg-secondary/20">
                    <td className="px-5 py-3 text-foreground">{row.metric}</td>
                    <td className="num px-5 py-3 text-right text-signal">{eng(row.kalman)}</td>
                    <td className="num px-5 py-3 text-right text-ai">{eng(row.ai)}</td>
                    <td className="num px-5 py-3 text-right text-ok">−{pct(delta)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Transformer feature importance"
        aside={<Tag accent="warn">Offline model analysis</Tag>}
      >
        <div className="divide-y divide-hairline border-y border-hairline">
          {FEATURE_IMPORTANCE.map((feature) => (
            <div
              key={feature.feature}
              className="grid grid-cols-[minmax(0,18rem)_1fr_minmax(0,4.5rem)] items-center gap-6 py-2.5"
            >
              <span className="num truncate text-[0.75rem] text-foreground">
                {feature.feature}
              </span>
              <div className="h-[5px] w-full bg-secondary/40">
                <div
                  className="h-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${(feature.weight / maxWeight) * 100}%`,
                    backgroundColor: SERIES_COLOR[GROUP_ACCENT[feature.group]],
                    opacity: 0.9,
                  }}
                />
              </div>
              <span className="num text-right text-[0.75rem] tabular-nums text-muted-foreground">
                {feature.weight.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <Panel className="mt-4" inset>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.6875rem] text-muted-foreground">
            {Object.entries(GROUP_ACCENT).map(([group, accent]) => (
              <span key={group} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-[3px] w-4"
                  style={{ backgroundColor: SERIES_COLOR[accent] }}
                />
                {group}
              </span>
            ))}
          </div>
        </Panel>
      </Section>
    </div>
  );
}
