import { useEffect, useRef } from "react";

type V3 = [number, number, number];

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
function rotX(v: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

/** Rotating 3D Bloch sphere: wireframe meridians/parallels + live state vector. */
export function BlochSphere3D({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let disposed = false;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - (r.left + r.width / 2)) / (r.width || 1);
      pointer.ty = (e.clientY - (r.top + r.height / 2)) / (r.height || 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const t0 = performance.now();

    const draw = (ms: number) => {
      if (disposed) return;
      const t = (ms - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;
      const yaw = 0.55 + t * 0.24 + pointer.x * 0.7;
      const pitch = -0.3 + pointer.y * 0.35;
      const focal = 3.2;

      const project = (v: V3) => {
        const a = rotX(rotY(v, yaw), pitch);
        const z = a[2];
        const k = focal / (focal - z);
        return { x: cx + a[0] * R * k, y: cy - a[1] * R * k, z, k };
      };

      ctx.clearRect(0, 0, w, h);

      // outer glow limb
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      g.addColorStop(0, "rgba(120,170,255,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const strokeArc = (pts: V3[]) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = project(pts[i]!);
          const b = project(pts[i + 1]!);
          const depth = (a.z + b.z) / 2;
          const front = depth > 0;
          ctx.strokeStyle = front
            ? `rgba(160,200,255,${0.16 + depth * 0.4})`
            : `rgba(150,180,230,${0.05 + (1 + depth) * 0.05})`;
          ctx.lineWidth = front ? 1 : 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      };

      const STEPS = 72;
      // parallels
      for (let j = 1; j < 8; j++) {
        const phi = (j / 8) * Math.PI;
        const y = Math.cos(phi);
        const r = Math.sin(phi);
        const pts: V3[] = [];
        for (let i = 0; i <= STEPS; i++) {
          const a = (i / STEPS) * Math.PI * 2;
          pts.push([r * Math.cos(a), y, r * Math.sin(a)]);
        }
        strokeArc(pts);
      }
      // meridians
      for (let j = 0; j < 8; j++) {
        const th = (j / 8) * Math.PI;
        const pts: V3[] = [];
        for (let i = 0; i <= STEPS; i++) {
          const a = (i / STEPS) * Math.PI * 2;
          pts.push([Math.sin(a) * Math.cos(th), Math.cos(a), Math.sin(a) * Math.sin(th)]);
        }
        strokeArc(pts);
      }

      // equator highlight
      const eq: V3[] = [];
      for (let i = 0; i <= STEPS; i++) {
        const a = (i / STEPS) * Math.PI * 2;
        eq.push([Math.cos(a), 0, Math.sin(a)]);
      }
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(110,170,255,0.55)";
      for (let i = 0; i < eq.length - 1; i++) {
        const a = project(eq[i]!);
        const b = project(eq[i + 1]!);
        ctx.strokeStyle = `rgba(130,190,255,${0.2 + Math.max(0, (a.z + b.z) / 2) * 0.55})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();

      // axes
      const axes: Array<{ v: V3; label: string }> = [
        { v: [1.18, 0, 0], label: "x" },
        { v: [0, 0, 1.18], label: "y" },
        { v: [0, 1.18, 0], label: "|0⟩" },
        { v: [0, -1.18, 0], label: "|1⟩" },
      ];
      ctx.font = "500 10px ui-monospace, monospace";
      for (const ax of axes) {
        const p = project(ax.v);
        const o = project([0, 0, 0]);
        ctx.strokeStyle = `rgba(190,210,240,${p.z > 0 ? 0.34 : 0.14})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(210,225,250,${p.z > 0 ? 0.7 : 0.3})`;
        ctx.fillText(ax.label, p.x + 4, p.y - 2);
      }

      // state vector: precessing Ramsey-like state
      const theta = Math.PI / 2 + Math.sin(t * 0.5) * 0.35;
      const phase = t * 1.15;
      const sv: V3 = [
        Math.sin(theta) * Math.cos(phase),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phase),
      ];
      const o = project([0, 0, 0]);
      const p = project(sv);

      // trace of precession
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const a = (i / STEPS) * Math.PI * 2;
        const q = project([
          Math.sin(theta) * Math.cos(a),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(a),
        ]);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      }
      ctx.strokeStyle = "rgba(180,140,255,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = "rgba(170,130,255,0.8)";
      ctx.strokeStyle = "rgba(205,175,255,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(225,205,255,1)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}