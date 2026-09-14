import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Legend, TelemetryChart, type Series } from "@/components/charts/chart-kit";
import {
  KeyValue,
  PageHeader,
  Panel,
  Readout,
  Section,
  StatusDot,
} from "@/components/primitives";
import { useTelemetry } from "@/hooks/telemetry-context";
import { age, eng, fixed, sci } from "@/lib/format";
import { buildSeries, tickExp } from "@/lib/series";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview — QuantumClockAI Digital Twin" },
      {
        name: "description",
        content:
          "Live clock status for the QuantumClockAI optical atomic clock digital twin: corrected frequency offset, Kalman estimate, servo correction and Ramsey excitation probabilities.",
      },
      { property: "og:title", content: "Overview — QuantumClockAI Digital Twin" },
      {
        property: "og:description",
        content: "Real-time optical clock telemetry: offset, estimation, servo and Ramsey signals.",
      },
    ],
  }),
  component: OverviewPage,
});

const OFFSET_SERIES: Series[] = [
  { key: "true_detuning", label: "True detuning", accent: "muted", dashed: true },
  { key: "measured_offset", label: "Measured offset", accent: "signal" },
  { key: "estimated_offset", label: "Estimated offset", accent: "ai" },
  { key: "corrected_offset", label: "Corrected offset", accent: "ok", emphasis: true },
];

function OverviewPage() {
  const { latest, history, state, lastMessageAt } = useTelemetry();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const offsetData = buildSeries(history, {
    true_detuning: (s) => s.true_detuning,
    measured_offset: (s) => s.measured_offset,
    estimated_offset: (s) => s.estimated_offset,
    corrected_offset: (s) => s.corrected_offset,
  });

  const servoData = buildSeries(history, { servo_correction: (s) => s.servo_correction });
  const ramseyData = buildSeries(history, {
    excitation_probability_plus: (s) => s.excitation_probability_plus,
    excitation_probability_minus: (s) => s.excitation_probability_minus,
  });

  const locked = state === "open" && latest?.corrected_offset !== null;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Clock status"
        subtitle="Closed-loop state of the simulated optical atomic clock. All values are received from the digital twin; nothing on this page is synthesised."
        meta={
          <>
            <span className="flex items-center gap-2 text-[0.75rem]">
              <StatusDot accent={locked ? "ok" : "warn"} pulse={locked} />
              <span className="label-xs text-foreground/70">
                {locked ? "Servo locked" : "Awaiting lock"}
              </span>
            </span>
            <span className="num text-[0.6875rem] text-muted-foreground">
              updated {age(lastMessageAt, now)}
            </span>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-10 border-b border-hairline pb-9 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Readout
          label="Corrected frequency offset"
          value={sci(latest?.corrected_offset ?? null)}
          unit="Hz"
          size="xl"
          accent={locked ? "ok" : "muted"}
          note={<span className="num">{eng(latest?.corrected_offset ?? null)} Hz</span>}
        />
        <div className="grid grid-cols-2 gap-x-10 gap-y-6 xl:grid-cols-4">
          <Readout
            label="Kalman estimate"
            value={eng(latest?.estimated_offset ?? null)}
            unit="Hz"
            accent="ai"
          />
          <Readout
            label="Measured offset"
            value={eng(latest?.measured_offset ?? null)}
            unit="Hz"
            accent="signal"
          />
          <Readout
            label="Servo correction"
            value={eng(latest?.servo_correction ?? null)}
            unit="Hz"
          />
          <Readout
            label="Fractional frequency"
            value={eng(latest?.fractional_frequency ?? null, 3)}
            unit="Δf/f"
          />
        </div>
      </section>

      <Section
        title="Frequency offset"
        aside={<Legend series={OFFSET_SERIES} />}
      >
        <TelemetryChart
          data={offsetData}
          series={OFFSET_SERIES}
          xKey="t"
          xLabel="t (s)"
          yLabel="Hz"
          height={320}
          formatY={tickExp}
          empty="Awaiting telemetry from ws://127.0.0.1:8000/ws/clock"
        />
      </Section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        <Section title="Servo correction">
          <TelemetryChart
            data={servoData}
            series={[
              { key: "servo_correction", label: "Servo correction", accent: "neutral", emphasis: true },
            ]}
            xKey="t"
            xLabel="t (s)"
            yLabel="Hz"
            height={220}
            formatY={tickExp}
          />
        </Section>

        <Section
          title="Ramsey excitation probabilities"
          aside={
            <div className="flex gap-6 text-[0.75rem]">
              <span className="num text-signal">P(+) {fixed(latest?.excitation_probability_plus ?? null, 5)}</span>
              <span className="num text-ai">P(−) {fixed(latest?.excitation_probability_minus ?? null, 5)}</span>
            </div>
          }
        >
          <TelemetryChart
            data={ramseyData}
            series={[
              { key: "excitation_probability_plus", label: "P(+)", accent: "signal" },
              { key: "excitation_probability_minus", label: "P(−)", accent: "ai" },
            ]}
            xKey="t"
            xLabel="t (s)"
            yLabel="probability"
            height={220}
            formatY={(v) => v.toFixed(3)}
          />
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
        <Section title="Oscillator">
          <Panel>
            <KeyValue
              rows={[
                { key: "Atomic frequency", value: `${fixed(latest?.atomic_frequency ?? null, 3)} Hz` },
                { key: "Measured frequency", value: `${fixed(latest?.measured_frequency ?? null, 3)} Hz` },
                { key: "True detuning", value: `${eng(latest?.true_detuning ?? null)} Hz`, accent: "muted" },
              ]}
            />
          </Panel>
        </Section>
        <Section title="Interrogation">
          <Panel>
            <KeyValue
              rows={[
                { key: "Probe offset", value: `${eng(latest?.probe_offset ?? null)} Hz` },
                { key: "Interrogation time", value: `${fixed(latest?.interrogation_time ?? null, 4)} s` },
                { key: "Discriminator", value: eng(latest?.discriminator ?? null), accent: "signal" },
              ]}
            />
          </Panel>
        </Section>
        <Section title="Stream">
          <Panel>
            <KeyValue
              rows={[
                { key: "Samples buffered", value: String(history.length) },
                { key: "Simulation time", value: `${fixed(latest?.time ?? null, 1)} s` },
                {
                  key: "Connection",
                  value: state,
                  accent: state === "open" ? "ok" : "warn",
                },
              ]}
            />
          </Panel>
        </Section>
      </div>
    </div>
  );
}
