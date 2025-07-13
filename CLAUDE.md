# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NGX Pulse is an AI-powered health and wellness platform with a React/TypeScript frontend and FastAPI/Python backend, using Supabase for database and authentication.

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
make test
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler checks
```

### Backend Commands
```bash
cd backend
uvicorn app.main:app --reload --port 8000  # Start API server
pytest                                       # Run tests
```

## Architecture Overview

### Frontend Architecture
- **Pages** (`frontend/src/pages/`): 15+ pages including Dashboard, Profile, Health metrics, etc.
- **Components** (`frontend/src/components/`): Reusable UI components built with shadcn/ui
- **API Client** (`frontend/src/utils/apiClient.ts`): Centralized API communication with automatic token handling
- **Auth** (`frontend/src/utils/auth.ts`): Supabase authentication wrapper
- **State Management**: Zustand stores in `frontend/src/store/`
- **Routing**: React Router v6 with protected routes in `frontend/src/App.tsx`

### Backend Architecture
- **API Routes** (`backend/app/apis/`): 30+ endpoints organized by feature (auth, users, health_data, etc.)
- **Services** (`backend/app/services/`): Business logic layer
- **Auth Middleware** (`backend/app/auth/`): JWT validation and Supabase integration
- **Main Router** (`backend/app/main.py`): FastAPI application entry point with CORS and route mounting

### Key Integration Points
1. **API Proxy**: Frontend proxies `/api/*` and `/routes/*` to backend via Vite config
2. **Authentication Flow**: 
   - Frontend uses Supabase client for auth
   - Backend validates Supabase JWT tokens
   - API client automatically includes auth headers
3. **Real-time Updates**: Supabase subscriptions for live data updates
4. **AI Features**: OpenAI integration in backend services

## Development Guidelines

### Environment Setup
1. Copy `.env.example` files in both frontend and backend directories
2. Required environment variables:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (frontend)
   - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (backend)
   - `OPENAI_API_KEY` (backend, for AI features)

### API Development
- API documentation auto-generated at http://localhost:8000/docs
- All endpoints require authentication except `/auth/login` and `/auth/register`
- Use Pydantic models for request/response validation
- Follow RESTful conventions established in existing endpoints

### Frontend Development
- Use existing components from `frontend/src/components/ui/` (shadcn/ui)
- Follow the established page structure with loading states and error handling
- Use the apiClient for all API calls - it handles auth and error responses
- TypeScript is configured in non-strict mode but aim for type safety

### Database Schema
- Supabase manages the database schema
- Row-level security (RLS) policies enforce data isolation
- Key tables: users, health_data, goals, activities, meals, sleep_data, etc.

## Common Tasks

### Adding a New API Endpoint
1. Create route in `backend/app/apis/` following existing patterns
2. Add route to router in the module's `__init__.py`
3. Import and include router in `backend/app/main.py`
4. Frontend will auto-generate types after API changes

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Update navigation in `frontend/src/components/DashboardLayout.tsx` if needed
4. Use existing page patterns for consistency (loading states, error handling)

### Debugging Authentication Issues
1. Check Supabase dashboard for user status
2. Verify environment variables are set correctly
3. Check browser console for auth errors
4. Backend logs will show JWT validation errors
5. Use the `/auth/check` endpoint to verify token validity

## Important Notes
- The project uses both npm and yarn (prefer npm as per package-lock.json)
- TypeScript strict mode is disabled - be cautious with type assumptions
- API client automatically handles token refresh and auth errors
- Supabase RLS policies must be considered when debugging data access issues
- The `brain` directory contains auto-generated API types - do not edit directly