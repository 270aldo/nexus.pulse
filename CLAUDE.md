# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated: December 30, 2025**

## Project Overview

NGX Pulse is an AI-powered health and wellness platform with a React/TypeScript frontend and FastAPI/Python backend, using Supabase for database and authentication.

### Current Status: BETA Ready
- **ESLint**: 100% clean (0 warnings, 0 errors)
- **TypeScript**: Strict typing, no `any` types
- **Logging**: Centralized system via `logger.ts`, no `console.*` calls
- **CI/CD**: GitHub Actions pipeline configured

## Essential Commands

### Development
```bash
# Install all dependencies (frontend + backend)
make install

# Run frontend development server (port 5173)
make run-frontend

# Run backend API server (port 8000)
make run-backend

# Run tests
make test           # Backend pytest
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint (must pass with 0 warnings)
npm run type-check   # Run TypeScript compiler checks
```

### Backend Commands
```bash
cd backend
uvicorn main:app --reload --port 8000  # Start API server
pytest                                  # Run tests
```

### Demo/Staging Mode
```bash
export STAGING_DEMO_MODE=true
make run-backend  # Loads mock data from backend/mock_data/
```

## Architecture Overview

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18.2, TypeScript, Vite 4.5, Tailwind CSS |
| Backend | FastAPI, Python 3.11+, Pydantic |
| Database | Supabase (PostgreSQL with RLS) |
| State | Zustand, React Query |
| UI | shadcn/ui (47 components), Radix primitives |
| Charts | Recharts |

### Frontend Structure
```
frontend/src/
├── pages/              # 16 application pages
│   ├── App.tsx
│   ├── DashboardPage.tsx
│   ├── ChatPage.tsx
│   ├── AuthPage.tsx
│   └── ...
├── components/         # 32 custom components + ui/
│   ├── ui/            # 47 shadcn/ui components
│   ├── AnalyticsTab.tsx
│   ├── ReportsTab.tsx
│   ├── SparklineChart.tsx
│   └── ...
├── hooks/             # Custom React hooks
│   ├── useSidebar.tsx
│   └── useTheme.tsx
├── utils/             # Utilities and API client
│   ├── apiClient.ts   # Centralized API communication
│   ├── auth.ts        # Supabase auth wrapper
│   ├── logger.ts      # Centralized logging
│   ├── demoClient.ts  # Demo mode utilities
│   └── useAuthStore.ts # Zustand auth store
├── config/            # Configuration files
├── constants/         # App constants
└── styles/            # CSS and design tokens
```

**Key Files:**
- `frontend/src/utils/apiClient.ts` - API client with auth headers and error handling
- `frontend/src/utils/auth.ts` - Supabase authentication wrapper
- `frontend/src/utils/logger.ts` - Centralized logging (use instead of console.*)
- `frontend/src/utils/useAuthStore.ts` - Zustand store for auth state
- `frontend/src/AppRoutes.tsx` - React Router v6 route definitions

### Backend Structure
```
backend/
├── main.py                 # FastAPI app factory and middleware setup
├── app/
│   ├── apis/              # API route modules
│   │   ├── ai_coach_messages_api/
│   │   ├── chat/
│   │   ├── demo/          # Demo endpoints (STAGING_DEMO_MODE only)
│   │   └── health_data/
│   ├── auth/              # JWT validation and Supabase integration
│   ├── middleware/        # Security middleware stack
│   │   ├── error_handler.py
│   │   ├── rate_limiter.py
│   │   └── security_headers.py
│   └── demo_data.py       # Demo mode data loader
├── mock_data/             # Demo/staging mock data
├── requirements.txt
└── routers.json           # Router configuration (auth settings)
```

**Key Files:**
- `backend/main.py` - App factory with middleware configuration
- `backend/app/middleware/` - Security stack (CORS, rate limiting, headers)
- `backend/routers.json` - Per-router auth configuration

### Middleware Stack
The backend applies these middleware in order:
1. `RateLimitingMiddleware` - Request rate limiting
2. `SecurityHeadersMiddleware` - Security headers
3. `CORSSecurityMiddleware` - CORS configuration
4. `InputSanitizationMiddleware` - Input validation
5. `GlobalErrorHandler` - Error handling

## Development Guidelines

### Environment Setup
1. Copy `.env.example` files in both frontend and backend directories
2. Required environment variables:

**Frontend (.env)**
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

