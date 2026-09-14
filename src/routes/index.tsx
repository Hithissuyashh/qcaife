import { createFileRoute, Link } from "@tanstack/react-router";

import { LiquidChrome } from "@/components/liquid-chrome";
import { BlochSphere3D } from "@/components/bloch-sphere-3d";
import { DepthText } from "@/components/depth-text";
import { PillNav } from "@/components/pill-nav";
import { SiteFooter } from "@/components/site-footer";
import { useTelemetry } from "@/hooks/telemetry-context";
import { eng } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuantumClockAI — AI-assisted optical atomic clock digital twin" },
      {
        name: "description",
        content:
          "A research instrument for optical atomic clocks: Ramsey spectroscopy, Kalman estimation, PI servo control and Transformer-assisted frequency prediction, streamed live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:title",
        content: "QuantumClockAI — AI-assisted optical atomic clock digital twin",
      },
      {
        property: "og:description",
        content:
          "Live optical clock telemetry, quantum interrogation and Transformer-assisted servo correction in one instrument interface.",
      },
    ],
  }),
  component: LandingPage,
});

const PILLARS = [
  {
    index: "01",
    title: "Quantum interrogation",
    body: "Ramsey excitation probabilities on both sides of resonance, with the discriminator formed exactly as the twin reports it.",
    to: "/quantum",
  },
  {
    index: "02",
    title: "Estimation & servo",
    body: "Kalman-estimated detuning drives a PI servo loop; measured, estimated and corrected offsets are traced side by side.",
    to: "/clock",
  },
  {
    index: "03",
    title: "Transformer assist",
    body: "A sequence model predicts residual drift and contributes a bounded extra correction once its history window is filled.",
    to: "/ai",
  },
  {
    index: "04",
    title: "Stability & noise",
    body: "Allan deviation, environmental coupling and noise decomposition for offline validation of the closed loop.",
    to: "/stability",
  },
] as const;

function LandingPage() {
  const { state, latest, history } = useTelemetry();
  const live = state === "open";

  return (
    <div data-scroll-root className="relative h-screen overflow-y-auto bg-background">
      {/* liquid chrome sheet */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <LiquidChrome className="h-full w-full opacity-[0.9]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/25 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent,var(--background)_78%)]" />
      </div>

      <div className="relative z-10">
        {/* top bar */}
        <header className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 pt-7">
          <div className="flex items-baseline gap-3">
            <span className="display text-[1.15rem] leading-none">QuantumClockAI</span>
            <span className="label-xs hidden sm:inline">Digital Twin</span>
          </div>
          <PillNav
            activeHref="/"
            items={[
              { label: "Home", to: "/" },
              { label: "Architecture", to: "/research" },
              { label: "Contact", to: "/contact" },
              { label: "Instrument", to: "/overview" },
            ]}
          />
        </header>

        {/* hero */}
        <section className="mx-auto max-w-[1180px] px-6 pb-20 pt-24 sm:pt-32">
          <span className="glass-tile inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.6875rem]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ok" : "bg-warn"}`}
              style={live ? { boxShadow: "0 0 8px var(--ok)" } : undefined}
            />
            <span className="label-xs">
              {live ? "Telemetry streaming" : "Awaiting telemetry link"}
            </span>
          </span>

          <div className="mt-7 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
            <h1 className="display w-full max-w-full text-[clamp(2rem,8.5vw,5.6rem)] leading-[1.04] md:max-w-[16ch]">
              <DepthText
                text="An optical clock,"
                layers={30}
                depth={2.4}
                faceColor="var(--ink)"
                depthColor="var(--signal)"
                tilt={7.5}
                smoothing={0.14}
                perspective={900}
                autoOrbit
                orbitSpeed={0.35}
              />
              <DepthText
                className="display-italic"
                text="observed in full."
                layers={30}
                depth={2.4}
                faceColor="var(--ink-soft)"
                depthColor="var(--ai)"
                tilt={7.5}
                smoothing={0.14}
                perspective={900}
                autoOrbit
                orbitSpeed={0.3}
              />
            </h1>
            <figure className="mx-auto shrink-0 md:mx-0 md:ml-auto md:self-center">
              <BlochSphere3D className="aspect-square h-auto w-[min(19rem,66vw)]" />
              <figcaption className="label-xs mt-1 text-center text-ink-faint">
                Ramsey state vector
              </figcaption>
            </figure>
          </div>

          <p className="lede mt-7 max-w-[54ch] text-ink-soft">
            QuantumClockAI is a research instrument for an AI-assisted optical atomic clock digital
            twin. Every number on screen arrives from the simulator — interrogation, estimation,
            servo and model correction, nothing inferred in the browser.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/overview"
              className="skeu-button rounded-full px-5 py-2.5 text-[0.875rem] text-ink transition-transform duration-200 active:translate-y-[0.5px]"
            >
              Enter the instrument
            </Link>
            <Link
              to="/research"
              className="rounded-full border border-hairline px-5 py-2.5 text-[0.875rem] text-ink-soft transition-colors duration-200 hover:border-border hover:text-ink"
            >
              Read the architecture
            </Link>
          </div>

          {/* live strip */}
          <dl className="glass-tile mt-16 grid grid-cols-2 gap-y-6 rounded-lg px-6 py-6 md:grid-cols-4">
            {[
              { k: "Corrected offset", v: `${eng(latest?.corrected_offset ?? null)} Hz` },
              { k: "Kalman estimate", v: `${eng(latest?.estimated_offset ?? null)} Hz` },
              { k: "Samples buffered", v: String(history.length) },
              { k: "Link", v: live ? "live" : state },
            ].map((row) => (
              <div key={row.k} className="px-1">
                <dt className="label-telemetry">{row.k}</dt>
                <dd className="num mt-2 text-[1.0625rem] text-ink">{row.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* pillars */}
        <section className="mx-auto max-w-[1180px] border-t border-hairline px-6 py-20">
          <h2 className="display text-[1.9rem]">Four instrument surfaces</h2>
          <p className="mt-3 max-w-[52ch] text-[0.9375rem] text-ink-faint">
            Each page is a dedicated view onto one stage of the closed loop.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {PILLARS.map((p) => (
              <Link
                key={p.index}
                to={p.to}
                className="glass-tile group rounded-lg px-6 py-7 transition-transform duration-300 hover:-translate-y-[3px]"
                style={{ transitionTimingFunction: "var(--ease-instrument)" }}
              >
                <div className="num text-[0.6875rem] text-ink-faint">{p.index}</div>
                <div className="display mt-3 text-[1.3rem]">{p.title}</div>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-faint">{p.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[0.75rem] text-ink-soft transition-colors group-hover:text-ink">
                  Open
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* closing */}
        <section className="mx-auto max-w-[1180px] border-t border-hairline px-6 py-24 text-center">
          <h2 className="display mx-auto max-w-[26ch] text-[clamp(1.9rem,4vw,3rem)]">
            Precision is a discipline of <span className="display-italic">observation</span>.
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              to="/overview"
              className="skeu-button rounded-full px-5 py-2.5 text-[0.875rem] text-ink transition-transform duration-200 active:translate-y-[0.5px]"
            >
              Enter the instrument
            </Link>
          </div>
          <div className="num mt-14 text-[0.6875rem] text-ink-faint">
            QuantumClockAI · optical atomic clock digital twin
          </div>
        </section>

        <div className="mx-auto max-w-[1180px] px-6 pb-10">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
