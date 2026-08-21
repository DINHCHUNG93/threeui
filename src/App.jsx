import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

const CATALOG_URL = "./data/catalog.json";
const SOURCE_URL = "./data/community-source.json";
const LIVE_SITE = "https://threeui.com";
const CATEGORY_ORDER = ["Landing Pages", "Hero", "Three.js", "Backgrounds", "Buttons", "Text Animation", "UI Elements", "CSS", "Motion Design", "Sections"];
const FEATURED_LABELS = ["ASCII Page Transition", "Agent Arcana", "Character Carousel", "Understory", "Receipt Printer", "Noctiluca", "CRT", "365 Shapes", "Aurello", "Recursive Erosion", "Engraved Certificate", "Structure Flow"];
const FEATURED_RANK = new Map(FEATURED_LABELS.map((label, index) => [label, index]));

function Icon({ children, size = 16, viewBox = "0 0 24 24" }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function SearchIcon() { return <Icon><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Icon>; }
function MenuIcon() { return <Icon><path d="M4 7h16M4 12h16M4 17h16" /></Icon>; }
function ChevronIcon() { return <Icon size={13}><path d="m9 5 6 7-6 7" /></Icon>; }
function SunIcon() { return <Icon size={14}><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>; }
function MoonIcon() { return <Icon size={14}><path d="M20 15.2A8 8 0 0 1 8.8 4 8 8 0 1 0 20 15.2Z" /></Icon>; }
function SystemIcon() { return <Icon size={14}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></Icon>; }
function CopyIcon() { return <Icon size={14}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></Icon>; }

function BrandMark({ compact = false }) {
  const maskId = compact ? "threeui-mark-compact" : "threeui-mark";
  return (
    <span className={compact ? "topbar-brand" : "logo"}>
      <span className="brand-symbol">
        <svg className="brand-mark" viewBox="0 0 512 512" aria-hidden="true">
          <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><rect width="512" height="512" fill="#000" /><circle cx="256" cy="256" r="208" fill="#fff" /><g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="28"><path d="M36 178C112 252 184 264 260 196C336 128 404 114 482 180" /><path d="M36 292C112 366 184 378 260 310C336 242 404 228 482 294" /></g></mask></defs>
          <rect width="512" height="512" fill="currentColor" mask={`url(#${maskId})`} />
        </svg>
      </span>
      <strong>threeui</strong>
    </span>
  );
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("threeui-community-theme") || "dark"; } catch { return "dark"; }
  });
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const scheme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.dataset.theme = scheme;
      root.dataset.scheme = scheme;
      root.style.colorScheme = scheme;
    };
    apply();
    media.addEventListener("change", apply);
    try { localStorage.setItem("threeui-community-theme", theme); } catch { /* Theme still applies. */ }
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return [theme, setTheme];
}

function ThemeButtons({ compact = false, theme, onChange }) {
  return (
    <div className={`theme-buttons${compact ? " compact" : ""}`} role="group" aria-label="Appearance">
      {[["light", <SunIcon />, "Light"], ["dark", <MoonIcon />, "Dark"], ["system", <SystemIcon />, "System"]].map(([value, icon, label]) => (
        <button className={`theme-button${theme === value ? " active" : ""}`} type="button" key={value} aria-pressed={theme === value} onClick={() => onChange(value)}>{icon}<span>{label}</span></button>
      ))}
    </div>
  );
}

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    const category = item.category || "Other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(item);
  }
  return [...groups].sort(([left], [right]) => {
    const leftRank = CATEGORY_ORDER.indexOf(left);
    const rightRank = CATEGORY_ORDER.indexOf(right);
    return (leftRank < 0 ? 999 : leftRank) - (rightRank < 0 ? 999 : rightRank) || left.localeCompare(right);
  });
}

function resourceSearchText(item) {
  return [
    item.label,
    item.category,
    item.runtime,
    ...(item.tags || []),
    ...(item.variants || []).flatMap((variant) => [variant.label, variant.description]),
  ].join(" ").toLocaleLowerCase();
}

