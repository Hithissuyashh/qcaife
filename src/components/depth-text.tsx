import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function DepthText({
  text,
  layers = 28,
  depth = 2.2,
  faceColor = "var(--ink)",
  depthColor = "var(--signal)",
  tilt = 7.5,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.35,
  className,
  style,
}: {
  text: string;
  layers?: number;
  depth?: number;
  faceColor?: string;
  depthColor?: string;
  tilt?: number;
  smoothing?: number;
  perspective?: number;
  autoOrbit?: boolean;
  orbitSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setScale(w < 480 ? 0.4 : w < 768 ? 0.6 : w < 1100 ? 0.8 : 1);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const t0 = performance.now();

    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const tl = tilt * scale;
      target.x = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1)) * tl;
      target.y = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2 || 1)) * tl;
    };

    const tick = (ms: number) => {
      cur.x += (target.x - cur.x) * smoothing;
      cur.y += (target.y - cur.y) * smoothing;
      const orbit = autoOrbit ? Math.sin(((ms - t0) / 1000) * orbitSpeed) * tilt * scale * 0.5 : 0;
      const node = innerRef.current;
      if (node) {
        node.style.transform = `rotateX(${-cur.y - orbit * 0.35}deg) rotateY(${cur.x + orbit}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [mounted, tilt, scale, smoothing, autoOrbit, orbitSpeed]);

  const activeLayers = Math.max(6, Math.round(layers * scale));
  const activeDepth = depth * scale;
  const stack = Array.from({ length: activeLayers });

  return (
    <div
      ref={wrapRef}
      className={cn("select-none", className)}
      style={{ perspective: `${perspective}px`, maxWidth: "100%", ...style }}
    >
      <div
        ref={innerRef}
        className="relative"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {stack.map((_, i) => {
          const k = i / Math.max(1, activeLayers - 1);
          const isFace = i === activeLayers - 1;
          return (
            <span
              key={i}
              aria-hidden={!isFace}
              className={cn(
                "block whitespace-pre-wrap",
                i === 0 ? "relative" : "absolute inset-0",
              )}
              style={{
                transform: `translateZ(${(k - 1) * activeDepth * activeLayers * 0.5}px)`,
                color: isFace ? faceColor : depthColor,
                opacity: isFace ? 1 : 0.06 + k * 0.16,
                filter: isFace ? undefined : `blur(${(1 - k) * 1.2}px)`,
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}