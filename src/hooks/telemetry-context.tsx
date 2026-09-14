import { createContext, useContext, type ReactNode } from "react";

import { useQuantumClockSocket, type QuantumClockSocket } from "./useQuantumClockSocket";

const TelemetryContext = createContext<QuantumClockSocket | null>(null);

/** Mounted once in the app shell so every page shares one socket. */
export function TelemetryProvider({ children }: { children: ReactNode }) {
  const socket = useQuantumClockSocket();
  return <TelemetryContext.Provider value={socket}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): QuantumClockSocket {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error("useTelemetry must be used inside <TelemetryProvider>");
  return context;
}
