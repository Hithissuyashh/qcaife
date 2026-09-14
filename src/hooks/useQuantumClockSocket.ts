import { useCallback, useEffect, useRef, useState } from "react";

import { parseClockSample } from "@/lib/telemetry";
import { WS_URL } from "@/services/api";
import type { ClockSample, ConnectionState } from "@/types/telemetry";

const MAX_SAMPLES = 400;
const RECONNECT_BASE_MS = 800;
const RECONNECT_MAX_MS = 8000;

export interface QuantumClockSocket {
  state: ConnectionState;
  latest: ClockSample | null;
  history: ClockSample[];
  lastMessageAt: number | null;
  attempts: number;
  url: string;
  reconnect: () => void;
}

/**
 * Single-owner WebSocket to the digital twin.
 * Auto-connects, auto-reconnects with backoff, keeps a bounded rolling buffer
 * and never opens a duplicate socket.
 */
export function useQuantumClockSocket(): QuantumClockSocket {
  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const disposedRef = useRef(false);

  const [state, setState] = useState<ConnectionState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [latest, setLatest] = useState<ClockSample | null>(null);
  const [history, setHistory] = useState<ClockSample[]>([]);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  const connect = useCallback(() => {
    if (disposedRef.current) return;
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;

    const existing = socketRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setState(attemptsRef.current === 0 ? "connecting" : "reconnecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(WS_URL);
    } catch {
      scheduleReconnect();
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      if (disposedRef.current) return;
      attemptsRef.current = 0;
      setAttempts(0);
      setState("open");
    };

    socket.onmessage = (event) => {
      if (disposedRef.current || typeof event.data !== "string") return;
      let decoded: unknown;
      try {
        decoded = JSON.parse(event.data);
      } catch {
        return;
      }
      const sample = parseClockSample(decoded);
      if (!sample) return;
      setLatest(sample);
      setLastMessageAt(sample.receivedAt);
      setHistory((prev) => {
        const next = prev.length >= MAX_SAMPLES ? prev.slice(prev.length - MAX_SAMPLES + 1) : prev.slice();
        next.push(sample);
        return next;
      });
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      if (disposedRef.current) return;
      socketRef.current = null;
      scheduleReconnect();
    };

    function scheduleReconnect() {
      if (disposedRef.current) return;
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      setState("reconnecting");
      const delay = Math.min(
        RECONNECT_MAX_MS,
        RECONNECT_BASE_MS * 2 ** Math.min(attemptsRef.current - 1, 4),
      );
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(connect, delay);
    }
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    connect();
    return () => {
      disposedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close(1000, "client navigating away");
      }
      setState("closed");
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) socket.close();
    attemptsRef.current = 0;
    setAttempts(0);
    connect();
  }, [connect]);

  return { state, latest, history, lastMessageAt, attempts, url: WS_URL, reconnect };
}
