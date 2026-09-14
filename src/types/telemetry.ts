/**
 * Telemetry payload emitted by the QuantumClockAI digital twin over
 * ws://127.0.0.1:8000/ws/clock
 *
 * Every field is nullable on the client: the backend is authoritative and the
 * UI never fabricates a value that was not received.
 */

export type Num = number | null;

export interface EnvironmentSample {
  time: Num;
  dt: Num;
  temperature: Num;
  magnetic: Num;
  laser_power: Num;
  pressure: Num;
  humidity: Num;
}

export interface NoiseSample {
  white: Num;
  random_walk: Num;
  flicker: Num;
  laser_phase: Num;
  qpn: Num;
  temperature: Num;
  zeeman: Num;
  blackbody: Num;
  aging: Num;
  total: Num;
}

/** Optional — present only once a live Transformer controller is attached. */
export interface AiSample {
  prediction: Num;
  /** Backend-authored AI correction term. Never computed on the client. */
  extra_correction: Num;
  gain: Num;
  correction_limit: Num;
  ready: boolean | null;
  history_length: Num;
  prediction_count: Num;
  /** Target history depth, when the backend reports one (for "87 / 128"). */
  required_history: Num;
  /** Uncertainty telemetry — stays null until the backend validates it. */
  uncertainty: Num;
  uncertainty_calibrated: Num;
  interval_low: Num;
  interval_high: Num;
}

export interface ClockSample {
  time: Num;
  atomic_frequency: Num;
  true_detuning: Num;
  measured_frequency: Num;
  measured_offset: Num;
  estimated_offset: Num;
  servo_correction: Num;
  corrected_offset: Num;
  fractional_frequency: Num;
  probe_offset: Num;
  interrogation_time: Num;
  discriminator: Num;
  excitation_probability_plus: Num;
  excitation_probability_minus: Num;
  environment: EnvironmentSample;
  noise: NoiseSample;
  ai: AiSample | null;
  /** Wall-clock receipt time (ms) — client side, for staleness display. */
  receivedAt: number;
}

export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed";