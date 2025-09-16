# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` — Vite + React + TypeScript + Tailwind. Key folders: `src/components`, `src/pages`, `src/__tests__`, `public/`. Entry HTML: `frontend/index.html`.
- `backend/` — FastAPI app. Entry: `backend/main.py`. API routers live under `backend/app/apis/<feature>/__init__.py` and must export an `APIRouter` named `router`. Shared middleware is in `backend/app/middleware/`.
- `tests/` — Python `pytest` tests for the backend (e.g., `tests/test_main.py`).
- `docs/`, `scripts/` — project docs and helper scripts. See `Makefile` for common tasks.
- `PROJECT_STATUS.md` — **Estado BETA Ready** con lint 100% limpio y métricas de calidad actualizadas (20 sept 2025).

## Build, Test, and Development Commands
- Root helpers (recommended):
  - `make install` — install backend and frontend.
  - `make run-backend` — start FastAPI dev server (`uvicorn main:app --reload`).
  - `make run-frontend` — start Vite dev server (http://localhost:5173).
  - `make test` — run backend `pytest` suite.
  - `make check-env` — quick sanity check for required `.env` values.
- Frontend (Yarn via Corepack): `yarn dev`, `yarn build`, `yarn preview`, `yarn lint`, `yarn type-check`, `yarn test`, `yarn test:coverage`.
- Backend: `source backend/.venv/bin/activate && uvicorn main:app --reload`; tests with `pytest` from repo root or `backend/`.

## Coding Style & Naming Conventions
- Frontend: TypeScript, 2‑space indent. ESLint is configured (`frontend/.eslintrc.json`).
  - Components: PascalCase files (e.g., `ThemeToggle.tsx`) in `src/components/`.
  - Hooks: `useX` naming (e.g., `useTheme`). Constants in `src/constants.ts`.
- Backend: Follow PEP 8 with type hints where practical; 4‑space indent.
  - Modules/functions: `snake_case`; classes: `CamelCase`. Routers export `router`.

## Testing Guidelines
- Frontend: Vitest + Testing Library. Place tests in `src/__tests__/` with `*.test.tsx|*.test.ts`. Run `yarn test` or `yarn test:coverage`.
- Backend: Pytest in `tests/`. Add unit tests for new endpoints/middleware. Run `make test`.
- ESLint: `npx eslint . --ext ts,tsx` **LIMPIO** ✅ (0 warnings / 0 errors) - Ver [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) para métricas completas.

## Commit & Pull Request Guidelines
- Commit messages: concise, imperative. Prefer Conventional Commits when possible (e.g., `feat(dashboard): add KPIs`). Emojis are optional.
- PRs: include description, linked issues, steps to test, and screenshots/GIFs for UI changes. Ensure CI basics pass locally: `yarn lint`, `yarn type-check`, `yarn test`, `make test`, and `make check-env`.

## Security & Configuration Tips
- Never commit secrets. Copy `frontend/.env.example` → `frontend/.env` and `backend/.env.example` → `backend/.env`.
- Backend CORS/hosts: set `ALLOWED_ORIGINS` and `TRUSTED_HOSTS` appropriately for deployments.
