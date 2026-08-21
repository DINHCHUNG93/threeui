import { useEffect, useRef, useState } from "react";

export type HypnoticLoopsProps = {
  className?: string;
  sourceUrl?: string;
  variant?: HypnoticLoopsVariant;
  background?: string;
  shape?: number;
  /** @deprecated Prefer the lines, dots, or rays variant. */
  lines?: number;
  /** @deprecated Prefer the lines, dots, or rays variant. */
  dots?: number;
  /** @deprecated Prefer the lines, dots, or rays variant. */
  rays?: number;
};

export type HypnoticLoopsVariant = "lines" | "dots" | "rays" | "type";

type HypnoticControls = {
  shape: number;
  mode: number;
  background: [number, number, number];
  backgroundHex: string;
};

const CONTROL_MESSAGE = "threeui:hypnotic-controls";
const ERROR_MESSAGE = "threeui:hypnotic-error";
const READY_MESSAGE = "threeui:hypnotic-ready";
const STYLE_LABELS = ["LINES", "DOTS", "RAYS", "TYPE"] as const;
const MODE_BY_VARIANT: Record<HypnoticLoopsVariant, number> = { type: 0, rays: 1, dots: 2, lines: 3 };

export const HYPNOTIC_LOOPS_BACKGROUNDS: Record<HypnoticLoopsVariant, string> = {
  lines: "#f15a24",
  dots: "#e44732",
  rays: "#f28a18",
  type: "#c7432f",
};

function replaceExact(source: string, before: string, after: string) {
  if (!source.includes(before)) throw new Error("Hypnotic Loops source adapter is out of sync with the canonical document.");
  return source.replace(before, after);
}

