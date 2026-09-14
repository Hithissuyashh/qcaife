/**
 * QuantumClockAI backend endpoints. The digital twin runs locally; nothing here
 * synthesises data — a failed request surfaces as an unavailable backend.
 */
export const REST_BASE = "http://127.0.0.1:8000";
export const WS_URL = "ws://127.0.0.1:8000/ws/clock";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${REST_BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function getHealth() {
  return request<unknown>("/health");
}

export function resetSimulation() {
  return request<unknown>("/reset", { method: "POST" });
}
