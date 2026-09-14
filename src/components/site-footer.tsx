import { Link } from "@tanstack/react-router";

import { StatusDot } from "@/components/primitives";
import { useMotionActive } from "@/hooks/use-motion-active";
import { useTelemetry } from "@/hooks/telemetry-context";
import { REST_BASE } from "@/services/api";

const LINKEDIN = "https://www.linkedin.com/in/suyash-vishwakrma-445928356/";
const EMAIL = "suyash.svish06@gmail.com";

const COLUMNS = [
  {
    title: "Instrument",
    links: [
      { to: "/overview", label: "Overview" },
      { to: "/clock", label: "Clock" },
      { to: "/quantum", label: "Quantum" },
      { to: "/environment", label: "Environment" },
    ],
  },
  {
    title: "Analysis",
    links: [
      { to: "/noise", label: "Noise" },
      { to: "/ai", label: "AI controller" },
      { to: "/stability", label: "Stability" },
      { to: "/research", label: "Architecture" },
    ],
  },
  {
    title: "Contact",
    links: [{ to: "/contact", label: "Contact the group" }],
  },
] as const;

function Waveform({ live }: { live: boolean }) {
  const motionActive = useMotionActive();
  const animate = live && motionActive;
  const bars = Array.from({ length: 48 }, (_, i) => {
    // rounded to 4 decimals so SSR and client markup match exactly
    const h = Math.round((18 + 46 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.19))) * 1e4) / 1e4;
    return { i, h };
  });
  return (
    <div aria-hidden className="flex h-10 items-end gap-[3px] overflow-hidden">
      {bars.map(({ i, h }) => (
        <span
          key={i}
          className={live ? (animate ? "footer-bar" : "footer-bar footer-bar-paused") : ""}
          style={{
            height: `${h}%`,
            width: "3px",
            borderRadius: "2px",
            background:
              i % 7 === 0
                ? "color-mix(in oklch, var(--ai) 70%, transparent)"
                : "color-mix(in oklch, var(--signal) 55%, transparent)",
            animationDelay: `${(i % 12) * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}


export function SiteFooter() {
  const { state, lastMessageAt } = useTelemetry();
  const linked = state === "open" && lastMessageAt !== null;

  return (
    <footer className="glass-tile relative mt-12 overflow-hidden rounded-lg px-6 py-8">
      {/* layered visuals */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(120% 140% at 8% 0%, color-mix(in oklch, var(--signal) 16%, transparent) 0%, transparent 55%), radial-gradient(90% 120% at 92% 110%, color-mix(in oklch, var(--ai) 14%, transparent) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, black 20%, transparent 80%)",
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-2 right-2 h-28 w-auto select-none opacity-[0.075] sm:h-40"
        viewBox="0 0 340 150"
        fill="none"
      >
        <text
          x="12"
          y="100"
          fontFamily="var(--font-display)"
          fontSize="104"
          fill="currentColor"
          className="text-ink"
        >
          QCAI
        </text>
        {/* pronounced Q tail to avoid O confusion */}
        <path
          d="M 76 104 C 84 124 98 138 124 144"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          className="text-signal"
          opacity="0.95"
        />
      </svg>

      <div className="relative grid gap-8 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <div className="min-w-0">
          <div className="display text-[1.35rem] leading-none">QuantumClockAI</div>
          <p className="lede mt-2.5 max-w-xs">
            An AI-assisted optical atomic clock digital twin: Ramsey spectroscopy, Kalman
            estimation and Transformer-assisted frequency prediction, streamed live.
          </p>

          <div className="mt-4 max-w-[16rem]">
            <Waveform live={linked} />
          </div>

          <div
            className="mt-3 flex items-center gap-2 text-[0.6875rem]"
            role="status"
            aria-live="polite"
          >
            <StatusDot accent={linked ? "ok" : "warn"} pulse={linked} />
            <span className="label-telemetry">
              {linked ? "telemetry linked" : "telemetry idle"}
            </span>
            <span className="num text-ink-faint/70">{REST_BASE.replace("http://", "")}</span>
          </div>

          <nav aria-label="Social and contact links" className="mt-5">
            <ul className="flex list-none flex-wrap items-center gap-2 p-0">
              <li>
                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="LinkedIn profile of Suyash Vishwakarma (opens in a new tab)"
                  className="transition-instrument num inline-flex min-h-9 items-center rounded-full border border-hairline px-3 py-1.5 text-[0.6875rem] text-ink-soft hover:border-signal/60 hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  LinkedIn
                  <span aria-hidden className="ml-1">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  aria-label={`Email the research group at ${EMAIL}`}
                  className="transition-instrument num inline-flex min-h-9 items-center rounded-full border border-hairline px-3 py-1.5 text-[0.6875rem] text-ink-soft hover:border-signal/60 hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  Email
                  <span aria-hidden className="ml-1">
                    ↗
                  </span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={`${col.title} links`} className="min-w-0">
            <h2 className="eyebrow">{col.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="transition-instrument group inline-flex items-center gap-1.5 rounded-sm text-[0.8125rem] text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                  >
                    <span
                      aria-hidden
                      className="h-px w-0 bg-signal transition-all duration-300 group-hover:w-3"
                    />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

      </div>

      <div className="glass-hairline relative mt-7 mb-4" />
      <div className="relative flex flex-wrap items-center justify-between gap-3 text-[0.6875rem] text-ink-faint">
        <span className="num">
          QuantumClockAI — research instrument interface. Simulated telemetry only.
        </span>
        <span className="num">ws://127.0.0.1:8000/ws/clock</span>
      </div>
    </footer>
  );
}
