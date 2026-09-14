import { createFileRoute } from "@tanstack/react-router";

import { TelemetryChart } from "@/components/charts/chart-kit";
import {
  Awaiting,
  KeyValue,
  Label,
  PageHeader,
  Panel,
  Readout,
  Section,
  Tag,
} from "@/components/primitives";
import { useTelemetry } from "@/hooks/telemetry-context";
import { eng, pct } from "@/lib/format";
import { FORECAST_RMSE, UNCERTAINTY } from "@/lib/research";
import { buildSeries, tickExp } from "@/lib/series";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Controller — QuantumClockAI" },
      {
        name: "description",
        content:
          "Transformer-assisted clock controller: sequence prediction, calibrated uncertainty, 95% intervals and AI correction alongside the Kalman estimate.",
      },
      { property: "og:title", content: "AI Controller — QuantumClockAI" },
      {
        property: "og:description",
        content: "Transformer prediction, calibrated uncertainty and AI-assisted servo correction.",
      },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const { latest, history } = useTelemetry();
  const ai = latest?.ai ?? null;
  const warming = ai !== null && ai.prediction === null;
  const readyText = ai?.ready === true ? "READY" : warming || ai?.ready === false ? "WARMING UP" : "—";
  const samplesText =
    ai && ai.history_length !== null
      ? ai.required_history !== null
        ? `${ai.history_length} / ${ai.required_history} samples`
        : `${ai.history_length} samples`
      : "—";

  const predictionData = buildSeries(history, {
    estimated_offset: (s) => s.estimated_offset,
    ai_prediction: (s) => s.ai?.prediction ?? null,
    corrected_offset: (s) => s.corrected_offset,
  });

  const forecastData = FORECAST_RMSE.map((point) => ({
    t: point.horizon,
    rmse: point.rmse,
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        title="AI controller"
        subtitle="Transformer sequence model predicting the next-step frequency offset with a calibrated uncertainty estimate, feeding the servo alongside the Kalman state estimate."
        meta={<Tag accent={ai ? "ai" : "muted"}>{ai ? "Live AI telemetry" : "Awaiting AI telemetry"}</Tag>}
      />

      <section className="grid grid-cols-1 gap-10 border-b border-hairline pb-9 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div>
          <Label>Transformer prediction</Label>
          {ai && ai.prediction !== null ? (
            <div className="num mt-1 text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-ai">
              {eng(ai.prediction)}
              <span className="ml-2 text-[0.6875rem] text-muted-foreground">Hz</span>
            </div>
          ) : ai ? (
            <div className="mt-2">
              <Label>AI status</Label>
              <div className="num mt-1 text-[1.5rem] leading-[1.1] tracking-[-0.01em] text-muted-foreground">
                {readyText}
              </div>
              <div className="num mt-1 text-[0.75rem] text-muted-foreground/70">{samplesText}</div>
            </div>
          ) : (
            <div className="mt-2">
              <Awaiting
                label="Awaiting AI telemetry"
                hint="No ai block present in the current /ws/clock payload."
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-6 xl:grid-cols-3">
          <Readout
            label="Raw uncertainty"
            value={eng(ai?.uncertainty ?? null)}
            unit="Hz"
            accent="muted"
          />
          <Readout
            label="Calibrated uncertainty"
            value={eng(ai?.uncertainty_calibrated ?? null)}
            unit="Hz"
            accent="ai"
          />
          <Readout
            label="95% interval"
            value={
              ai && ai.interval_low !== null && ai.interval_high !== null
                ? `${eng(ai.interval_low, 3)} … ${eng(ai.interval_high, 3)}`
                : "—"
            }
            unit="Hz"
          />
          <Readout
            label="AI correction"
            value={eng(ai?.extra_correction ?? null)}
            unit="Hz"
            accent="ai"
          />
          <Readout
            label="Kalman estimate"
            value={eng(latest?.estimated_offset ?? null)}
            unit="Hz"
          />
          <Readout
            label="Corrected offset"
            value={eng(latest?.corrected_offset ?? null)}
            unit="Hz"
            accent="ok"
          />
          <Readout label="AI readiness" value={readyText} accent="muted" />
          <Readout
            label="History length"
            value={ai?.history_length !== null && ai ? String(ai.history_length) : "—"}
            accent="muted"
          />
          <Readout
            label="Prediction count"
            value={ai?.prediction_count !== null && ai ? String(ai.prediction_count) : "—"}
            accent="muted"
          />
        </div>
      </section>

      <Section
        title="Prediction vs estimation"
        aside={
          <span className="text-[0.6875rem] text-muted-foreground">
            AI trace appears once the backend emits an <span className="num">ai</span> block
          </span>
        }
      >
        <TelemetryChart
          data={predictionData}
          series={[
            { key: "estimated_offset", label: "Kalman estimate", accent: "signal" },
            { key: "ai_prediction", label: "Transformer prediction", accent: "ai", emphasis: true },
            { key: "corrected_offset", label: "Corrected offset", accent: "ok", dashed: true },
          ]}
          xKey="t"
          xLabel="t (s)"
          yLabel="Hz"
          height={300}
          formatY={tickExp}
        />
      </Section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        <Section
          title="Prediction uncertainty"
          aside={<Tag accent="warn">Offline validation</Tag>}
        >
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline">
            <div className="bg-card/50 p-5">
              <Label>Raw uncertainty</Label>
              <div className="num mt-2 text-3xl text-muted-foreground">
                {pct(UNCERTAINTY.rawCoverage)}
              </div>
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground/70">
                Empirical coverage of the uncalibrated 95% interval — severely
                over-confident.
              </p>
            </div>
            <div className="bg-card/50 p-5">
              <Label>Calibrated uncertainty</Label>
              <div className="num mt-2 text-3xl text-ai">
                {pct(UNCERTAINTY.calibratedCoverage)}
              </div>
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground/70">
                After scaling by the calibration factor, coverage matches the{" "}
                {UNCERTAINTY.target}% target.
              </p>
            </div>
          </div>
          <Panel className="mt-4">
            <KeyValue
              rows={[
                { key: "Calibration factor", value: UNCERTAINTY.calibrationFactor.toFixed(6), accent: "ai" },
                { key: "Target coverage", value: pct(UNCERTAINTY.target, 0) },
                {
                  key: "Coverage gap closed",
                  value: pct(UNCERTAINTY.calibratedCoverage - UNCERTAINTY.rawCoverage),
                  accent: "ok",
                },
              ]}
            />
          </Panel>
        </Section>

        <Section
          title="Multi-step forecast — horizon vs RMSE"
          aside={<Tag accent="warn">Offline validation</Tag>}
        >
          <TelemetryChart
            data={forecastData}
            series={[{ key: "rmse", label: "RMSE", accent: "ai", emphasis: true }]}
            xKey="t"
            xLabel="horizon (s)"
            yLabel="Hz"
            height={240}
            formatY={tickExp}
            formatX={(v) => `${v}`}
          />
          <div className="mt-4 divide-y divide-hairline border-y border-hairline">
            {FORECAST_RMSE.map((point) => (
              <div
                key={point.horizon}
                className="flex items-baseline justify-between py-2 text-[0.8125rem]"
              >
                <span className="num text-muted-foreground">{point.horizon} s</span>
                <span className="num tabular-nums text-foreground">
                  {point.rmse.toExponential(12)} Hz
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