function buildInteractiveSource(source: string, initialControls: HypnoticControls) {
  let next = source;

  next = replaceExact(
    next,
    "<script>\n(() => {",
    `<script>
addEventListener('error', (event) => {
  document.documentElement.dataset.runtimeError = event.message;
  parent.postMessage({ type: '${ERROR_MESSAGE}', message: event.message }, '*');
});
</script>
<script>
(() => {`,
  );
  next = replaceExact(next, "<title>Hypnotic Loops — LINES / DOTS / RAYS / TYPE</title>", "<title>Hypnotic Loops — Interactive Study</title>");
  next = replaceExact(next, ":root{ --bg:#2919EB; }", `:root{ --bg:${initialControls.backgroundHex}; }`);
  next = replaceExact(
    next,
    "const BG = [0x29/255, 0x19/255, 0xEB/255];",
    `const BG = [${initialControls.background.join(", ")}];`,
  );
  STYLE_LABELS.forEach((label, index) => {
    next = replaceExact(next, `\n  <div class="lbl" data-i="${index}">${label}</div>`, "");
  });
  next = replaceExact(
    next,
    "const MAIN   = { x: 452, y: 452, s: 1.0 };            // main disc",
    "const MAIN   = { x: 600, y: 450, s: 1.12 };           // centered interactive disc",
  );
  next = replaceExact(
    next,
    "const THUMB_MODES = [M_LINES, M_DOTS, M_RAYS, M_TYPE];",
    `const THUMB_MODES = [M_LINES, M_DOTS, M_RAYS, M_TYPE];
const CONTROL = { shape: ${initialControls.shape}, mode: ${initialControls.mode} };`,
  );
  next = replaceExact(
    next,
    `uniform int   u_cur, u_prev;
uniform float u_wipe;
uniform float u_R0;`,
    `uniform int u_mode;
uniform float u_R0;`,
  );
  next = replaceExact(
    next,
    `  float wipeR = u_wipe * 170.0;
  int mode = (r < wipeR) ? u_cur : u_prev;
  float m = pattern(mode, r, ph);
  // hard cutout, not alpha: the gaps must let folds behind show through,
  // so edges are resolved by supersampling the scene buffer instead
  if (m < 0.5) discard;`,
    `  float m = pattern(u_mode, r, ph);
  // Preserve the authored hard cutout so folded layers remain visible.
  if (m < 0.5) discard;`,
  );
  next = replaceExact(
    next,
    ` 'u_twist','u_swirl','u_scale1','u_R0','u_design','u_cur','u_prev','u_wipe','u_type','u_bg']`,
    ` 'u_twist','u_swirl','u_scale1','u_R0','u_design','u_mode','u_type','u_bg']`,
  );
  next = replaceExact(
    next,
    `function drawInstance(cx, cy, scale, amp, sched, spin){
  gl.uniform2f(uS.u_center, cx, cy);
  gl.uniform1f(uS.u_scale, scale);
  gl.uniform1f(uS.u_amp, amp);`,
    `function drawInstance(cx, cy, scale, amp, spin){
  gl.uniform2f(uS.u_center, cx, cy);
  gl.uniform1f(uS.u_scale, scale);
  gl.uniform1f(uS.u_amp, amp * CONTROL.shape);`,
  );
  next = replaceExact(
    next,
    `  gl.uniform1f(uS.u_R0, R0);
  gl.uniform1i(uS.u_cur, sched.cur);
  gl.uniform1i(uS.u_prev, sched.prev);
  gl.uniform1f(uS.u_wipe, sched.w);
  gl.drawElements(gl.TRIANGLES, IDXCOUNT, gl.UNSIGNED_INT, 0);`,
    `  gl.uniform1f(uS.u_R0, R0);
  gl.uniform1i(uS.u_mode, CONTROL.mode);
  gl.drawElements(gl.TRIANGLES, IDXCOUNT, gl.UNSIGNED_INT, 0);`,
  );
  next = replaceExact(
    next,
    `  const ampMain  = ampAt(t - DEF_LAG);
  const ampThumb = ampAt(t);
  const sched    = schedule(t + TRANS_LEAD);
  const spin     = P.SPIN + P.SPINV * t;`,
    `  const ampMain = ampAt(t - DEF_LAG);
  const spin = P.SPIN + P.SPINV * t;`,
  );
  next = replaceExact(
    next,
    `  drawInstance(MAIN.x, MAIN.y, MAIN.s, ampMain, sched, spin);
  for (let i = 0; i < 4; i++){
    drawInstance(THUMB_X, THUMB_Y0 + THUMB_DY*i, THUMB_S, ampThumb,
                 { cur: THUMB_MODES[i], prev: THUMB_MODES[i], w: 1 }, spin);
  }`,
    `  drawInstance(MAIN.x, MAIN.y, MAIN.s, ampMain, spin);`,
  );
  next = replaceExact(
    next,
    `  // labels
  const px = cssW / DW;
  document.querySelectorAll('.lbl').forEach(el => {
    const i = +el.dataset.i;
    el.style.fontSize = (LABEL_SIZE * px) + 'px';
    el.style.letterSpacing = (0.42 * px) + 'px';
    el.style.left = (LABEL_X * px) + 'px';
    el.style.top  = ((THUMB_Y0 + THUMB_DY * i) * px) + 'px';
  });
`,
    "",
  );
  next = replaceExact(
    next,
    `function resize(){
  const vw = window.innerWidth, vh = window.innerHeight;`,
    `function resize(){
  const vw = window.innerWidth, vh = window.innerHeight;
  if (vw <= 0 || vh <= 0) return;`,
  );
  next = replaceExact(
    next,
    `window.addEventListener('resize', resize);
resize();`,
    `window.addEventListener('resize', resize);
window.addEventListener('load', resize, { once: true });
const sizeObserver = new ResizeObserver(resize);
sizeObserver.observe(document.documentElement);
resize();`,
  );
  next = replaceExact(
    next,
    `  bloomA = makeFBO(hw, hh); bloomB = makeFBO(hw, hh);

}
window.addEventListener('resize', resize);`,
    `  bloomA = makeFBO(hw, hh); bloomB = makeFBO(hw, hh);
  announceReady();
}
window.addEventListener('resize', resize);`,
  );
  next = replaceExact(
    next,
    "window.__P = P;",
    `function announceReady(){
  if (canvas.width <= 0 || canvas.height <= 0 || document.documentElement.dataset.runtimeReady === 'true') return;
  document.documentElement.dataset.runtimeReady = 'true';
  parent.postMessage({ type: '${READY_MESSAGE}' }, '*');
}
window.__P = P;
window.__setControls = (next) => {
  if (!next || typeof next !== 'object') return;
  const shape = Number(next.shape);
  const mode = Number(next.mode);
  if (Number.isFinite(shape)) CONTROL.shape = Math.max(0, Math.min(1.5, shape));
  if (Number.isFinite(mode)) CONTROL.mode = Math.max(0, Math.min(3, Math.round(mode)));
  if (Array.isArray(next.background) && next.background.length === 3) {
    for (let index = 0; index < 3; index++) {
      const channel = Number(next.background[index]);
      if (Number.isFinite(channel)) BG[index] = Math.max(0, Math.min(1, channel));
    }
    document.documentElement.style.setProperty('--bg', 'rgb(' + Math.round(BG[0] * 255) + ' ' + Math.round(BG[1] * 255) + ' ' + Math.round(BG[2] * 255) + ')');
  }
  document.documentElement.dataset.controls = JSON.stringify(CONTROL);
  if (canvas.width === 0 || canvas.height === 0) resize();
};
addEventListener('message', (event) => {
  if (event.data?.type === '${CONTROL_MESSAGE}') window.__setControls(event.data.controls);
});
announceReady();`,
  );

  return next;
}

