# Cornerstone Implementation Playbook (v 1.0)

## 1.1 Repository Layout (monorepo)

```
cornerstone/
├── backend/                  # FastAPI 0.113, Python 3.12
│   ├── app/
│   │   ├── core/             # game logic, seed generator, hint engine
│   │   ├── api/              # REST + WebSocket routers
│   │   ├── models/           # Pydantic DTOs & ORM models
│   │   ├── db/               # SQLAlchemy, Alembic migrations
│   │   └── tests/
│   └── Dockerfile
├── frontend/                 # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── tests/
│   └── vite.config.ts
├── shared/                   # code common to both stacks (e.g., constants, schemas)
├── .github/
│   ├── workflows/            # CI/CD
│   └── ISSUE_TEMPLATE/
├── infra/                    # Terraform + GitHub Actions CD manifests
├── docs/
│   ├── ARCHITECTURE_OVERVIEW.md   ← <‑‑ copy this playbook here
│   ├── PATH_CACHE_README.md       # explains pre‑computed Hamiltonian paths
│   └── external/                  # pinned word lists, API specs (with SHA‑256)
└── AGENT_TODO/                # one markdown file per GitHub issue
```

## 1.2 Core Tech Decisions

| Layer                       | Choice                                                                        | Rationale                                                          |
| --------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Backend**                 | FastAPI + SQLAlchemy                                                          | Async friendly; automatic OpenAPI spec → strongly typed TS client. |
| **DB**                      | Postgres (dev via Docker) → Aurora Serverless (prod)                          | JSONB support for daily puzzle payload; bump‑free scaling.         |
| **Frontend**                | React 19, Vite, Zustand state                                                 | Modern build times; Zustand lightweight vs Redux.                  |
| **Real‑time**               | WebSocket route `/ws/puzzle/<id>` for leaderboard & player progress.          |                                                                    |
| **Container orchestration** | ECS Fargate (Terraform)                                                       | Simpler than k8s; cheap idle scaling.                              |
| **Testing**                 | PyTest + Hypothesis; Jest + Playwright.                                       |                                                                    |
| **Lint/Format**             | Ruff + Black for Python; ESLint + Prettier for TS.                            |                                                                    |
| **Code Quality Gates**      | ≥ 90 % line coverage; cyclomatic complexity < 15; no `eslint --max-warnings`. |                                                                    |

## 1.3 Game‑Logic Modules (backend/app/core)

| Module      | Responsibility                                                                   |
| ----------- | -------------------------------------------------------------------------------- |
| `grid.py`   | Board model, neighbour lookup (diagonals included), cross‑grid constants.        |
| `paths.py`  | Pre‑compute & load Hamiltonian paths; expose `sample_path(seed_word, date)`.     |
| `seed.py`   | Embed letters along chosen path; deterministic via SHA‑256 RNG.                  |
| `solver.py` | DFS with trie‑pruning; returns `(word, path)` tuples for required & bonus words. |
| `hints.py`  | Hint‑tier FSM (definitions → lengths → alpha), hint credit spend.                |
| `scores.py` | Word‑length scoring, progress % and perk unlock thresholds.                      |

## 1.4 AI‑Agent Best Practices (repo‑wide)

1. **AGENT\_TODO Template** – every issue *must* include:
   *Goal • Success Criteria • Backend Tasks • Frontend Tasks (if any) • Integration Notes • Functional Test Example*.
2. **Red‑Green TDD** – write failing tests first; CI blocks merges on red tests or coverage regressions.
3. **One concern per PR** – stay ≤ 400 changed lines; larger diffs require maintainer approval.
4. **Commit style** – `<scope>: <imperative>`, e.g., `backend: add dfs solver`.
5. **Pre‑commit enforced** – Ruff, Black, isort, ESLint, Prettier.
6. **No `--no‑verify`** – Dangerfile fails the pipeline when detected.
7. **Pinned externals only** – word lists, API schemas, JS deps with exact versions (`pnpm-lock.yaml` committed).
8. **Self‑review checklist** – agents must answer in PR: "✅ I ran all tests locally", "✅ No TODO/FIXME left".

## 1.5 Milestone Road‑map (issue titles abridged)

| Sprint | Key Issues                                                                        |
| ------ | --------------------------------------------------------------------------------- |
| **0**  | Init monorepo, docker‑compose, CI, lint hooks.                                    |
| **1**  | Path cache builder · Keystone word embedding via Hamiltonian path · Solver with trie. |
| **2**  | REST endpoints: `/puzzle/today`, `/submit-word`, `/spend-credit`, JWT auth.       |
| **3**  | React grid renderer + drag logic · Keyboard entry · Grey‑out effect · Hint UI.    |
| **4**  | Player stats & streaks · Leaderboard via WebSocket.                               |
| **5**  | Terraform infra · Blue‑green deploy · Sentry observability.                       |
| **6**  | PWA polish · A11y audit · Marketing landing.                                      |