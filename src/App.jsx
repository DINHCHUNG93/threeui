import { useEffect, useMemo, useState } from "react";

const DATA_URL = "./data/catalog.json";
const SOURCE_URL = "./data/community-source.json";
const LIVE_SITE = "https://threeui.netlify.app";

function normalize(value) {
  return value.toLocaleLowerCase();
}

function matches(item, query) {
  if (!query) return true;
  return normalize([item.label, item.description, item.category, ...(item.tags ?? [])].join(" ")).includes(normalize(query));
}

function Media({ item, eager = false }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className="media"
      onPointerEnter={() => setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      onFocus={() => setPlaying(true)}
      onBlur={() => setPlaying(false)}
    >
      <img src={item.thumbnail} alt="" loading={eager ? "eager" : "lazy"} />
      {playing && item.preview ? (
        <video src={item.preview} poster={item.thumbnail} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
      ) : null}
      <span className={`access-badge ${item.access}`}>{item.access === "community" ? "OPEN SOURCE" : "PRO PREVIEW"}</span>
    </div>
  );
}

function Card({ item, onOpen }) {
  return (
    <button className="catalog-card" type="button" onClick={() => onOpen(item)}>
      <Media item={item} />
      <span className="card-copy">
        <span className="card-meta">{item.category}</span>
        <strong>{item.label}</strong>
        <span>{item.description}</span>
      </span>
    </button>
  );
}

function SourceViewer({ source }) {
  const [activePath, setActivePath] = useState(source?.files?.[0]?.path ?? "");
  useEffect(() => setActivePath(source?.files?.[0]?.path ?? ""), [source]);
  if (!source) return <p className="empty">Source bundle unavailable.</p>;
  const file = source.files.find((entry) => entry.path === activePath) ?? source.files[0];
  return (
    <div className="source-viewer">
      <div className="file-tabs" role="tablist" aria-label="Source files">
        {source.files.map((entry) => (
          <button
            key={entry.path}
            className={entry.path === file.path ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={entry.path === file.path}
            onClick={() => setActivePath(entry.path)}
          >
            {entry.path.split("/").at(-1)}
          </button>
        ))}
      </div>
      <div className="code-head"><span>{file.path}</span><span>{file.language}</span></div>
      <pre><code>{file.code}</code></pre>
    </div>
  );
}

function Detail({ item, source, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="close" type="button" onClick={onClose} aria-label="Close details">×</button>
        <Media item={item} eager />
        <div className="detail-copy">
          <span className="eyebrow">{item.category} · {item.runtime}</span>
          <h2 id="detail-title">{item.label}</h2>
          <p>{item.description}</p>
          {item.access === "pro" ? (
            <div className="pro-callout">
              <strong>Preview only</strong>
              <p>This public repository includes no renderer, source, prompts, controls, or package exports for this Pro resource.</p>
              <a className="primary-link" href={item.upgradeUrl} target="_blank" rel="noreferrer">View Pro on ThreeUI ↗</a>
            </div>
          ) : (
            <>
              <div className="open-callout"><strong>No account required.</strong> The reviewed source bundle is included below under the MIT license.</div>
              <SourceViewer source={source} />
            </>
          )}
        </div>
      </article>
    </div>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [sources, setSources] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
        return response.json();
      })
      .then(setCatalog)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Catalog unavailable"));
  }, []);

  useEffect(() => {
    if (active?.access !== "community" || sources) return;
    fetch(SOURCE_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Source request failed: ${response.status}`);
        return response.json();
      })
      .then(setSources)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Source unavailable"));
  }, [active, sources]);

  const items = useMemo(() => {
    if (!catalog) return [];
    const all = [...catalog.community, ...catalog.pro];
    return all.filter((item) => (filter === "all" || item.access === filter) && matches(item, query));
  }, [catalog, filter, query]);

  const activeSource = active && sources?.components?.find((entry) => entry.id === active.sourceId);

  return (
    <>
      <header className="site-head">
        <a className="brand" href="./" aria-label="ThreeUI Community home"><span>3</span>ThreeUI</a>
        <nav aria-label="Primary navigation">
          <a href="#catalog">Community</a>
          <a href={`${LIVE_SITE}/pricing`} target="_blank" rel="noreferrer">Upgrade ↗</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <span className="eyebrow">OPEN SOURCE · NO LOGIN</span>
          <h1>Free visual components.<br />Pro stays private.</h1>
          <p>Use reviewed Community source without an account. Explore Pro through images and videos, then upgrade on the live ThreeUI site.</p>
          <a className="primary-link" href="#catalog">Browse the catalog ↓</a>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="catalog-head">
            <div>
              <span className="eyebrow">PUBLIC CATALOG</span>
              <h2>Explore the field</h2>
            </div>
            <label className="search">
              <span className="sr-only">Search resources</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" />
            </label>
          </div>

          <div className="filters" aria-label="Catalog filters">
            {[
              ["all", "All"],
              ["community", "Community"],
              ["pro", "Pro previews"],
            ].map(([value, label]) => (
              <button key={value} className={filter === value ? "active" : ""} type="button" onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>

          {error ? <p className="error" role="alert">{error}</p> : null}
          {!catalog && !error ? <p className="loading">Loading catalog…</p> : null}
          <div className="catalog-grid">
            {items.map((item) => <Card key={`${item.access}:${item.id}`} item={item} onOpen={setActive} />)}
          </div>
          {catalog && items.length === 0 ? <p className="empty">No resources match this search.</p> : null}
        </section>
      </main>

      <footer>
        <span>ThreeUI Community · MIT source</span>
        <a href={LIVE_SITE} target="_blank" rel="noreferrer">Live ThreeUI ↗</a>
      </footer>

      {active ? <Detail item={active} source={activeSource} onClose={() => setActive(null)} /> : null}
    </>
  );
}
