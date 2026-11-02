# LinkPocket web

The Next.js web app for LinkPocket, a calm personal library for the links you want to keep:
the user app at `/` and the admin area at `/admin`. It talks to the API in its own project
next to it, `lp/api`, through a same-origin rewrite of `/api/v1` (ADR-0002, ADR-0010).

Colours and theme tokens: [docs/DESIGN.md](docs/DESIGN.md). Requirements, ADRs, runbooks and
the traceability matrix live in the api project
under `docs/`.

## Layout

| Path          | What                                                            |
| ------------- | --------------------------------------------------------------- |
| `app/`        | App Router pages                                                |
| `components/` | UI, library, account and admin components                       |
| `lib/`        | API client, session, helpers (unit tested)                      |
| `shared/`     | Zod schemas, types, limits and error codes (copied from ../api) |
| `e2e/`        | Playwright E2E and axe accessibility tests                      |
| `proxy.ts`    | Sign-in redirect and the per-request nonce CSP                  |

## Requirements

Node 24 (`.nvmrc`) and pnpm 12 (`packageManager` in `package.json`).

## Commands

```bash
pnpm install
```

```bash
pnpm check
```

`pnpm check` runs Prettier, ESLint, TypeScript and the unit tests with coverage, the same
steps as CI.

### Run locally

Start the API first (see its README), then copy `.env.example` to `.env.local` and set
`API_INTERNAL_URL` (default `http://localhost:4000`):

```bash
pnpm dev
```

### End-to-end tests

The Playwright suite starts the real API with an in-memory database, so the api project must
be next to this one (`../api`) with its dependencies installed, or
pointed to with `LINKPOCKET_API_DIR`:

```bash
pnpm exec playwright install chromium
```

```bash
pnpm e2e
```

## Shared code

`shared/` is a copy of `../api/src/shared/` (relative imports here have no `.js`
extension). Change both in the same way; the API ships first.

## Secrets

Only `.env.example` with placeholders is committed. Real values live in `.env.local`
(git-ignored) and in Vercel's environment variables (NFR-S13).

## Releases

A green CI run on `main` deploys to staging on Vercel, then waits for approval before
production. Setup and checks: `docs/runbooks/deployment.md` in the api project.
