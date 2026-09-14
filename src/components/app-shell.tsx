import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { StatusDot } from "@/components/primitives";
import { InstrumentField } from "@/components/instrument-field";
import { SiteFooter } from "@/components/site-footer";
import { useTelemetry } from "@/hooks/telemetry-context";
import { age, seconds } from "@/lib/format";
import { cn } from "@/lib/utils";
import { REST_BASE, resetSimulation } from "@/services/api";
import type { ConnectionState } from "@/types/telemetry";

const NAV = [
  { to: "/overview", label: "Overview" },
  { to: "/clock", label: "Clock" },
  { to: "/quantum", label: "Quantum" },
  { to: "/environment", label: "Environment" },
  { to: "/noise", label: "Noise" },
  { to: "/ai", label: "AI" },
  { to: "/stability", label: "Stability" },
] as const;

const STATE_META: Record<ConnectionState, { text: string; accent: "ok" | "warn" | "fault" | "muted" }> = {
  idle: { text: "Idle", accent: "muted" },
  connecting: { text: "Connecting", accent: "warn" },
  open: { text: "Connected", accent: "ok" },
  reconnecting: { text: "Reconnecting", accent: "warn" },
  closed: { text: "Closed", accent: "fault" },
};

function useNow(intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, lastMessageAt } = useTelemetry();
  const meta = STATE_META[state];

  return (
    <aside className="neu-panel relative z-10 flex w-[13.5rem] shrink-0 flex-col border-r border-hairline backdrop-blur-[2px]">
      <div className="px-5 py-5">
        <Link
          to="/"
          className="display block text-[1.125rem] leading-none transition-colors duration-200 hover:text-signal"
        >
          QuantumClockAI
        </Link>
        <div className="label-xs mt-1.5">Digital Twin</div>
        <Link
          to="/"
          className="label-xs mt-2.5 inline-flex items-center gap-1 text-ink-faint transition-colors duration-200 hover:text-ink"
        >
          <span aria-hidden>←</span> back to home
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2.5">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "neu-press group relative flex h-8 items-center rounded-[4px] px-2.5 text-[0.8125rem]",
                active
                  ? "neu-pressed text-ink"
                  : "text-ink-faint hover:neu-raised hover:text-ink-soft",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-signal transition-all duration-[280ms]",
                  active ? "h-4 opacity-100" : "h-1 opacity-0 group-hover:h-2.5 group-hover:opacity-45",
                )}
                style={{ transitionTimingFunction: "var(--ease-instrument)" }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="neu-pressed m-2.5 space-y-2 rounded-md px-4 py-3.5 text-[0.6875rem]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Backend</span>
          <span className="flex items-center gap-1.5">
            <StatusDot accent={lastMessageAt ? "ok" : "fault"} />
            <span className="num text-muted-foreground">
              {lastMessageAt ? "reachable" : "unavailable"}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">WebSocket</span>
          <span className="flex items-center gap-1.5">
            <StatusDot accent={meta.accent} pulse={state === "open"} />
            <span className="num text-muted-foreground">{meta.text.toLowerCase()}</span>
          </span>
        </div>
        <div className="num pt-1 text-[0.625rem] leading-relaxed text-muted-foreground/60">
          {REST_BASE.replace("http://", "")}
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const { state, latest, lastMessageAt, reconnect } = useTelemetry();
  const now = useNow();
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(false);
  const meta = STATE_META[state];

  async function onReset() {
    setResetting(true);
    setResetError(false);
    try {
      await resetSimulation();
    } catch {
      setResetError(true);
    } finally {
      setResetting(false);
    }
  }

  return (
    <header className="skeu-bar relative z-10 flex h-12 shrink-0 items-center justify-between gap-6 border-b border-hairline px-6">
      <div className="flex items-baseline gap-3">
        <span className="display text-[1.0625rem] leading-none">QuantumClockAI</span>
        <span className="display-italic text-[0.8125rem]">Optical Clock / Digital Twin</span>
      </div>

      <div className="flex items-center gap-3 text-[0.6875rem]">
        <span className="skeu-slot flex items-center gap-1.5 px-2 py-1">
          <StatusDot accent={state === "open" ? "ok" : meta.accent} pulse={state === "open"} />
          <span
            className={cn(
              "label-xs",
              state === "open" ? "text-ok" : "text-muted-foreground",
            )}
          >
            {state === "open" ? "Live" : meta.text}
          </span>
        </span>

        <button
          type="button"
          onClick={reconnect}
          className="skeu-slot num px-2 py-1 text-ink-faint hover:text-ink"
          title="Reconnect WebSocket"
        >
          ws://127.0.0.1:8000/ws/clock
        </button>

        <span className="skeu-slot flex items-baseline gap-2 px-2 py-1">
          <span className="label-xs">Simulation</span>
          <span className="num text-foreground">
            {latest?.time !== null && latest?.time !== undefined
              ? `${seconds(latest.time)} s`
              : "—"}
          </span>
        </span>

        <span className="skeu-slot num px-2 py-1 text-muted-foreground/70">
          {lastMessageAt ? age(lastMessageAt, now) : "no data"}
        </span>

        <button
          type="button"
          onClick={onReset}
          disabled={resetting}
          className={cn(
            "skeu-button transition-instrument rounded-[5px] px-3 py-1 text-[0.6875rem] active:skeu-button-active active:translate-y-[0.5px]",
            resetting
              ? "text-muted-foreground/60"
              : "text-ink-soft hover:text-ink",
            resetError && "border-fault/40 text-fault",
          )}
        >
          {resetError ? "Reset failed" : resetting ? "Resetting" : "Reset"}
        </button>
      </div>
    </header>
  );
}

export function BackendUnavailable() {
  const { state, lastMessageAt } = useTelemetry();
  if (state === "open" && lastMessageAt) return null;
  return (
    <div className="relative z-10 flex items-center gap-3 border-b border-hairline bg-secondary/25 px-6 py-2 text-[0.75rem] backdrop-blur-[2px]">
      <StatusDot accent="warn" />
      <span className="text-muted-foreground">Backend unavailable</span>
      <span className="num text-muted-foreground/60">
        {lastMessageAt
          ? `last sample ${new Date(lastMessageAt).toLocaleTimeString("en-GB", { hour12: false })}`
          : "no telemetry received"}
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigating = useRouterState({ select: (s) => s.status === "pending" });
  const scrollRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  // the landing page is a full-bleed marketing surface, not an instrument view
  if (pathname === "/" || pathname === "/contact" || pathname === "/research") {
    return (
      <div key={pathname} className="page-enter-soft">
        {children}
      </div>
    );
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <InstrumentField />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="pointer-events-none relative z-20 h-[2px] overflow-hidden">
          <div
            suppressHydrationWarning
            className={cn("nav-beam absolute inset-0", navigating ? "opacity-100" : "opacity-0")}
          />
        </div>
        <BackendUnavailable />
        <main
          ref={scrollRef}
          onScroll={onScroll}
          data-scroll-root
          className="relative min-w-0 flex-1 overflow-y-auto [perspective:1400px]"
        >
          <div
            key={pathname}
            className="page-enter-3d page-stagger mx-auto max-w-[1600px] px-8 py-8 xl:px-12"
          >
            {children}
            <SiteFooter />
          </div>
          {/* scroll progress rail */}
          <div
            aria-hidden
            className="pointer-events-none sticky bottom-0 left-0 h-[2px] w-full bg-transparent"
          >
            <div
              className="scroll-rail h-full origin-left rounded-full transition-[width] duration-150 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
