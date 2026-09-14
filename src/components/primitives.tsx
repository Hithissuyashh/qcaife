import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-6">
      <div className="min-w-0">
        <h1 className="display text-[2.125rem] tracking-[-0.02em] sm:text-[2.5rem]">{title}</h1>
        {subtitle ? <p className="lede mt-2.5 max-w-2xl">{subtitle}</p> : null}
      </div>
      {meta ? <div className="flex items-center gap-6">{meta}</div> : null}
    </header>
  );
}

export function Section({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rise-in min-w-0", className)}>
      <div className="glass-hairline mb-3.5 flex items-baseline justify-between gap-4 pb-2">
        <h2 className="eyebrow text-ink/90">{title}</h2>
        {aside ? <div className="flex items-center gap-4">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  children,
  className,
  inset = true,
}: {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-tile transition-instrument rounded-lg hover:-translate-y-[1px] hover:border-signal/35 hover:shadow-[0_26px_54px_-26px_color-mix(in_oklab,black_92%,transparent)]",
        inset && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("label-telemetry block", className)}>{children}</span>;
}

const accentText = {
  neutral: "text-ink",
  signal: "text-signal",
  ai: "text-ai",
  ok: "text-ok",
  warn: "text-warn",
  fault: "text-fault",
  muted: "text-ink-faint",
} as const;

export type Accent = keyof typeof accentText;

/** Compact inline telemetry readout: label above, monospace value below. */
export function Readout({
  label,
  value,
  unit,
  note,
  accent = "neutral",
  size = "sm",
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
  accent?: Accent;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "text-[0.9375rem]",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-[2.875rem] leading-[1.03] tracking-[-0.025em]",
  } as const;

  return (
    <div className={cn("min-w-0", className)}>
      <Label>{label}</Label>
      <div
        className={cn(
          "num mt-1 truncate font-normal tabular-nums transition-colors duration-300",
          sizes[size],
          accentText[accent],
        )}
      >
        {value}
        {unit ? (
          <span className="ml-1.5 text-[0.6875rem] font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      {note ? (
        <div className="mt-1 text-[0.6875rem] text-ink-faint">{note}</div>
      ) : null}
    </div>
  );
}

export function StatusDot({ accent = "ok", pulse }: { accent?: Accent; pulse?: boolean }) {
  const bg = {
    neutral: "bg-foreground",
    signal: "bg-signal",
    ai: "bg-ai",
    ok: "bg-ok",
    warn: "bg-warn",
    fault: "bg-fault",
    muted: "bg-muted-foreground",
  }[accent];
  return (
    <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
      <span className={cn("h-1.5 w-1.5 rounded-full", bg)} />
      {pulse ? (
        <span
          className={cn("absolute inset-0 rounded-full opacity-40 animate-ping", bg)}
        />
      ) : null}
    </span>
  );
}

/** Tiny provenance tag, e.g. OFFLINE VALIDATION. */
export function Tag({
  children,
  accent = "muted",
}: {
  children: ReactNode;
  accent?: Accent;
}) {
  const ring = {
    neutral: "border-border text-foreground",
    signal: "border-signal/35 text-signal",
    ai: "border-ai/35 text-ai",
    ok: "border-ok/35 text-ok",
    warn: "border-warn/35 text-warn",
    fault: "border-fault/35 text-fault",
    muted: "border-border text-muted-foreground",
  }[accent];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[0.625rem] font-medium tracking-[0.09em] uppercase",
        ring,
      )}
    >
      {children}
    </span>
  );
}

export function KeyValue({
  rows,
  className,
}: {
  rows: Array<{ key: string; value: ReactNode; accent?: Accent }>;
  className?: string;
}) {
  return (
    <dl className={cn("divide-y divide-hairline", className)}>
      {rows.map((row) => (
        <div
          key={row.key}
          className="transition-instrument flex items-baseline justify-between gap-6 py-2 text-[0.8125rem] hover:bg-secondary/20"
        >
          <dt className="text-ink-soft">{row.key}</dt>
          <dd className={cn("num tabular-nums", accentText[row.accent ?? "neutral"])}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Awaiting({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex min-h-[7rem] flex-col items-start justify-center gap-1 rounded-md border border-dashed border-border/70 px-4 py-6">
      <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
      {hint ? <span className="text-[0.6875rem] text-muted-foreground/70">{hint}</span> : null}
    </div>
  );
}
