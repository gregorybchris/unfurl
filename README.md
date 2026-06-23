# Unfurl

A force-directed graph visualization built with React, D3, and a custom physics
engine (vectors, polar math, a quad-tree, and an all-pairs shortest-path solver).

## Requirements

- Node.js `>= 20.19` (the repo pins **Node 22** via [`.node-version`](./.node-version))
- [pnpm](https://pnpm.io) (the version is pinned via the `packageManager` field)

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | Start the Vite dev server                   |
| `pnpm build`         | Type-check and build for production         |
| `pnpm preview`       | Preview the production build                |
| `pnpm typecheck`     | Run the TypeScript compiler (no emit)       |
| `pnpm lint`          | Run ESLint                                  |
| `pnpm test`          | Run the Vitest unit tests once              |
| `pnpm test:watch`    | Run Vitest in watch mode                    |
| `pnpm test:coverage` | Run the tests and produce a coverage report |

## Continuous integration

Every push and pull request against `main` runs typecheck, lint, tests (with
coverage), and a production build via [GitHub Actions](./.github/workflows/ci.yml).
