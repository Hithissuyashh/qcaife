/**
 * OFFLINE VALIDATION RESULTS
 * Multi-seed validation of the Transformer-assisted servo. These are frozen
 * research artefacts and are never mixed with live telemetry.
 */

export const IMPROVEMENTS = [
  { metric: "RMS", mean: 27.7, sigma: 2.95 },
  { metric: "STD", mean: 26.98, sigma: 3.47 },
  { metric: "Maximum offset", mean: 25.57, sigma: 3.48 },
] as const;

export const FEATURE_IMPORTANCE = [
  { feature: "excitation_probability_minus", weight: 30.51, group: "quantum" },
  { feature: "measured_offset", weight: 20.05, group: "signal" },
  { feature: "estimated_offset", weight: 17.7, group: "signal" },
  { feature: "excitation_probability_plus", weight: 14.68, group: "quantum" },
  { feature: "pressure", weight: 11.32, group: "environment" },
  { feature: "magnetic", weight: 1.36, group: "environment" },
  { feature: "white", weight: 1.27, group: "noise" },
  { feature: "zeeman", weight: 1.24, group: "noise" },
  { feature: "flicker", weight: 0.68, group: "noise" },
  { feature: "total_noise", weight: 0.56, group: "noise" },
] as const;

export const UNCERTAINTY = {
  rawCoverage: 62.65,
  calibratedCoverage: 94.9,
  calibrationFactor: 4.852759,
  target: 95,
} as const;

export const FORECAST_RMSE = [
  { horizon: 1, rmse: 1.063134871125e-4 },
  { horizon: 5, rmse: 1.975204410044e-4 },
  { horizon: 10, rmse: 2.910518687792e-4 },
  { horizon: 30, rmse: 4.55767078758e-4 },
  { horizon: 60, rmse: 4.923933372861e-4 },
] as const;

/**
 * Allan deviation, offline validation run. Kalman-only baseline versus
 * Transformer-assisted servo; improvement grows with averaging time.
 */
export const ALLAN_DEVIATION = [
  { tau: 1, kalman: 8.42e-15, ai: 6.9e-15 },
  { tau: 2, kalman: 5.71e-15, ai: 4.55e-15 },
  { tau: 5, kalman: 3.44e-15, ai: 2.63e-15 },
  { tau: 10, kalman: 2.35e-15, ai: 1.73e-15 },
  { tau: 20, kalman: 1.61e-15, ai: 1.14e-15 },
  { tau: 50, kalman: 9.85e-16, ai: 6.62e-16 },
  { tau: 100, kalman: 6.94e-16, ai: 4.48e-16 },
  { tau: 200, kalman: 5.02e-16, ai: 3.1e-16 },
  { tau: 500, kalman: 3.36e-16, ai: 1.93e-16 },
  { tau: 1000, kalman: 2.61e-16, ai: 1.42e-16 },
] as const;

export const CONTROLLER_METRICS = [
  { metric: "RMS offset (Hz)", kalman: 6.0412e-4, ai: 4.3679e-4 },
  { metric: "STD offset (Hz)", kalman: 5.987e-4, ai: 4.3716e-4 },
  { metric: "Maximum offset (Hz)", kalman: 2.1043e-3, ai: 1.5662e-3 },
] as const;

export const PHYSICS_CHAIN = [
  { id: "LAB ENVIRONMENT", note: "temperature, magnetic field, pressure, humidity" },
  { id: "PHYSICAL NOISE", note: "white, flicker, random walk, laser phase, QPN" },
  { id: "OPTICAL OSCILLATOR", note: "cavity-stabilised probe laser" },
  { id: "ATOMIC REFERENCE", note: "unperturbed transition frequency" },
  { id: "RAMSEY INTERROGATION", note: "two-pulse sequence, free evolution time T" },
  { id: "FREQUENCY DISCRIMINATOR", note: "P(+) − P(−) error signal" },
  { id: "KALMAN ESTIMATOR", note: "state estimate of frequency offset" },
  { id: "TRANSFORMER", note: "sequence prediction + calibrated uncertainty" },
  { id: "SERVO", note: "PI control law" },
  { id: "OSCILLATOR CORRECTION", note: "applied frequency shift" },
] as const;

export const SERVICE_CHAIN = [
  { id: "FASTAPI", note: "REST control surface :8000" },
  { id: "WEBSOCKET", note: "/ws/clock telemetry stream" },
  { id: "DIGITAL TWIN", note: "simulation loop, fixed timestep" },
] as const;

/**
 * Full system architecture as authored in the project specification.
 * Presentation-only description of the pipeline — no computation happens here.
 */
export type FlowStage = {
  id: string;
  parts: readonly string[];
  kind: "stage" | "node" | "branch";
  accent?: "signal" | "ai" | "ok" | "warn";
  note?: string;
};

export const ARCHITECTURE_FLOW: readonly FlowStage[] = [
  { id: "LAB ENVIRONMENT", kind: "stage", parts: ["T", "B", "Laser power", "Pressure", "Humidity"] },
  {
    id: "NOISE ENGINE",
    kind: "stage",
    parts: ["White", "RW", "Flicker", "Laser", "QPN", "Physical shifts"],
  },
  {
    id: "OPTICAL CLOCK TWIN",
    kind: "stage",
    parts: ["Atomic reference", "Optical oscillator"],
    accent: "signal",
  },
  { id: "RAMSEY INTERROGATION", kind: "stage", parts: ["P(+)", "P(−)"], accent: "signal" },
  { id: "FREQUENCY DISCRIMINATOR", kind: "stage", parts: ["Error signal"], accent: "signal" },
  { id: "KALMAN FILTER", kind: "node", parts: [], accent: "signal" },
  {
    id: "BRANCH",
    kind: "branch",
    parts: ["STATE ESTIMATE", "HISTORY BUFFER → TRANSFORMER AI → PREDICTION"],
    accent: "ai",
  },
  {
    id: "AI-ASSISTED SERVO",
    kind: "stage",
    parts: ["Kalman estimate", "AI correction", "PI control"],
    accent: "ai",
  },
  {
    id: "OSCILLATOR CORRECTION",
    kind: "stage",
    parts: [],
    accent: "ok",
    note: "feedback → optical clock twin",
  },
  {
    id: "FASTAPI",
    kind: "stage",
    parts: ["/status", "/step", "/history", "/reset", "/ws/clock"],
  },
  { id: "JSON TELEMETRY", kind: "stage", parts: [] },
  {
    id: "REACT DASHBOARD",
    kind: "stage",
    parts: [
      "Overview",
      "Clock",
      "Quantum",
      "Environment",
      "Noise",
      "AI",
      "Stability",
      "Research",
    ],
  },
];
