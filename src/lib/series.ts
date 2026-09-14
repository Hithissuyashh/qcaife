import type { ClockSample, Num } from "@/types/telemetry";

export type Picks = Record<string, (sample: ClockSample) => Num>;

/** Shape rolling telemetry into recharts rows keyed on simulation time. */
export function buildSeries(
  history: ClockSample[],
  picks: Picks,
): Array<Record<string, number | null>> {
  return history.map((sample, index) => {
    const row: Record<string, number | null> = { t: sample.time ?? index };
    for (const key of Object.keys(picks)) {
      const pick = picks[key];
      row[key] = pick ? pick(sample) : null;
    }
    return row;
  });
}

export function sparkData(history: ClockSample[], get: (sample: ClockSample) => Num) {
  return history.map((sample, index) => ({ x: sample.time ?? index, y: get(sample) }));
}

/** Axis tick formatter for Hz-scale values. */
export const tickExp = (value: number) =>
  value === 0 ? "0" : value.toExponential(1).replace("e", "e");

export const tickPlain = (value: number) => value.toPrecision(4);
