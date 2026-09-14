import { createFileRoute, Link } from "@tanstack/react-router";

import { KeyValue, Label, PageHeader, Panel, Section, Tag } from "@/components/primitives";
import { SiteFooter } from "@/components/site-footer";
import { pct } from "@/lib/format";
import {
  ARCHITECTURE_FLOW,
  IMPROVEMENTS,
  PHYSICS_CHAIN,
  SERVICE_CHAIN,
  UNCERTAINTY,
} from "@/lib/research";
import type { FlowStage } from "@/lib/research";
import { REST_BASE, WS_URL } from "@/services/api";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Architecture & Research — QuantumClockAI" },
      {
        name: "description",
        content:
          "System architecture of the QuantumClockAI digital twin, from lab environment and physical noise through Ramsey interrogation, Kalman estimation, Transformer and servo.",
      },
      { property: "og:title", content: "Architecture & Research — QuantumClockAI" },
      {
        property: "og:description",
        content: "Signal chain, service topology and validated research results.",
      },
    ],
  }),
  component: ResearchPage,
});

function Chain({
  items,
  accentFrom,
}: {
  items: ReadonlyArray<{ id: string; note: string }>;
  accentFrom?: number;
}) {
  return (
    <ol className="overflow-hidden rounded-md border border-hairline">
      {items.map((item, index) => {
        const highlighted = accentFrom !== undefined && index >= accentFrom;
        return (
          <li
            key={item.id}
            className="grid grid-cols-[2.5rem_minmax(0,16rem)_1fr] items-center gap-4 border-b border-hairline px-5 py-3 last:border-b-0 transition-colors hover:bg-secondary/20"
          >
            <span className="num text-[0.6875rem] text-muted-foreground/50">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={`label-xs ${highlighted ? "text-ai" : "text-foreground"}`}
            >
              {item.id}
            </span>
            <span className="num text-[0.6875rem] text-muted-foreground">{item.note}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ResearchPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 12% -10%, color-mix(in oklch, var(--signal) 12%, transparent) 0%, transparent 60%), radial-gradient(80% 70% at 95% 8%, color-mix(in oklch, var(--ai) 12%, transparent) 0%, transparent 62%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(120% 80% at 50% 0%, black 10%, transparent 85%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 xl:px-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="label-xs transition-instrument text-ink-faint hover:text-ink"
          >
            ← BACK TO HOME
          </Link>
          <Link
            to="/overview"
            className="label-xs transition-instrument num rounded-full border border-hairline px-3 py-1.5 text-ink-soft hover:border-signal/60 hover:text-signal"
          >
            open instrument ↗
          </Link>
        </div>

        <ResearchBody />
        <SiteFooter />
      </div>
    </div>
  );
}

const accentRing = {
  signal: "border-signal/35",
  ai: "border-ai/40",
  ok: "border-ok/35",
  warn: "border-warn/35",
} as const;

function Connector({ label }: { label?: string | undefined }) {
  return (
    <div className="flex flex-col items-center gap-1 py-1.5" aria-hidden>
      <span className="h-5 w-px bg-gradient-to-b from-hairline via-signal/40 to-hairline" />
      {label ? (
        <span className="label-xs text-[0.5625rem] text-ink-faint">{label}</span>
      ) : null}
      <span className="text-[0.625rem] text-signal/70">▼</span>
    </div>
  );
}

function FlowDiagram({ stages }: { stages: readonly FlowStage[] }) {
  return (
    <div className="mx-auto max-w-3xl">
      {stages.map((stage, i) => (
        <div key={stage.id + i}>
          {i > 0 ? <Connector label={stages[i - 1]?.note ? "FEEDBACK" : undefined} /> : null}

          {stage.kind === "branch" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Panel className="text-center">
                <span className="label-telemetry">Left path</span>
                <div className="num mt-1.5 text-[0.8125rem] text-ink">STATE ESTIMATE</div>
              </Panel>
              <Panel className={`text-center ${accentRing.ai}`}>
                <span className="label-telemetry">Right path</span>
                <div className="num mt-1.5 space-y-1 text-[0.8125rem] text-ai">
                  <div>HISTORY BUFFER</div>
                  <div className="text-ink-faint">▼</div>
                  <div>TRANSFORMER AI</div>
                  <div className="text-ink-faint">▼</div>
                  <div>PREDICTION</div>
                </div>
              </Panel>
            </div>
          ) : (
            <Panel
              className={`${stage.accent ? accentRing[stage.accent] : ""} ${
                stage.kind === "node" ? "mx-auto max-w-xs text-center" : ""
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <span className="num text-[0.8125rem] tracking-[0.14em] text-ink">
                  {stage.id}
                </span>
                {stage.parts.length ? (
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] text-ink-faint">
                    {stage.parts.map((p) => (
                      <span key={p} className="num">
                        {p}
                      </span>
                    ))}
                  </span>
                ) : null}
              </div>
            </Panel>
          )}
        </div>
      ))}
    </div>
  );
}

function ResearchBody() {
  return (
    <div className="space-y-12">
      <PageHeader
        title="Architecture & research record"
        subtitle="Signal chain of the digital twin, service topology, and the validated offline results underpinning the AI-assisted controller."
      />

      <Section title="System architecture" aside={<Tag accent="signal">End to end</Tag>}>
        <FlowDiagram stages={ARCHITECTURE_FLOW} />
      </Section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_22rem]">
        <Section title="Physical & control signal chain">
          <Chain items={PHYSICS_CHAIN} accentFrom={7} />
        </Section>

        <div className="space-y-10">
          <Section title="Service topology">
            <Chain items={SERVICE_CHAIN} />
          </Section>

          <Section title="Interfaces">
            <Panel>
              <KeyValue
                rows={[
                  { key: "REST", value: REST_BASE.replace("http://", "") },
                  { key: "WebSocket", value: WS_URL.replace("ws://", "") },
                  { key: "Buffer", value: "400 samples (rolling)" },
                  { key: "Transport", value: "JSON frames, fixed timestep" },
                ]}
              />
            </Panel>
          </Section>
        </div>
      </div>

      <Section title="Validated results" aside={<Tag accent="warn">Offline validation</Tag>}>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-hairline bg-hairline md:grid-cols-2 xl:grid-cols-4">
          {IMPROVEMENTS.map((item) => (
            <div key={item.metric} className="bg-card/50 p-5">
              <Label>{item.metric}</Label>
              <div className="num mt-2 text-2xl text-ok">{item.mean.toFixed(2)}%</div>
              <div className="num mt-1 text-[0.6875rem] text-muted-foreground">
                ± {item.sigma.toFixed(2)}%
              </div>
            </div>
          ))}
          <div className="bg-card/50 p-5">
            <Label>Calibrated coverage</Label>
            <div className="num mt-2 text-2xl text-ai">
              {pct(UNCERTAINTY.calibratedCoverage)}
            </div>
            <div className="num mt-1 text-[0.6875rem] text-muted-foreground">
              raw {pct(UNCERTAINTY.rawCoverage)} · target {pct(UNCERTAINTY.target, 0)}
            </div>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[0.8125rem] leading-relaxed text-muted-foreground">
          Improvements are reported as mean ± standard deviation across independent
          seeds of the simulation. Live telemetry on the other pages is unrelated to
          these runs and is never averaged into them.
        </p>
      </Section>
    </div>
  );
}
