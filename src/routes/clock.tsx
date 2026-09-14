import { createFileRoute } from "@tanstack/react-router";

import { Legend, TelemetryChart, type Series } from "@/components/charts/chart-kit";
import { KeyValue, PageHeader, Panel, Readout, Section } from "@/components/primitives";
import { useTelemetry } from "@/hooks/telemetry-context";
import { eng, fixed } from "@/lib/format";
import { buildSeries, tickExp } from "@/lib/series";

export const Route = createFileRoute("/clock")({
  head: () => ({
    meta: [
      { title: "Clock — QuantumClockAI" },
      {
        name: "description",
        content:
          "Optical oscillator and servo loop detail: measured frequency, detuning, PI servo correction and fractional frequency stability of the clock digital twin.",
      },
      { property: "og:title", content: "Clock — QuantumClockAI" },
      {
        property: "og:description",
        content: "Optical oscillator, frequency discrimination and PI servo loop telemetry.",
      },
    ],
  }),
  component: ClockPage,
});

const LOOP_SERIES: Series[] = [
  { key: "measured_offset", label: "Measured", accent: "signal" },
  { key: "estimated_offset", label: "Estimated", accent: "ai" },
  { key: "servo_correction", label: "Servo", accent: "warn", dashed: true },
  { key: "corrected_offset", label: "Corrected", accent: "ok", emphasis: true },
];

function ClockPage() {
  const { latest, history } = useTelemetry();

  const loopData = buildSeries(history, {
    measured_offset: (s) => s.measured_offset,
    estimated_offset: (s) => s.estimated_offset,
    servo_correction: (s) => s.servo_correction,
    corrected_offset: (s) => s.corrected_offset,
  });

  const fractionalData = buildSeries(history, {
    fractional_frequency: (s) => s.fractional_frequency,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Optical oscillator & servo"
        subtitle="Frequency discrimination and PI control law acting on the cavity-stabilised probe laser."
      />

      <div className="grid grid-cols-2 gap-x-10 gap-y-6 border-b border-hairline pb-8 lg:grid-cols-5">
        <Readout
          label="Atomic frequency"
          value={fixed(latest?.atomic_frequency ?? null, 4)}
          unit="Hz"
        />
        <Readout
          label="Measured frequency"
          value={fixed(latest?.measured_frequency ?? null, 4)}
          unit="Hz"
          accent="signal"
        />
        <Readout label="True detuning" value={eng(latest?.true_detuning ?? null)} unit="Hz" accent="muted" />
        <Readout label="Servo correction" value={eng(latest?.servo_correction ?? null)} unit="Hz" />
        <Readout
          label="Corrected offset"
          value={eng(latest?.corrected_offset ?? null)}
          unit="Hz"
          accent="ok"
        />
      </div>

      <Section title="Loop signals" aside={<Legend series={LOOP_SERIES} />}>
        <TelemetryChart
          data={loopData}
          series={LOOP_SERIES}
          xKey="t"
          xLabel="t (s)"
          yLabel="Hz"
          height={320}
          formatY={tickExp}
        />
      </Section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_20rem]">
        <Section title="Fractional frequency Δf/f">
          <TelemetryChart
            data={fractionalData}
            series={[
              { key: "fractional_frequency", label: "Δf/f", accent: "neutral", emphasis: true },
            ]}
            xKey="t"
            xLabel="t (s)"
            yLabel="Δf/f"
            height={240}
            formatY={tickExp}
          />
        </Section>

        <Section title="Loop state">
          <Panel>
            <KeyValue
              rows={[
                { key: "Probe offset", value: `${eng(latest?.probe_offset ?? null)} Hz` },
                { key: "Interrogation time", value: `${fixed(latest?.interrogation_time ?? null, 4)} s` },
                { key: "Discriminator", value: eng(latest?.discriminator ?? null), accent: "signal" },
                { key: "Fractional freq.", value: eng(latest?.fractional_frequency ?? null, 3) },
                { key: "Simulation time", value: `${fixed(latest?.time ?? null, 1)} s` },
                { key: "Samples", value: String(history.length) },
              ]}
            />
          </Panel>
        </Section>
      </div>
    </div>
  );
}
