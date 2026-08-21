import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import genieDockSource from "./sources/genie-effect.html?raw";

export type GenieDockProps = {
  className?: string;
  style?: CSSProperties;
};

const EMBED_STYLE = `<style data-threeui-genie-dock>
html,
body,
#desk {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
}

body {
  margin: 0 !important;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
</style>`;

const PREVIEW_SCRIPT = `<script data-threeui-genie-preview>
requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    if (window.__genie) window.__genie('pane', 0.56);
  });
});
</script>`;

const DEMO_SCRIPT = `<script data-threeui-genie-demo>
setTimeout(function () {
  var target = window.__wins && window.__wins.find(function (item) { return item.cfg.id === 'pane'; });
  if (!target) return;
  minimize(target);
  setTimeout(function () { restore(target); }, 920);
  setTimeout(function () { minimize(target); }, 1960);
  setTimeout(function () { restore(target); }, 2880);
}, 420);
</script>`;

function buildGenieDockDocument(reducedMotion: boolean, capturePreview: boolean, captureDemo: boolean) {
  let source = genieDockSource
    .replace("<title>the genie effect</title>", "<title>Genie Dock</title>")
    .replace("</head>", `${EMBED_STYLE}</head>`);

  if (reducedMotion) {
    source = source.replace("const DUR    = 410;", "const DUR    = 1;");
  }

  if (captureDemo && !reducedMotion) {
    source = source.replace("</body>", `${DEMO_SCRIPT}</body>`);
  } else if (capturePreview && !reducedMotion) {
    source = source.replace("</body>", `${PREVIEW_SCRIPT}</body>`);
  }

  return source;
}

export function GenieDock({ className = "", style }: GenieDockProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostVisible, setHostVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => (
    typeof document === "undefined" || !document.hidden
  ));
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));
  const [ready, setReady] = useState(false);
  const capturePreview = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("capture") === "preview";
  const captureDemo = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("demo") === "motion";

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setHostVisible(entry?.isIntersecting ?? true));
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const documentSource = useMemo(
    () => buildGenieDockDocument(reducedMotion, capturePreview, captureDemo),
    [captureDemo, capturePreview, reducedMotion],
  );
  const mounted = hostVisible && documentVisible;

  useEffect(() => {
    setReady(false);
  }, [mounted, reducedMotion]);

  return (
    <div
      ref={hostRef}
      className={`threeui-background genie-dock${className ? ` ${className}` : ""}`}
      aria-label="Interactive desktop with a Genie-effect application dock"
      data-state={ready ? "ready" : "loading"}
      style={{ position: "relative", overflow: "hidden", background: "#5e5142", pointerEvents: "auto", ...style }}
    >
      {mounted ? (
        <iframe
          key={`${reducedMotion ? "reduced" : "motion"}-${captureDemo ? "demo" : capturePreview ? "preview" : "live"}`}
          title="Interactive Genie Dock"
          srcDoc={documentSource}
          sandbox="allow-scripts"
          loading="eager"
          onLoad={() => setReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            width: "100%",
            height: "100%",
            border: 0,
            background: "#5e5142",
          }}
        />
      ) : null}
    </div>
  );
}
