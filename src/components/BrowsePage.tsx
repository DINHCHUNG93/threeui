import { useMemo, useState, type CSSProperties } from "react";
import {
  CATALOG_RESULTS,
  catalogResultId,
  catalogResultLabel,
  catalogResultMatchesQuery,
  createCatalogResults,
} from "../data/catalogResults";
import type { ReadyShader } from "../data/shaders";
import { shaderRoutePath } from "../routes.js";
import { RECENT_SHADERS } from "./Sidebar";
import { SearchIcon } from "./icons";

type BrowsePageProps = {
  onSelect: (id: ReadyShader["id"], variantId?: string) => void;
};

const MAX_VISIBLE_TAGS = 3;

const BROWSE_CATEGORIES = [
  "Landing Pages",
  "Hero",
  "Three.js",
  "Backgrounds",
  "Buttons",
  "Text Animation",
  "UI Elements",
  "CSS",
  "Motion Design",
  "Sections",
] as const satisfies readonly ReadyShader["category"][];

export const SITE_TITLE = "Procedural Three.js web design templates for agents";
export const SITE_DESCRIPTION = "Fully customizable. Copyable as prompts.";

const RECENT_SHADER_IDS = new Set<ReadyShader["id"]>(RECENT_SHADERS.map((shader) => shader.id));
const BROWSE_RESULTS = [
  ...createCatalogResults(RECENT_SHADERS),
  ...CATALOG_RESULTS.filter(({ shader }) => !RECENT_SHADER_IDS.has(shader.id)),
];

export function BrowsePage({ onSelect }: BrowsePageProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ReadyShader["category"] | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const filteredResults = useMemo(
    () => BROWSE_RESULTS.filter((result) => (
      (!activeCategory || result.shader.category === activeCategory)
      && catalogResultMatchesQuery(result, query)
    )),
    [activeCategory, query],
  );

  const beginPreview = (id: string) => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setActivePreview(id);
  };

  return (
    <main className="browse-page" aria-labelledby="browse-title">
      <header className="browse-header">
        <div className="browse-heading-row">
          <div>
            <h1 id="browse-title">{SITE_TITLE}</h1>
            <p className="lede">{SITE_DESCRIPTION}</p>
          </div>
          <label className="browse-filter">
            <SearchIcon />
            <input
              type="search"
              value={query}
              placeholder={`Search ${BROWSE_RESULTS.length} components`}
              aria-label={`Search ${BROWSE_RESULTS.length} components`}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setQuery(event.target.value);
                setActivePreview(null);
              }}
            />
          </label>
        </div>
        <div className="browse-category-filters" role="group" aria-label="Filter components by category">
          {BROWSE_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                type="button"
                key={category}
                aria-pressed={isActive}
                title={isActive ? "Show all categories" : `Filter by ${category}`}
                onClick={() => {
                  setActiveCategory(isActive ? null : category);
                  setActivePreview(null);
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </header>

      {filteredResults.length ? (
        <div className="browse-grid">
          {filteredResults.map(({ shader, variant }, index) => {
            const result = { shader, variant };
            const resultId = catalogResultId(result);
            const label = catalogResultLabel(result);
            const thumbnail = variant?.thumbnail ?? shader.thumbnail;
            const preview = (
              variant?.preview ?? ("preview" in shader && typeof shader.preview === "string"
                ? shader.preview
                : undefined)
            ) ?? `/previews/${shader.id}.webm`;
            return (
              <article className="browse-item" key={resultId} style={{ "--browse-index": index } as CSSProperties}>
                <a
                  className="browse-item-link"
                  href={shaderRoutePath(shader, variant?.id)}
                  aria-label={`${label}. ${shader.tags.slice(0, MAX_VISIBLE_TAGS).join(", ")}. Community component.`}
                  onPointerEnter={() => beginPreview(resultId)}
                  onPointerLeave={() => setActivePreview(null)}
                  onFocus={() => beginPreview(resultId)}
                  onBlur={() => setActivePreview(null)}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onSelect(shader.id, variant?.id);
                  }}
                >
                  <span className="browse-media" aria-hidden="true">
                    <img src={thumbnail} alt="" width="640" height="360" loading={index < 6 ? "eager" : "lazy"} decoding="async" />
                    {activePreview === resultId ? (
                      <video
                        src={preview}
                        poster={thumbnail}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        tabIndex={-1}
                        onLoadedData={(event) => {
                          event.currentTarget.dataset.ready = "true";
                          void event.currentTarget.play().catch(() => undefined);
                        }}
                      />
                    ) : null}
                  </span>
                  <span className="browse-details">
                    <span className="browse-title-row">
                      <strong>{label}</strong>
                    </span>
                    <span className="browse-tags" aria-label="Tags">
                      {shader.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => <span key={tag}>{tag}</span>)}
                    </span>
                  </span>
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="browse-empty" role="status">
          <strong>{query ? `No components match “${query}”.` : "No components match this category."}</strong>
          <span>Try another title, tag, category, or technology.</span>
        </div>
      )}
    </main>
  );
}