function CatalogSection({ label, items, activeId, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const [openCategories, setOpenCategories] = useState(() => new Set(CATEGORY_ORDER));
  const groups = useMemo(() => groupByCategory(items), [items]);
  return (
    <div className="nav-section">
      <h2 className="nav-label"><button className="nav-section-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}><span>{label}</span><span aria-hidden="true">⌗</span></button></h2>
      <div className={`nav-children${expanded ? " is-open" : ""}`}><div>
        {groups.map(([category, categoryItems]) => {
          const isOpen = openCategories.has(category);
          return (
            <div className="nav-block" key={category}>
              <button className="nav-group" type="button" aria-expanded={isOpen} onClick={() => setOpenCategories((current) => {
                const next = new Set(current);
                if (next.has(category)) next.delete(category); else next.add(category);
                return next;
              })}>{category}<span className="chev"><ChevronIcon /></span></button>
              <div className={`nav-children${isOpen ? " is-open" : ""}`}><div className="nav-list">
                {categoryItems.map((item) => <button className={`nav-link${activeId === item.id ? " active" : ""}`} type="button" key={item.id} onClick={() => onSelect(item)}><span>{item.label}</span><span className="nav-link-badges">{item.variants?.length > 1 ? <span className="variant-count" aria-label={`${item.variants.length} variants`} title={`${item.variants.length} variants`}>{item.variants.length}</span> : null}{item.access === "pro" ? <span className="pro-badge">PRO</span> : null}</span></button>)}
              </div></div>
            </div>
          );
        })}
      </div></div>
    </div>
  );
}

function Sidebar({ open, page, resources, activeItem, theme, onTheme, onBrowse, onInstallation, onSelect, onSearch }) {
  const community = resources.filter((item) => item.access === "community");
  const pro = resources.filter((item) => item.access === "pro");
  return (
    <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
      <div className="sb-head">
        <div className="sb-brand-row"><button className="brand-button" type="button" aria-label="Browse ThreeUI" onClick={onBrowse}><BrandMark /></button><span className="license-badge">MIT</span></div>
        <button className="search" type="button" onClick={onSearch}><SearchIcon /><span className="ph">Search...</span><kbd>⌘ K</kbd></button>
      </div>
      <div className="sb-scroll scroll-area"><nav className="sb-nav" aria-label="ThreeUI documentation">
        <div className="nav-section"><h2 className="nav-label">Documentation</h2><div className="nav-list nav-list-root">
          <button className={`nav-link${page === "browse" ? " active" : ""}`} type="button" onClick={onBrowse}><span>Browse</span></button>
          <button className={`nav-link${page === "installation" ? " active" : ""}`} type="button" onClick={onInstallation}><span>Installation</span></button>
        </div></div>
        <CatalogSection label="ThreeUI" items={community} activeId={page === "detail" ? activeItem?.id : null} onSelect={onSelect} />
        <CatalogSection label="ThreeUI Pro" items={pro} activeId={page === "detail" ? activeItem?.id : null} onSelect={onSelect} />
      </nav></div>
      <div className="sb-foot"><a className="full-library-link" href={`${LIVE_SITE}/pricing`} target="_blank" rel="noreferrer"><span>View full ThreeUI</span><span>↗</span></a><ThemeButtons theme={theme} onChange={onTheme} /></div>
    </aside>
  );
}

function Media({ item, active = false, eager = false }) {
  return <span className="browse-media" aria-hidden="true"><img src={item.thumbnail} alt="" width="640" height="360" loading={eager ? "eager" : "lazy"} decoding="async" />{active && item.preview ? <video src={item.preview} poster={item.thumbnail} muted loop playsInline autoPlay preload="metadata" /> : null}</span>;
}

function BrowsePage({ resources, onSelect }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const [category, setCategory] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const ordered = useMemo(() => resources.toSorted((left, right) => (FEATURED_RANK.get(left.label) ?? 999) - (FEATURED_RANK.get(right.label) ?? 999) || left.label.localeCompare(right.label)), [resources]);
  const filtered = useMemo(() => ordered.filter((item) => {
    if (category && item.category !== category) return false;
    if (!deferredQuery) return true;
    return resourceSearchText(item).includes(deferredQuery);
  }), [category, deferredQuery, ordered]);
  const categories = CATEGORY_ORDER.filter((value) => resources.some((item) => item.category === value));
  return (
    <main className="browse-page" aria-labelledby="browse-title">
      <header className="browse-header">
        <div className="browse-heading-row"><div><h1 id="browse-title">Three.js components, 3D shaders, prompts &amp; templates</h1><p className="lede">Browse the open Community collection and media-only previews from ThreeUI Pro. No account required.</p></div>
          <label className="browse-filter"><SearchIcon /><input id="browse-search" type="search" value={query} placeholder={`Search ${resources.length} components`} aria-label={`Search ${resources.length} components`} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <div className="browse-category-filters" role="group" aria-label="Filter components by category">{categories.map((value) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(category === value ? null : value)}>{value}</button>)}</div>
      </header>
      {filtered.length ? <div className="browse-grid">{filtered.map((item, index) => (
        <article className="browse-item" key={item.id} style={{ "--browse-index": index }}><button className="browse-item-link" type="button" aria-label={`${item.label}. ${item.access === "pro" ? "Premium preview" : "Community source"}.${item.variants?.length > 1 ? ` ${item.variants.length} variants.` : ""}`} onPointerEnter={() => setPreviewId(item.id)} onPointerLeave={() => setPreviewId(null)} onFocus={() => setPreviewId(item.id)} onBlur={() => setPreviewId(null)} onClick={() => onSelect(item)}>
          <Media item={item} active={previewId === item.id} eager={index < 6} /><span className="browse-details"><span className="browse-title-row"><strong>{item.label}</strong>{item.access === "pro" ? <span className="pro-badge">PRO</span> : null}</span><span className="browse-tags">{(item.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</span></span>
        </button></article>
      ))}</div> : <div className="browse-empty" role="status"><strong>No components match “{query}”.</strong><span>Try another title, tag, category, or technology.</span></div>}
    </main>
  );
}

function InstallationPage() {
  return (
    <main className="doc-page"><header className="doc-intro"><span className="eyebrow">DOCUMENTATION</span><h1>Installation</h1><p className="lede">Run the Community catalog locally with no account, environment variables, or paid services.</p></header>
      <section className="doc-section"><h2>Start locally</h2><div className="steps">
        <article className="step"><span>1</span><div><h3>Install dependencies</h3><pre><code>npm install</code></pre></div></article>
        <article className="step"><span>2</span><div><h3>Start the development server</h3><pre><code>npm run dev</code></pre></div></article>
        <article className="step"><span>3</span><div><h3>Verify the public boundary</h3><pre><code>npm run build</code></pre></div></article>
      </div></section>
      <section className="notice-panel"><strong>Public by design</strong><p>Community source is committed only after boundary review. Pro cards contain media metadata and an upgrade link—not renderer code, prompts, controls, or exports.</p></section>
    </main>
  );
}

function SourceViewer({ source }) {
  const [activePath, setActivePath] = useState(source?.files?.[0]?.path || "");
  useEffect(() => setActivePath(source?.files?.[0]?.path || ""), [source]);
  if (!source) return null;
  const file = source.files.find((entry) => entry.path === activePath) || source.files[0];
  return <section className="source-card"><div className="source-head"><div><span className="eyebrow">SOURCE</span><h2>Implementation</h2></div><span>{source.files.length} {source.files.length === 1 ? "file" : "files"}</span></div>
    <div className="tabbar" role="tablist" aria-label="Source files">{source.files.map((entry) => <button className={`tab${entry.path === file.path ? " active" : ""}`} type="button" role="tab" aria-selected={entry.path === file.path} key={entry.path} onClick={() => setActivePath(entry.path)}>{entry.path.split("/").at(-1)}</button>)}</div>
    <div className="source-filebar"><span>{file.path}</span><span>{file.language}</span></div><pre className="source-code"><code>{file.code}</code></pre>
  </section>;
}

function VariantPicker({ item, activeVariantId, onSelect }) {
  const [previewId, setPreviewId] = useState(null);
  const [edgeMask, setEdgeMask] = useState("none");
  const railRef = useRef(null);
  const variantCount = item.variants?.length || 0;
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || variantCount <= 1) return undefined;
    let animationFrame = 0;
    const updateMask = () => {
      animationFrame = 0;
      const hasLeft = rail.scrollLeft > 2;
      const hasRight = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2;
      setEdgeMask(hasLeft && hasRight ? "both" : hasLeft ? "left" : hasRight ? "right" : "none");
    };
    const scheduleUpdate = () => { if (!animationFrame) animationFrame = window.requestAnimationFrame(updateMask); };
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    rail.addEventListener("scroll", scheduleUpdate, { passive: true });
    resizeObserver.observe(rail);
    scheduleUpdate();
    return () => {
      rail.removeEventListener("scroll", scheduleUpdate);
      resizeObserver.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [item.id, variantCount]);
  if (!item.variants || item.variants.length <= 1) return null;
  return <section className="variant-picker" aria-label={`${item.label} variants`}>
    <div className="variant-picker-head">{item.variants.length} variants</div>
    <div className="variant-options" ref={railRef} role="radiogroup" aria-label="Choose a variant" data-edge-mask={edgeMask}>
      {item.variants.map((variant) => {
        const selected = variant.id === activeVariantId;
        const previewing = previewId === variant.id;
        return <button className={`variant-option${selected ? " active" : ""}`} type="button" role="radio" aria-checked={selected} aria-label={`${variant.label}. ${variant.description}`} key={variant.id} onPointerEnter={() => setPreviewId(variant.id)} onPointerLeave={() => setPreviewId(null)} onFocus={() => setPreviewId(variant.id)} onBlur={() => setPreviewId(null)} onClick={(event) => { onSelect(variant.id); event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }}>
          <span className="variant-option-thumbnail"><img src={variant.thumbnail} alt="" loading="lazy" decoding="async" />{previewing && variant.preview ? <video className="variant-option-preview-video" src={variant.preview} poster={variant.thumbnail} autoPlay muted loop playsInline preload="metadata" tabIndex={-1} aria-hidden="true" /> : null}</span>
          <span className="variant-option-label"><span>{variant.label}</span>{variant.access === "pro" ? <span className="pro-badge">PRO</span> : null}</span>
        </button>;
      })}
    </div>
  </section>;
}

function DetailPage({ item, source, onBrowse }) {
  const [playing, setPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState(item.variants?.[0]?.id || null);
  const activeVariant = item.variants?.find((variant) => variant.id === activeVariantId) || item.variants?.[0] || null;
  const activeMedia = activeVariant || item;
  const activeAccess = activeVariant?.access || item.access;
  const upgradeUrl = activeVariant?.upgradeUrl || item.upgradeUrl || `${LIVE_SITE}/pricing`;
  const copySource = async () => {
    if (!source || activeAccess === "pro") return;
    await navigator.clipboard.writeText(source.files.map((file) => `// ${file.path}\n${file.code}`).join("\n\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <main className="doc-page component-doc"><header className="doc-intro detail-intro"><div><button className="back-link" type="button" onClick={onBrowse}>← Browse</button><span className="eyebrow">{item.category} · {item.runtime}</span><h1>{item.label}</h1><p className="lede">{item.description}</p><div className="tagrow">{(item.tags || []).slice(0, 8).map((tag) => <span className="tag" key={tag}>{tag}</span>)}{item.access === "pro" ? <span className="pro-badge">PRO</span> : null}</div></div>
      <div className="doc-actions">{activeAccess === "pro" ? <a className="primary-action" href={upgradeUrl} target="_blank" rel="noreferrer">View Pro ↗</a> : source ? <button className="primary-action" type="button" onClick={copySource}><CopyIcon />{copied ? "Copied" : "Copy code"}</button> : <button className="primary-action" type="button" disabled>Preview only</button>}</div></header>
      <section className="preview-card"><div className="preview-toolbar"><span>{activeAccess === "pro" ? "Media preview" : "Community preview"}{activeVariant ? ` · ${activeVariant.label}` : ""}</span><button type="button" onClick={() => setPlaying((current) => !current)}>{playing ? "Pause" : "Play"}</button></div><div className="detail-media">{playing && activeMedia.preview ? <video key={activeMedia.id} src={activeMedia.preview} poster={activeMedia.thumbnail} autoPlay muted loop playsInline preload="metadata" /> : <img src={activeMedia.thumbnail} alt={`${item.label}${activeVariant ? ` ${activeVariant.label}` : ""} preview`} />}{activeAccess === "pro" ? <span className="pro-badge preview-badge">PRO PREVIEW</span> : null}</div></section>
      <VariantPicker item={item} activeVariantId={activeVariant?.id || null} onSelect={(variantId) => { setActiveVariantId(variantId); setPlaying(true); }} />
      {activeAccess === "pro" ? <section className="pro-disclosure"><span className="pro-badge">PRO</span><div><h2>Preview only in this repository</h2><p>The public project includes the image, video, tags, and upgrade link. Renderer source, prompts, controls, and package exports stay on the live ThreeUI site.</p><a href={upgradeUrl} target="_blank" rel="noreferrer">Explore the full component ↗</a></div></section> : source ? <SourceViewer source={source} /> : <section className="community-disclosure"><div><h2>Preview available, source under review</h2><p>This Community entry stays visible to match the ThreeUI catalog, but its source package is not published until bundled assets and mixed-access files have a clean public boundary.</p></div></section>}
    </main>
  );
}

function SearchDialog({ open, resources, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  useEffect(() => { if (!open) setQuery(""); }, [open]);
  if (!open) return null;
  const results = resources.filter((item) => !deferredQuery || resourceSearchText(item).includes(deferredQuery)).slice(0, 12);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="search-title"><div className="dialog-field"><SearchIcon /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search components..." aria-label="Search components" /><button type="button" onClick={onClose}>ESC</button></div><div className="dialog-results scroll-area"><span className="eyebrow" id="search-title">{results.length} RESULTS</span>{results.map((item) => <button className="dialog-result" type="button" key={item.id} onClick={() => onSelect(item)}><img src={item.thumbnail} alt="" /><span><strong>{item.label}</strong><small>{item.category} · {item.access === "pro" ? "Pro preview" : "Community"}</small></span>{item.access === "pro" ? <span className="pro-badge">PRO</span> : null}</button>)}</div></section></div>;
}

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [sources, setSources] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState("browse");
  const [activeItem, setActiveItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(CATALOG_URL).then((response) => { if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`); return response.json(); }),
      fetch(SOURCE_URL).then((response) => { if (!response.ok) throw new Error(`Source request failed: ${response.status}`); return response.json(); }),
    ]).then(([nextCatalog, nextSources]) => { if (!cancelled) { setCatalog(nextCatalog); setSources(nextSources); } }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Catalog unavailable"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setSidebarOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const resources = useMemo(() => catalog ? [...catalog.community, ...catalog.pro] : [], [catalog]);
  const sourceById = useMemo(() => new Map((sources?.components || []).map((source) => [source.id, source])), [sources]);
  const activeSource = activeItem?.access === "community" ? sourceById.get(activeItem.sourceId) : null;
  const browse = () => { setPage("browse"); setActiveItem(null); setSidebarOpen(false); };
  const install = () => { setPage("installation"); setActiveItem(null); setSidebarOpen(false); };
  const selectItem = (item) => { setActiveItem(item); setPage("detail"); setSearchOpen(false); setSidebarOpen(false); };

  return <><header className="topbar"><button className="icon-btn" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><MenuIcon /></button><button className="topbar-brand-button" type="button" aria-label="Browse ThreeUI" onClick={browse}><BrandMark compact /></button><ThemeButtons compact theme={theme} onChange={setTheme} /></header>
    <div className="app"><Sidebar open={sidebarOpen} page={page} resources={resources} activeItem={activeItem} theme={theme} onTheme={setTheme} onBrowse={browse} onInstallation={install} onSelect={selectItem} onSearch={() => setSearchOpen(true)} />{sidebarOpen ? <button className="mobile-nav-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} /> : null}<section className="pane"><div className="pane-scroll scroll-area">{error ? <main className="state-page"><strong>Catalog unavailable</strong><span>{error}</span></main> : !catalog ? <main className="state-page"><span className="loading-bar" />Loading public catalog…</main> : page === "installation" ? <InstallationPage /> : page === "detail" && activeItem ? <DetailPage key={activeItem.id} item={activeItem} source={activeSource} onBrowse={browse} /> : <BrowsePage resources={resources} onSelect={selectItem} />}</div></section></div>
    <SearchDialog open={searchOpen} resources={resources} onClose={() => setSearchOpen(false)} onSelect={selectItem} /></>;
}
