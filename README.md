# ThreeUI Community

A login-free edition of the ThreeUI product interface. It preserves the main project's non-Beta catalog structure, variant families, sidebar, browse grid, search, themes, documentation layout, and responsive navigation. Reviewed Community source is included; Pro remains media-only.

![ThreeUI Community preview](assets/preview.jpg)

## Public boundary

- Community: all non-Beta catalog entries remain visible. Reviewed source bundles are included under MIT when they have no Pro file overlap, bundled binary assets, private runtime URLs, environment dependencies, or private paths. Entries still awaiting that boundary remain preview-only.
- Pro: title, description, tags, poster URL, preview-video URL, and upgrade URL only.
- Authentication and commerce: not included.
- Catalog media: loaded from the verified live deployment at `https://threeui.com`; no media binaries are redistributed by this repository.
- Repository preview: `assets/preview.jpg` and `assets/preview.webm` document this open-source interface and are included under MIT.

The export is intentionally fail-closed. A Community source package is withheld when its implementation shares a file with Pro, embeds assets, reaches a runtime outside the narrow public allowlist, or lacks complete reviewable source; its public catalog metadata and variant previews can remain visible.

## Run locally

```bash
npm install
npm run dev
```

Build and run the publication boundary checks:

```bash
npm run build
```

## Data

- `public/data/catalog.json` contains public Community and media-only Pro metadata.
- `public/data/community-source.json` contains reviewed Community source bundles.
- `public/data/resource-report.json` explains how many Community source packages remain preview-only and why.

Catalog generation is an internal release operation. It requires a separately held private source snapshot through `THREEUI_SOURCE_ROOT`; ordinary contributors do not need that source to run or build this repository.

## License

Application and included Community source: MIT. External catalog media is not part of this repository or the MIT grant; see `ASSET-LICENSES.md`.
