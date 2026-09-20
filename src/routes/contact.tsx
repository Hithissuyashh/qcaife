import { createFileRoute, Link } from "@tanstack/react-router";

import { FaultyTerminal } from "@/components/faulty-terminal";
import avatar from "@/assets/suyash.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — QuantumClockAI Optical Clock Twin" },
      {
        name: "description",
        content:
          "Reach the QuantumClockAI research group for instrument access, telemetry integration questions or collaboration on optical clock control.",
      },
      { property: "og:title", content: "Contact — QuantumClockAI" },
      {
        property: "og:description",
        content:
          "Contact the QuantumClockAI group about instrument access, telemetry integration and collaboration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* terminal background — contact page only */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <FaultyTerminal
          className="h-full w-full"
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={1}
          pause={false}
          scanlineIntensity={1}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          curvature={0}
          tint="#ffffff"
          mouseReact
          mouseStrength={0.5}
          brightness={1}
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <Link
          to="/"
          className="label-xs transition-instrument w-fit text-ink-faint hover:text-ink"
        >
          ← BACK TO THE LAB
        </Link>

        <div className="mt-12 flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-12">
          <figure className="shrink-0">
            <img
              src={avatar}
              alt="Suyash Vishwakarma"
              width={200}
              height={200}
              className="h-[12.5rem] w-[12.5rem] rounded-md border border-hairline object-cover"
            />
            <figcaption className="label-xs mt-3 text-ink-faint">PRINCIPAL AUTHOR</figcaption>
          </figure>

          <div>
            <h1 className="display text-[clamp(2.6rem,6vw,4rem)] leading-[1.02]">
              Let’s talk<span className="text-signal">.</span>
            </h1>

            <p className="lede mt-5 max-w-[52ch] text-ink-soft">
              QuantumClockAI is designed and built by Suyash Vishwakarma. For collaboration,
              feedback, instrument access or anything numerical — email is the fastest way through.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="mailto:suyash.svish06@gmail.com"
                className="transition-instrument num rounded-md border border-signal/50 px-4 py-2.5 text-[0.8125rem] text-ink hover:border-signal hover:text-signal"
              >
                suyash.svish06@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/suyash-vishwakrma-445928356/"
                target="_blank"
                rel="noreferrer"
                className="transition-instrument num rounded-md border border-hairline px-4 py-2.5 text-[0.8125rem] text-ink-soft hover:border-border hover:text-ink"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-3 border-t border-hairline pt-5 text-[0.6875rem] text-ink-faint">
          <span>Suyash Vishwakarma</span>
          <span className="num">QuantumClockAI · optical clock digital twin</span>
        </div>
      </div>
    </div>
  );
}
