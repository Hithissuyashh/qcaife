import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useTelemetry } from "@/hooks/telemetry-context";

interface FieldState {
  live: number;
  aiReady: number;
  pulse: number;
  mx: number;
  my: number;
  tmx: number;
  tmy: number;
  scroll: number;
  /** eased scroll -> camera depth */
  depth: number;
  targetDepth: number;
  /** route-change impulse, decays to 0 */
  jolt: number;
  /** eased zoom around the camera centre */
  zoom: number;
}

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  life: number;
  span: number;
  hue: number;
  w: number;
}

const COUNT = 460;

/**
 * Flow-field drift: thousands of long, faint filament trails advected through a
 * smooth curl-noise velocity field, drawn onto a persistent buffer so the paths
 * accumulate like a long-exposure interferogram. Purely presentational.
 */
export function InstrumentField() {
  const { state, lastMessageAt, latest } = useTelemetry();
  const fieldRef = useRef<FieldState>({
    live: 0,
    aiReady: 0,
    pulse: 0,
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    scroll: 0,
    depth: 0,
    targetDepth: 0,
    jolt: 0,
    zoom: 1,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const live = state === "open" && lastMessageAt !== null;
  const aiReady = latest?.ai?.prediction !== null && latest?.ai?.prediction !== undefined;

  // page transitions give the camera a short forward push
  useEffect(() => {
    fieldRef.current.jolt = 1;
  }, [pathname]);

  useEffect(() => {
    fieldRef.current.live = live ? 1 : 0;
  }, [live]);
  useEffect(() => {
    fieldRef.current.aiReady = aiReady ? 1 : 0;
    if (aiReady) fieldRef.current.pulse = 1;
  }, [aiReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let disposed = false;
    let particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);
      seed();
    }

    function spawn(): Particle {
      return {
        x: -160 + Math.random() * (width + 320),
        y: -160 + Math.random() * (height + 320),
        px: 0,
        py: 0,
        life: 0,
        span: 220 + Math.random() * 520,
        hue: Math.random(),
        w: 0.4 + Math.random() * 0.9,
      };
    }

    function seed() {
      particles = Array.from({ length: COUNT }, () => {
        const p = spawn();
        p.px = p.x;
        p.py = p.y;
        p.life = Math.random() * p.span;
        return p;
      });
    }

    // smooth pseudo-noise potential -> curl gives a divergence-free flow
    function potential(x: number, y: number, t: number) {
      return (
        Math.sin(x * 0.0016 + t * 0.00021) * Math.cos(y * 0.0021 - t * 0.00017) * 1.0 +
        Math.sin((x + y) * 0.0011 - t * 0.00013) * 0.7 +
        Math.cos(x * 0.0033 - y * 0.0027 + t * 0.00009) * 0.35
      );
    }

    function velocity(x: number, y: number, t: number) {
      const e = 6;
      const dpdy = potential(x, y + e, t) - potential(x, y - e, t);
      const dpdx = potential(x + e, y, t) - potential(x - e, y, t);
      return { vx: dpdy * 26, vy: -dpdx * 26 };
    }

    function draw(t: number) {
      const f = fieldRef.current;
      f.mx += (f.tmx - f.mx) * 0.05;
      f.my += (f.tmy - f.my) * 0.05;
      if (f.pulse > 0) f.pulse = Math.max(0, f.pulse - 0.012);

      // ---- camera: scroll sets depth, route changes add a forward impulse ----
      f.targetDepth = f.scroll;
      f.depth += (f.targetDepth - f.depth) * 0.06;
      f.jolt *= 0.92;
      const targetZoom = 1 + f.depth * 0.55 + f.jolt * 0.16;
      f.zoom += (targetZoom - f.zoom) * 0.09;
      // barrel/pincushion depth distortion, strongest while travelling
      const distort = 0.16 * f.depth + 0.22 * f.jolt;
      const camX = width * (0.5 + f.mx * 0.12);
      const camY = height * (0.5 + f.my * 0.12) - f.depth * height * 0.06;
      const radiusRef = Math.hypot(width, height) * 0.5;

      /** world -> screen through the camera (zoom + radial depth distortion) */
      function project(x: number, y: number) {
        const dx = x - camX;
        const dy = y - camY;
        const r = Math.hypot(dx, dy) / radiusRef;
        const k = f.zoom * (1 + distort * r * r);
        return { x: camX + dx * k, y: camY + dy * k };
      }

      const energy = 0.6 + f.live * 0.3 + f.aiReady * 0.14;

      // fade the accumulated exposure instead of clearing -> long trails
      ctx!.globalCompositeOperation = "destination-out";
      ctx!.fillStyle = `rgba(0,0,0,${0.05 + f.pulse * 0.05 + f.jolt * 0.06})`;
      ctx!.fillRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";

      const attX = width * (0.5 + f.mx * 0.42);
      const attY = height * (0.5 + f.my * 0.42);

      for (const p of particles) {
        const { vx, vy } = velocity(p.x, p.y, t);
        // curl flow + soft swirl toward the cursor + scroll-driven vertical drift
        const dx = attX - p.x;
        const dy = attY - p.y;
        const d2 = dx * dx + dy * dy + 12000;
        const swirl = 26000 / d2;
        p.px = p.x;
        p.py = p.y;
        // depth also accelerates the flow so travel reads as forward motion
        const speed = 0.016 * energy * (1 + f.depth * 0.5 + f.jolt * 0.9);
        p.x += (vx + -dy * swirl) * speed;
        p.y += (vy + dx * swirl) * speed - f.depth * 0.9 - f.jolt * 2.2;
        p.life += 1;

        const pad = 240;
        if (
          p.life > p.span ||
          p.x < -pad ||
          p.x > width + pad ||
          p.y < -pad ||
          p.y > height + pad
        ) {
          const n = spawn();
          n.px = n.x;
          n.py = n.y;
          Object.assign(p, n);
          continue;
        }

        const a0 = project(p.px, p.py);
        const a1 = project(p.x, p.y);
        const fade = Math.sin((p.life / p.span) * Math.PI);
        const a = 0.16 * fade * energy * (1 - f.depth * 0.18);
        const violet = f.aiReady > 0.5 && p.hue > 0.72;
        ctx!.strokeStyle = violet
          ? `rgba(176,142,250,${a * (1 + f.pulse)})`
          : p.hue > 0.4
            ? `rgba(126,182,246,${a})`
            : `rgba(196,214,238,${a * 0.8})`;
        ctx!.lineWidth = p.w * f.zoom * (1 + f.pulse * 0.6);
        ctx!.beginPath();
        ctx!.moveTo(a0.x, a0.y);
        ctx!.lineTo(a1.x, a1.y);
        ctx!.stroke();
      }

      ctx!.globalCompositeOperation = "source-over";
    }

    function frame(t: number) {
      if (disposed) return;
      draw(t);
      raf = requestAnimationFrame(frame);
    }

    resize();
    if (reduced) draw(0);
    else raf = requestAnimationFrame(frame);

    const onResize = () => resize();
    const onPointer = (e: PointerEvent) => {
      const f = fieldRef.current;
      f.tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      f.tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      const el = document.querySelector("[data-scroll-root]") as HTMLElement | null;
      if (!el) return;
      fieldRef.current.scroll = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("scroll", onScroll, true);

    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 field-base" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-[0.9]" />
      <div className="absolute inset-0 field-illumination" />
      <div className="absolute inset-0 field-vignette" />
    </div>
  );
}
