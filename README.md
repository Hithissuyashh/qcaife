# QuantumClockAI Frontend

> Real-Time Web Interface for the QuantumClockAI Digital Twin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-App-FF4154.svg)](https://tanstack.com/start)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vite.dev/)

The QuantumClockAI frontend is a standalone React/TanStack Start application for visualizing telemetry produced by the QuantumClockAI backend.

The frontend does not simulate, estimate, or fabricate clock telemetry. The backend remains the authoritative source of simulation state.

## Live Architecture

```text
┌──────────────────────────────┐
│            Vercel            │
│                              │
│   React / TanStack Start     │
│                              │
│  Visualization + Telemetry   │
└──────────────┬───────────────┘
               │
          HTTPS / WSS
               │
               ▼
┌──────────────────────────────┐
│            Render            │
│                              │
│       FastAPI Backend        │
│                              │
│    QuantumClockAI Engine     │
└──────────────────────────────┘
```

Production backend:

```text
https://quantumclockai.onrender.com
```

Production WebSocket:

```text
wss://quantumclockai.onrender.com/ws/clock
```

## Features

- Real-time clock telemetry
- Secure WebSocket streaming
- REST API integration
- Automatic reconnect handling
- Bounded client-side telemetry history
- Clock state visualization
- Quantum interrogation visualization
- Environment monitoring
- Noise monitoring
- AI telemetry
- Stability analysis
- Interactive charts
- 3D/WebGL components
- Responsive interface
- Modular route architecture
- Defensive telemetry parsing

## Tech Stack

| Technology | Role |
|---|---|
| React 19 | UI |
| TypeScript | Type safety |
| TanStack Start | Application framework |
| Vite | Build/development |
| Tailwind CSS 4 | Styling |
| React Three Fiber | 3D rendering |
| Three.js | WebGL |
| Recharts | Charts |
| React Router | Routing |
| Radix UI | UI primitives |
| Lucide | Icons |
| Sonner | Notifications |

## Backend Connection

Production endpoints are centralized in:

```text
src/services/api.ts
```

```ts
export const REST_BASE =
  "https://quantumclockai.onrender.com";

export const WS_URL =
  "wss://quantumclockai.onrender.com/ws/clock";
```

The frontend therefore uses:

```text
HTTPS → REST
WSS   → Real-time telemetry
```

No backend telemetry is generated locally by the frontend.

## WebSocket Data Flow

```text
QuantumClockAI Backend
        |
        | 1 Hz WebSocket telemetry
        v
useQuantumClockSocket
        |
        v
parseClockSample
        |
        v
React telemetry state
        |
        +----------+----------+
        |          |          |
        v          v          v
      Clock      Quantum      AI
       UI          UI         UI
        |          |          |
        +----------+----------+
                   |
                   v
             Visualizations
```

## WebSocket Hook

The primary real-time hook is:

```text
src/hooks/useQuantumClockSocket.ts
```

Responsibilities:

1. Connect to `WS_URL`.
2. Receive telemetry.
3. Parse incoming JSON.
4. Update the latest sample.
5. Maintain bounded history.
6. Track the last received message.
7. Track reconnect attempts.
8. Reconnect after connection failures.

The hook exposes:

```text
state
latest
history
lastMessageAt
attempts
url
reconnect
```

## Client-Side History

The frontend retains up to:

```text
400 samples
```

This keeps browser memory bounded during long-running sessions.

The backend independently retains up to 1000 samples for API history.

## Telemetry Parser

Telemetry parsing is centralized in:

```text
src/lib/telemetry.ts
```

Expected top-level fields include:

```text
time
atomic_frequency
true_detuning
measured_frequency
measured_offset
estimated_offset
servo_correction
corrected_offset
fractional_frequency
probe_offset
interrogation_time
discriminator
excitation_probability_plus
excitation_probability_minus
environment
noise
ai
```

The frontend also records:

```text
receivedAt
```

This is a client-side timestamp and is not part of the simulation state.

## AI Telemetry

The frontend supports:

```text
prediction
extra_correction
gain
correction_limit
ready
history_length
required_history
prediction_count
uncertainty
uncertainty_calibrated
interval_low
interval_high
```

The Transformer requires a 128-sample history:

```text
history_length < 128
        ↓
AI not ready

history_length >= 128
        ↓
AI ready
```

The current production model is point-prediction only, so the backend currently provides:

```text
uncertainty = null
uncertainty_calibrated = false
interval_low = null
interval_high = null
```

The frontend must represent unavailable telemetry as unavailable rather than fabricating values.

## Quantum Telemetry

Available quantum/interrogation fields include:

```text
probe_offset
interrogation_time
excitation_probability_plus
excitation_probability_minus
discriminator
```

If discriminator details are unavailable, the backend returns `null`.

## Routes

The application is organized into dedicated routes:

```text
/
├── /overview
├── /clock
├── /quantum
├── /environment
├── /noise
├── /ai
├── /stability
├── /research
└── /contact
```

The routes separate the major conceptual areas of the digital twin while sharing the same telemetry source.

## Project Structure

```text
qcaife/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── charts/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── public/
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE
└── README.md
```

## Local Development

Clone the repository:

```bash
git clone https://github.com/Hithissuyashh/qcaife.git
cd qcaife
```

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

The application uses the configured Vite/TanStack development server.

## Production Build

```bash
npm run build
```

Run the generated production application according to the project's TanStack Start deployment configuration.

## Deployment

The frontend is deployed independently from the backend.

```text
Vercel
  |
  | HTTPS / WSS
  v
Render
  |
  v
QuantumClockAI
```

This separation provides:

- Independent deployment
- Independent versioning
- Clean API boundaries
- Reduced coupling
- Easier frontend iteration
- Backend stability independent of UI changes

## Data Integrity

The frontend intentionally distinguishes between real telemetry and unavailable telemetry.

For example:

```text
Backend does not provide uncertainty
        |
        v
Show unavailable / future implementation
```

rather than generating a synthetic value.

This principle applies to:

- AI uncertainty
- Confidence intervals
- Discriminator telemetry
- Hardware telemetry
- Any future sensor values

## Development Notes

### Asset Resolution

The contact page uses the tracked asset:

```ts
import avatar from "@/assets/suyash.jpg";
```

The actual image is included in the repository.

### React Compatibility

The project uses:

```text
React 19.2.0
ReactDOM 19.2.0
```

This version was selected to remain compatible with the installed React Three Fiber dependency range.

## Backend API

The frontend consumes the following backend endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Service root |
| GET | `/health` | Health check |
| GET | `/status` | Simulation status |
| POST | `/step` | Diagnostic simulation step |
| GET | `/history` | Recent history |
| POST | `/reset` | Reset simulation |
| WS | `/ws/clock` | Real-time telemetry |

## Repository

GitHub:

```text
https://github.com/Hithissuyashh/qcaife
```

Backend:

```text
QuantumClockAI
```

## Design Principles

The frontend is designed as a scientific instrumentation interface rather than a generic dashboard.

The primary concerns are:

```text
Real-time telemetry
Scientific visualization
System transparency
Precise state representation
Technical readability
```

The browser is a visualization client. The backend remains the source of truth.

## Future Work

Potential future frontend improvements include:

- More advanced telemetry visualizations
- Improved scientific motion/background systems
- Refined typography
- Smooth route transitions
- Advanced 3D clock visualization
- Allan-deviation exploration
- Historical experiment comparison
- Telemetry export
- AI uncertainty visualization
- Full discriminator visualization
- Hardware telemetry integration

These features should use backend-provided data and should not introduce fabricated scientific telemetry.

## License

QuantumClockAI Frontend is released under the MIT License.

See [LICENSE](LICENSE).

## Author

**Suyash Vishwakarma**

QuantumClockAI frontend:

```text
Real-time telemetry
+
Scientific visualization
+
Interactive digital-twin interface
```