function normalizedBackground(background: string): { hex: string; rgb: [number, number, number] } {
  const fallback = HYPNOTIC_LOOPS_BACKGROUNDS.lines;
  const candidate = /^#[\da-f]{3}$/i.test(background)
    ? `#${background.slice(1).split("").map((channel) => channel + channel).join("")}`
    : background;
  const hex = /^#[\da-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : fallback;
  return {
    hex,
    rgb: [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255) as [number, number, number],
  };
}

function normalizedControls(
  variant: HypnoticLoopsVariant | undefined,
  background: string | undefined,
  shape: number,
  lines: number | undefined,
  dots: number | undefined,
  rays: number | undefined,
): HypnoticControls {
  const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
  const legacyWeights = { lines: lines ?? -1, dots: dots ?? -1, rays: rays ?? -1 };
  const legacyVariant = (Object.entries(legacyWeights).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "lines") as HypnoticLoopsVariant;
  const resolvedVariant = variant ?? (Math.max(...Object.values(legacyWeights)) >= 0 ? legacyVariant : "lines");
  const palette = normalizedBackground(background ?? HYPNOTIC_LOOPS_BACKGROUNDS[resolvedVariant]);
  return {
    shape: Math.max(0, Math.min(1.5, finite(shape, 1))),
    mode: MODE_BY_VARIANT[resolvedVariant],
    background: palette.rgb,
    backgroundHex: palette.hex,
  };
}

export function HypnoticLoops({
  className = "",
  sourceUrl = "/hypnotic-loops.html",
  variant,
  background,
  shape = 1,
  lines,
  dots,
  rays,
}: HypnoticLoopsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const intersectsRef = useRef(true);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [sourceDoc, setSourceDoc] = useState("");
  const [runtimeError, setRuntimeError] = useState("");
  const controls = normalizedControls(variant, background, shape, lines, dots, rays);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  useEffect(() => {
    const receiveFrameMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow || typeof event.data !== "object" || !event.data) return;
      const message = event.data as { type?: string; message?: string };
      if (message.type === ERROR_MESSAGE) setRuntimeError(message.message ?? "Unknown Hypnotic Loops runtime error");
      if (message.type === READY_MESSAGE) setReady(true);
    };
    window.addEventListener("message", receiveFrameMessage);
    return () => window.removeEventListener("message", receiveFrameMessage);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setSourceDoc("");
    setReady(false);
    setRuntimeError("");
    fetch(sourceUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load Hypnotic Loops source (${response.status}).`);
        return response.text();
      })
      .then((source) => setSourceDoc(buildInteractiveSource(source, controlsRef.current)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.error(error);
      });
    return () => controller.abort();
  }, [sourceUrl]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let mountFrame = 0;
    const sync = () => {
      cancelAnimationFrame(mountFrame);
      if (!intersectsRef.current || document.visibilityState === "hidden") {
        setMounted(false);
        return;
      }
      mountFrame = requestAnimationFrame(() => {
        mountFrame = requestAnimationFrame(() => setMounted(true));
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      intersectsRef.current = entry.isIntersecting;
      sync();
    }, { rootMargin: "80px" });

    observer.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(mountFrame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (!mounted) setReady(false);
  }, [mounted]);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage({ type: CONTROL_MESSAGE, controls }, "*");
  }, [controls.backgroundHex, controls.mode, controls.shape, ready]);

  return (
    <div
      ref={hostRef}
      className={`hypnotic-loops${className ? ` ${className}` : ""}`}
      data-state={!mounted || !sourceDoc ? "paused" : ready ? "ready" : "loading"}
      data-shape={controls.shape}
      data-mode={controls.mode}
      data-variant={variant ?? "lines"}
      data-background={controls.backgroundHex}
      data-error={runtimeError || undefined}
      style={{ backgroundColor: controls.backgroundHex }}
    >
      {mounted && sourceDoc ? (
        <iframe
          ref={frameRef}
          className={`hypnotic-loops__frame${ready ? " is-ready" : ""}`}
          title="Interactive hypnotic loops"
          srcDoc={sourceDoc}
          sandbox="allow-scripts"
          loading="eager"
          style={{ backgroundColor: controls.backgroundHex }}
        />
      ) : null}
      {runtimeError ? <span className="preview-loading" role="alert">{runtimeError}</span> : null}
    </div>
  );
}
