# CLAUDE.md

## Git workflow

Always commit and merge directly on `main` for this project. Do not create
feature branches or open pull requests — commit straight to `main` and push.

---

## Project overview

**Unfurl** is an interactive force-directed graph visualization app. It renders network graphs (Les Misérables characters, Karate Club, Dolphins, etc.) with a custom physics engine and supports 2D/3D display modes, multiple force types, themes, and URL-encoded state sharing.

### Tech stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **D3.js 7** for SVG rendering and projections
- **Tailwind CSS 4** for styling
- **Radix UI** for headless primitives (Popover, Slider, Select, Switch, ScrollArea)
- **Phosphor Icons**, **Quicksand** variable font
- **Vitest** for testing, **ESLint** for linting
- **pnpm 11** as package manager, **Node 22** (via fnm)

### Scripts

```bash
pnpm dev              # Dev server (hot reload)
pnpm build            # typecheck + production build → dist/
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint
pnpm test             # Vitest (single run)
pnpm test:watch       # Vitest watch
pnpm test:coverage    # Vitest with v8 coverage
```

### Directory structure

```
src/
├── app.tsx                  # Root component — graph selection, physics config, theme, URL codec
├── main.tsx                 # React entry point
├── settings-codec.ts        # Bit-packing serialization of all app state → 20 base64url chars
├── index.css                # Global styles + Tailwind directives
│
├── data/                    # Pre-bundled graph datasets (JSON)
│   └── karate/dolphins/les-miserables/polbooks/adjnoun/football .json
│
├── graph/
│   ├── graph.ts             # Core types (Graph, Node, Link, AdjMatrix) + jsonToGraph
│   ├── algo.ts              # Floyd-Warshall all-pairs shortest paths
│   └── centrality.ts        # Degree + eigenvector centrality
│
├── math/
│   ├── vec2.ts / vec3.ts    # 2D/3D vector classes
│   ├── polar.ts             # Polar ↔ Cartesian conversions
│   ├── stats.ts             # clamp, lerp, normalize, etc.
│   └── curves.ts            # Curve functions (logistic, bezier, etc.)
│
├── simulation/
│   ├── physics.ts           # Physics engine: update(), addHeat(), force calculations
│   ├── physics-config.ts    # PhysicsConfig type + defaults
│   └── body.ts              # Body type (position, velocity, physics state)
│
├── spatial/
│   ├── quad-tree.ts         # Pool-backed QuadTree for O(n log n) repulsion
│   └── quad-box.ts          # QuadBox interface
│
├── rendering/
│   ├── d3-graphics.ts       # D3Graphics class: SVG nodes/edges, projection, drag, tooltip
│   └── animation-graphics.ts # Frame loop management
│
├── view/
│   ├── graph-view.tsx       # Main canvas component — initializes bodies, drives simulation+render
│   ├── control-panel.tsx    # All UI controls (sliders, toggles, dropdowns, themes)
│   └── scrub-slider.tsx     # Custom slider with snap tiers and fine control
│
└── events/
    └── pubsub.ts            # Pub/Sub event system for entity state changes
```

### Key architectural decisions

**Physics performance:** Quad-tree spatial indexing avoids O(n²) repulsion checks. The quad-tree is pool-backed — no heap allocation after the first frame.

**Force system:** Each force type (repulsion, attraction, spring, drift) is independently configurable with pluggable curve functions (linear, inverse, logistic, exponential, logarithmic) and enable/strength controls.

**Rendering:** D3 manages SVG directly (not via React). `graph-view.tsx` owns the canvas; `d3-graphics.ts` handles projection and DOM updates. 2D/3D share the same physics engine — only the projection function differs.

**State split:** App-level config lives in React `useState` (triggers re-renders for UI). Per-frame simulation state (positions, velocities) lives in `useRef` (never triggers re-renders).

**URL state:** `settings-codec.ts` bit-packs all settings into ~115 bits → 20 base64url chars. Versioned for forward compatibility.

**React patterns:** `GraphView` uses `forwardRef` + `useImperativeHandle` to expose `zoom()` and `addHeat()` to the parent. Heavy derived data (centrality, adjacency matrix) is `useMemo`'d on graph change.

**Themes:** 5 color palettes defined as CSS custom properties. Nodes colored by dataset group (up to 12 hues).

### CI/CD

GitHub Actions on push to `main` and all PRs: typecheck → lint → test (with coverage artifact) → build.
