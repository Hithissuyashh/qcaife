import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

/** Faulty CRT terminal: falling digit grid with scanlines, glitch, flicker and noise. */
const FRAG = `
precision highp float;
uniform vec2  res;
uniform float t;
uniform vec2  mouse;
uniform float scale;
uniform vec2  gridMul;
uniform float digitSize;
uniform float scanlineIntensity;
uniform float glitchAmount;
uniform float flickerAmount;
uniform float noiseAmp;
uniform float chromaticAberration;
uniform float curvature;
uniform float brightness;
uniform float mouseStrength;
uniform vec3  tint;

float hash21(vec2 p){
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 3x5 pseudo digit built from a bit lookup on a cell hash
float digit(vec2 uv, float seed){
  uv = clamp(uv, 0.0, 1.0);
  vec2 g = floor(uv * vec2(3.0, 5.0));
  float bit = hash21(vec2(seed * 13.0 + g.x, seed * 7.0 + g.y));
  float on = step(0.55, bit);
  vec2 c = fract(uv * vec2(3.0, 5.0));
  float pad = smoothstep(0.0, 0.12, c.x) * smoothstep(1.0, 0.88, c.x)
            * smoothstep(0.0, 0.12, c.y) * smoothstep(1.0, 0.88, c.y);
  return on * pad;
}

float terminal(vec2 uv, float time){
  vec2 gv = uv * 40.0 * gridMul / max(digitSize, 0.001);
  vec2 id = floor(gv);
  // per-column fall speed and glitchy jumps
  float col = hash21(vec2(id.x, 1.7));
  float speed = 0.4 + col * 1.6;
  float jump = floor(time * (0.6 + glitchAmount * 2.0) + col * 9.0);
  gv.y += time * speed * 4.0 + hash21(vec2(id.x, jump)) * glitchAmount * 6.0;
  id = floor(gv);
  vec2 f = fract(gv);

  float seed = hash21(id + floor(time * 6.0) * 0.013);
  float d = digit(f, seed);

  // vertical brightness envelope: bright head, decaying tail
  float trail = fract(-gv.y * 0.045 + col);
  float lum = pow(1.0 - trail, 3.0);
  float alive = step(0.28, hash21(id * 0.37 + 3.1));
  return d * lum * alive;
}

void main(){
  vec2 uv = gl_FragCoord.xy / res;
  vec2 p = uv - 0.5;
  p.x *= res.x / res.y;

  // barrel curvature
  float r2 = dot(p, p);
  p *= 1.0 + curvature * r2 * 0.6;

  p *= scale;
  p += mouse * mouseStrength * 0.25;

  float time = t;
  // horizontal tear lines
  float band = floor(p.y * 30.0);
  float tear = (hash21(vec2(band, floor(time * 3.0))) - 0.5)
             * glitchAmount * 0.06 * step(0.93, hash21(vec2(band, floor(time * 3.0) + 5.0)));
  p.x += tear;

  float ca = chromaticAberration * 0.004;
  float g = terminal(p, time);
  float rC = terminal(p + vec2(ca, 0.0), time);
  float bC = terminal(p - vec2(ca, 0.0), time);
  vec3 col = vec3(rC, g, bC);

  // film noise
  col += (noise(gl_FragCoord.xy * 0.9 + time * 60.0) - 0.5) * 0.09 * noiseAmp;

  // scanlines + flicker
  float scan = 1.0 - scanlineIntensity * 0.35 * (0.5 + 0.5 * sin(gl_FragCoord.y * 1.6 + time * 6.0));
  float flicker = 1.0 - flickerAmount * 0.12 * hash21(vec2(floor(time * 24.0), 4.2));
  col *= scan * flicker;

  col *= tint * brightness;
  col *= smoothstep(1.25, 0.15, length(p) * 0.5);

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export type FaultyTerminalProps = {
  className?: string;
  scale?: number;
  gridMul?: [number, number];
  digitSize?: number;
  timeScale?: number;
  pause?: boolean;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  chromaticAberration?: number;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  brightness?: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function FaultyTerminal({
  className,
  scale = 1.5,
  gridMul = [2, 1],
  digitSize = 1.2,
  timeScale = 1,
  pause = false,
  scanlineIntensity = 1,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  curvature = 0,
  tint = "#ffffff",
  mouseReact = true,
  mouseStrength = 0.5,
  brightness = 1,
}: FaultyTerminalProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const params = useRef({
    scale,
    gridMul,
    digitSize,
    timeScale,
    pause,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    curvature,
    tint,
    mouseReact,
    mouseStrength,
    brightness,
  });
  params.current = {
    scale,
    gridMul,
    digitSize,
    timeScale,
    pause,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    curvature,
    tint,
    mouseReact,
    mouseStrength,
    brightness,
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("res");
    const uT = u("t");
    const uMouse = u("mouse");
    const uScale = u("scale");
    const uGrid = u("gridMul");
    const uDigit = u("digitSize");
    const uScan = u("scanlineIntensity");
    const uGlitch = u("glitchAmount");
    const uFlicker = u("flickerAmount");
    const uNoise = u("noiseAmp");
    const uCa = u("chromaticAberration");
    const uCurv = u("curvature");
    const uBright = u("brightness");
    const uMs = u("mouseStrength");
    const uTint = u("tint");

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let disposed = false;
    let time = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / (r.width || 1) - 0.5;
      mouse.ty = -((e.clientY - r.top) / (r.height || 1) - 0.5);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const render = (ms: number) => {
      if (disposed) return;
      const dt = Math.min((ms - last) / 1000, 0.05);
      last = ms;
      const c = params.current;
      if (!c.pause) time += dt * c.timeScale;
      if (c.mouseReact) {
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
      }

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uScale, c.scale);
      gl.uniform2f(uGrid, c.gridMul[0], c.gridMul[1]);
      gl.uniform1f(uDigit, c.digitSize);
      gl.uniform1f(uScan, c.scanlineIntensity);
      gl.uniform1f(uGlitch, c.glitchAmount);
      gl.uniform1f(uFlicker, c.flickerAmount);
      gl.uniform1f(uNoise, c.noiseAmp);
      gl.uniform1f(uCa, c.chromaticAberration);
      gl.uniform1f(uCurv, c.curvature);
      gl.uniform1f(uBright, c.brightness);
      gl.uniform1f(uMs, c.mouseStrength);
      const [tr, tg, tb] = hexToRgb(c.tint);
      gl.uniform3f(uTint, tr, tg, tb);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}

export default FaultyTerminal;
