import type {
  AiSample,
  ClockSample,
  EnvironmentSample,
  NoiseSample,
  Num,
} from "@/types/telemetry";

type Raw = Record<string, unknown>;

/** Defensive numeric coercion: anything non-finite becomes null, never 0. */
export function num(value: unknown): Num {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function record(value: unknown): Raw {
  return value && typeof value === "object" ? (value as Raw) : {};
}

/** Read the first present key from a raw payload, coerced to a number|null. */
function field(source: Raw, ...keys: string[]): Num {
  for (const key of keys) {
    const parsed = num(source[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function parseEnvironment(raw: unknown): EnvironmentSample {
  const e = record(raw);
  return {
    time: field(e, "time"),
    dt: field(e, "dt"),
    temperature: field(e, "temperature"),
    magnetic: field(e, "magnetic"),
    laser_power: field(e, "laser_power"),
    pressure: field(e, "pressure"),
    humidity: field(e, "humidity"),
  };
}

function parseNoise(raw: unknown): NoiseSample {
  const n = record(raw);
  return {
    white: field(n, "white"),
    random_walk: field(n, "random_walk"),
    flicker: field(n, "flicker"),
    laser_phase: field(n, "laser_phase"),
    qpn: field(n, "qpn"),
    temperature: field(n, "temperature"),
    zeeman: field(n, "zeeman"),
    blackbody: field(n, "blackbody"),
    aging: field(n, "aging"),
    total: field(n, "total"),
  };
}

function bool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  return null;
}

/** AI block may be absent — return null rather than zeros, never synthesise. */
function parseAi(raw: unknown): AiSample | null {
  if (!raw || typeof raw !== "object") return null;
  const a = record(raw);
  const sample: AiSample = {
    prediction: field(a, "prediction", "ai_prediction"),
    extra_correction: field(a, "extra_correction", "ai_extra_correction", "correction"),
    gain: field(a, "gain", "ai_gain"),
    correction_limit: field(a, "correction_limit", "ai_correction_limit"),
    ready: bool(a["ready"] ?? a["ai_ready"]),
    history_length: field(a, "history_length", "history_len"),
    prediction_count: field(a, "prediction_count", "predictions"),
    required_history: field(a, "required_history", "sequence_length", "history_required"),
    uncertainty: field(a, "uncertainty", "uncertainty_raw"),
    uncertainty_calibrated: field(a, "uncertainty_calibrated", "calibrated_uncertainty"),
    interval_low: field(a, "interval_low", "ci_low"),
    interval_high: field(a, "interval_high", "ci_high"),
  };
  const hasAny = Object.values(sample).some((v) => v !== null);
  return hasAny ? sample : null;
}

export function parseClockSample(raw: unknown): ClockSample | null {
  const envelope = record(raw);
  const payload = record(envelope["data"] ?? envelope["telemetry"] ?? envelope);
  if (Object.keys(payload).length === 0) return null;

  return {
    time: field(payload, "time"),
    atomic_frequency: field(payload, "atomic_frequency"),
    true_detuning: field(payload, "true_detuning"),
    measured_frequency: field(payload, "measured_frequency"),
    measured_offset: field(payload, "measured_offset"),
    estimated_offset: field(payload, "estimated_offset"),
    servo_correction: field(payload, "servo_correction"),
    corrected_offset: field(payload, "corrected_offset"),
    fractional_frequency: field(payload, "fractional_frequency"),
    probe_offset: field(payload, "probe_offset"),
    interrogation_time: field(payload, "interrogation_time", "ramsey_time"),
    discriminator: field(payload, "discriminator", "discriminator_signal"),
    excitation_probability_plus: field(payload, "excitation_probability_plus", "p_plus"),
    excitation_probability_minus: field(
      payload,
      "excitation_probability_minus",
      "p_minus",
    ),
    environment: parseEnvironment(payload["environment"]),
    noise: parseNoise(payload["noise"]),
    ai: parseAi(payload["ai"]),
    receivedAt: Date.now(),
  };
}
