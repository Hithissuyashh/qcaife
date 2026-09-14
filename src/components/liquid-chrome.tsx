import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

/**
 * Liquid chrome: domain-warped iso-band field rendered as a molten metal sheet.
 * Purely decorative, single fullscreen quad, no dependencies.
 */
const FRAG = `
precision highp float;
uniform vec2 res;
uniform float t;
uniform vec2 m;

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - res) / min(res.x, res.y);
  uv *= 1.35;
  uv += m * 0.18;

  for (float i = 1.0; i < 9.0; i += 1.0) {
    uv.x += 0.58 / i * cos(i * 2.4 * uv.y + t * 0.22);
    uv.y += 0.58 / i * cos(i * 1.6 * uv.x + t * 0.19);
  }

  float d = abs(sin(t * 0.18 - uv.y - uv.x));
  float chrome = 0.085 / max(d, 0.012);
  chrome = clamp(chrome, 0.0, 1.35);

  // faintly cool metal, warmer in the specular core
  vec3 col = mix(vec3(0.72, 0.78, 0.90), vec3(1.0), pow(chrome, 1.7)) * chrome;

  float r = length((gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y));
  col *= smoothstep(1.85, 0.1, r);

  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.015;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function LiquidChrome({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");
    const uM = gl.getUniformLocation(prog, "m");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let disposed = false;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.max(1, Math.floor(canvas!.clientWidth * dpr));
      canvas!.height = Math.max(1, Math.floor(canvas!.clientHeight * dpr));
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    function render(ms: number) {
      if (disposed) return;
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uT, ms * 0.001);
      gl!.uniform2f(uM, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    }

    const onResize = () => resize();
    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    resize();
    if (reduced) render(0);
    else raf = requestAnimationFrame(render);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}