**Backend (.env)**
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET_KEY=your_jwt_secret
```

### Code Quality Standards

**Frontend:**
- Use TypeScript with strict types - no `any` types allowed
- Use `logger.ts` for all logging - never use `console.*`
- All components use the `@/components/ui/` path alias for shadcn/ui
- ESLint must pass with 0 warnings: `npm run lint`
- Follow existing patterns for pages (loading states, error handling)

**Backend:**
- Follow PEP 8 with type hints
- Use Pydantic models for request/response validation
- All endpoints require authentication unless explicitly disabled in `routers.json`
- API routers export an `APIRouter` named `router`

### API Development
- API documentation: http://localhost:8000/docs
- All endpoints require authentication except `/auth/login` and `/auth/register`
- Frontend proxies `/api/*` and `/routes/*` to backend via Vite config

### Authentication Flow
1. Frontend uses Supabase client for auth
2. Backend validates Supabase JWT tokens
3. API client (`apiClient.ts`) automatically includes auth headers

## Common Tasks

### Adding a New API Endpoint
1. Create module in `backend/app/apis/<feature>/`
2. Create `__init__.py` with `router = APIRouter()`
3. Router is auto-discovered and mounted at `/routes/<feature>/`
4. Configure auth in `routers.json` if needed

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/AppRoutes.tsx`
3. Update navigation in sidebar if needed
4. Use existing page patterns (loading states, error boundaries)

### Adding a New Component
1. Create in `frontend/src/components/`
2. Use PascalCase naming (e.g., `MetricCard.tsx`)
3. Import UI primitives from `@/components/ui/`
4. Use `logger` from `@/utils/logger` for debugging

## Testing

### Frontend Testing
- Framework: Vitest + React Testing Library
- Test files: `src/__tests__/*.test.tsx`
- Run: `npm test` or `yarn test`

### Backend Testing
- Framework: pytest
- Test files: `tests/test_*.py`
- Run: `make test` or `pytest`

### CI/CD Pipeline
GitHub Actions runs on push to `main`/`develop`:
1. Frontend lint (`npm run lint`)
2. Frontend build (`npm run build`)
3. Backend dependency install
4. Environment check (`make check-env`)
5. Backend tests (`make test`)

## Key Features

### Dashboard System
- Multi-tab: Summary, Analytics, Reports, Notifications
- Sparkline charts for KPI metrics
- PDF report generation with jsPDF
- Real-time data via Supabase subscriptions

### AI Coach
- OpenAI integration for personalized recommendations
- Chat interface at `/chat`
- Demo mode provides mock responses

### Health Tracking
- Biometric logging (sleep, HRV, weight, mood, stress)
- Nutrition tracking
- Training logs
- Wellness check-ins

## Troubleshooting

### Common Issues

**Frontend not starting:**
```bash
rm -rf node_modules/.vite
npm install
```

**ESLint errors:**
```bash
npm run lint -- --fix
```

**Backend import errors:**
- Ensure you're running from the `backend/` directory
- Check `requirements.txt` is installed

**Auth issues:**
1. Verify `.env` files exist and have valid values
2. Check Supabase dashboard for user status
3. Use `/auth/check` endpoint to verify token validity
4. Check browser console and backend logs

### Environment Check
```bash
make check-env  # Validates all required env vars
```

## Project Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview and quick start |
| `CLAUDE.md` | AI assistant guidance (this file) |
| `AGENTS.md` | Condensed guidelines for AI agents |
| `PROJECT_STATUS.md` | BETA status and quality metrics |
| `SECURITY.md` | Security policy and guidelines |
| `INSTALL.md` | Detailed installation guide |
| `docs/` | Architecture, testing, and integration docs |

## Important Notes

- The project uses npm (package-lock.json present)
- TypeScript is configured with strict typing enabled
- API client automatically handles token refresh and errors
- Supabase RLS policies enforce data isolation
- Demo mode (`STAGING_DEMO_MODE=true`) loads mock data for testing
- The `brain/` directory contains auto-generated types - do not edit directly

## Quick Reference

### File Counts
- TypeScript/React files: 181
- Pages: 16
- Custom components: 32
- UI components (shadcn): 47
- Backend API modules: 4

### Ports
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Key Dependencies
- React 18.2, React Router 6
- Vite 4.5, TypeScript 5.2
- FastAPI, Pydantic
- Supabase JS 2.38
- Zustand 4.4, React Query 5.8
- Tailwind CSS 3.3, shadcn/ui

---

*For detailed project status and roadmap, see `PROJECT_STATUS.md`*
*For security guidelines, see `SECURITY.md`*
