import { createFileRoute } from "@tanstack/react-router";

import { TelemetryChart } from "@/components/charts/chart-kit";
import { KeyValue, PageHeader, Panel, Readout, Section } from "@/components/primitives";
import { useTelemetry } from "@/hooks/telemetry-context";
import { eng, fixed } from "@/lib/format";
import { buildSeries, tickExp } from "@/lib/series";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quantum")({
  head: () => ({
    meta: [
      { title: "Ramsey Interrogation — QuantumClockAI" },
      {
        name: "description",
        content:
          "Ramsey spectroscopy interface: excitation probabilities P(+) and P(−), probe offset, interrogation time, discriminator signal and estimated detuning.",
      },
      { property: "og:title", content: "Ramsey Interrogation — QuantumClockAI" },
      {
        property: "og:description",
        content: "Spectroscopy and frequency-discrimination stage of the clock digital twin.",
      },
    ],
  }),
  component: QuantumPage,
});

const STAGES = [
  { id: "OSCILLATOR", note: "probe laser" },
  { id: "RAMSEY", note: "π/2 — T — π/2" },
  { id: "DISCRIMINATOR", note: "P(+) − P(−)" },
  { id: "KALMAN", note: "state estimate" },
  { id: "SERVO", note: "PI correction" },
] as const;

function SignalFlow({ active }: { active: boolean }) {
  return (
    <div className="flex items-stretch overflow-x-auto rounded-md border border-hairline">
      {STAGES.map((stage, index) => (
        <div key={stage.id} className="flex min-w-0 flex-1 items-stretch">
          <div className="min-w-[9rem] flex-1 px-4 py-3.5">
            <div
              className={cn(
                "label-xs transition-colors duration-500",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {stage.id}
            </div>
            <div className="num mt-1 text-[0.6875rem] text-muted-foreground/70">
              {stage.note}
            </div>
          </div>
          {index < STAGES.length - 1 ? (
            <div className="flex w-6 items-center justify-center border-x border-hairline text-[0.75rem] text-muted-foreground/50">
              →
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function QuantumPage() {
  const { latest, history, state } = useTelemetry();

  const probabilityData = buildSeries(history, {
    excitation_probability_plus: (s) => s.excitation_probability_plus,
    excitation_probability_minus: (s) => s.excitation_probability_minus,
  });

  const discriminatorData = buildSeries(history, {
    discriminator: (s) => s.discriminator,
    true_detuning: (s) => s.true_detuning,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Ramsey interrogation"
        subtitle="Two-pulse interrogation of the atomic reference. The excitation probabilities at ±δ form the frequency discriminator driving the estimator."
      />

      <SignalFlow active={state === "open"} />

      <div className="grid grid-cols-2 gap-x-10 gap-y-6 border-b border-hairline pb-8 lg:grid-cols-6">
        <Readout
          label="P(+)"
          value={fixed(latest?.excitation_probability_plus ?? null, 6)}
          size="md"
          accent="signal"
        />
        <Readout
          label="P(−)"
          value={fixed(latest?.excitation_probability_minus ?? null, 6)}
          size="md"
          accent="ai"
        />
        <Readout label="Probe offset" value={eng(latest?.probe_offset ?? null)} unit="Hz" />
        <Readout
          label="Interrogation time"
          value={fixed(latest?.interrogation_time ?? null, 4)}
          unit="s"
        />
        <Readout
          label="Discriminator"
          value={eng(latest?.discriminator ?? null)}
          accent="signal"
        />
        <Readout
          label="Estimated detuning"
          value={eng(latest?.estimated_offset ?? null)}
          unit="Hz"
          accent="ai"
        />
      </div>

      <Section title="Excitation probabilities">
        <TelemetryChart
          data={probabilityData}
          series={[
            { key: "excitation_probability_plus", label: "P(+)", accent: "signal", emphasis: true },
            { key: "excitation_probability_minus", label: "P(−)", accent: "ai" },
          ]}
          xKey="t"
          xLabel="t (s)"
          yLabel="probability"
          height={280}
          formatY={(v) => v.toFixed(3)}
        />
      </Section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_20rem]">
        <Section title="Discriminator signal vs true detuning">
          <TelemetryChart
            data={discriminatorData}
            series={[
              { key: "discriminator", label: "Discriminator", accent: "signal", emphasis: true },
              { key: "true_detuning", label: "True detuning", accent: "muted", dashed: true },
            ]}
            xKey="t"
            xLabel="t (s)"
            height={240}
            formatY={tickExp}
          />
        </Section>
        <Section title="Interrogation parameters">
          <Panel>
            <KeyValue
              rows={[
                { key: "Sequence", value: "π/2 — T — π/2" },
                { key: "Probe offset", value: `${eng(latest?.probe_offset ?? null)} Hz` },
                { key: "Free evolution T", value: `${fixed(latest?.interrogation_time ?? null, 4)} s` },
                { key: "P(+) − P(−)", value: eng(
                    latest &&
                      latest.excitation_probability_plus !== null &&
                      latest.excitation_probability_minus !== null
                      ? latest.excitation_probability_plus - latest.excitation_probability_minus
                      : null,
                  ) },
                { key: "Measured offset", value: `${eng(latest?.measured_offset ?? null)} Hz`, accent: "signal" },
                { key: "Kalman estimate", value: `${eng(latest?.estimated_offset ?? null)} Hz`, accent: "ai" },
              ]}
            />
          </Panel>
        </Section>
      </div>
    </div>
  );
}
