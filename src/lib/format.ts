import type { Num } from "@/types/telemetry";

export const EM_DASH = "—";

const SUPERSCRIPT: Record<string, string> = {
  "0": "\u2070",
  "1": "\u00b9",
  "2": "\u00b2",
  "3": "\u00b3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
  "-": "\u207b",
  "+": "\u207a",
};

function superscript(input: string): string {
  return input
    .split("")
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join("");
}

/** e.g. +4.39 × 10⁻⁴ */
export function sci(value: Num, digits = 2): string {
  if (value === null) return EM_DASH;
  if (value === 0) return "0";
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / 10 ** exponent;
  const sign = value > 0 ? "+" : "\u2212";
  return `${sign}${Math.abs(mantissa).toFixed(digits)} \u00d7 10${superscript(String(exponent))}`;
}

/** e.g. +4.3947e-04 */
export function eng(value: Num, digits = 4): string {
  if (value === null) return EM_DASH;
  const s = Math.abs(value).toExponential(digits);
  return `${value < 0 ? "\u2212" : "+"}${s}`;
}

export function fixed(value: Num, digits = 3): string {
  if (value === null) return EM_DASH;
  return value.toFixed(digits);
}

export function pct(value: Num, digits = 2): string {
  if (value === null) return EM_DASH;
  return `${value.toFixed(digits)}%`;
}

export function seconds(value: Num): string {
  if (value === null) return EM_DASH;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function age(receivedAt: number | null, now: number): string {
  if (receivedAt === null) return EM_DASH;
  const s = Math.max(0, (now - receivedAt) / 1000);
  if (s < 60) return `${s.toFixed(1)} s ago`;
  const m = Math.floor(s / 60);
  return `${m} min ago`;
}

export function clockTime(receivedAt: number | null): string {
  if (receivedAt === null) return EM_DASH;
  return new Date(receivedAt).toLocaleTimeString("en-GB", { hour12: false });
}
