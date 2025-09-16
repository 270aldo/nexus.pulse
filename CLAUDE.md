# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated: September 20, 2025**

## Project Overview

NGX Pulse is an AI-powered health and wellness platform with a React/TypeScript frontend and FastAPI/Python backend, using Supabase for database and authentication.

## 🆕 Recent Changes

### September 20, 2025 - Código BETA Ready - ESLint 100% Limpio 🚀
#### Highlights
- **ESLint 100% limpio** ✅ – `npx eslint . --ext ts,tsx` → **0 warnings, 0 errors**
- **TypeScript estricto** – Eliminación total de `any`, tipos concretos en todo el código
- **Sin console.*** – Migración completa a sistema de logging centralizado (`logger.ts`)
- **Refactor frontend completo** – Chat, notificaciones, dashboards y hooks con logger central
- **Utilidades demo tipadas** – `demoClient` y `demoAIService` con TypeScript estricto
- **Status tracking** – Nuevo `PROJECT_STATUS.md` con métricas de calidad y roadmap detallado

#### Documentación Actualizada
- **`PROJECT_STATUS.md`** – Estado completo BETA Ready con métricas de calidad
- **`README.md`** – Actualizado con estado actual del lint limpio y referencias
- **`AGENTS.md`** – Refleja el lint limpio y referencia a PROJECT_STATUS.md
### September 15, 2025 - Strategic Decision & Documentation 🎯
#### Major Decisions
- **NO MIGRATION TO MONOREPO**: Decision to complete NGX Pulse standalone first (75% complete)
- **Strategy**: "Ship Fast, Integrate Smart" - Launch in 2-3 weeks, then integrate as microservice
- **Created NGX Design System**: Comprehensive design documentation for all NGX apps
- **Migration Analysis**: Professional assessment recommending against immediate migration (⚠️ documento `NGX_PULSE_MIGRATION_ANALYSIS.md` pendiente de versión final en repositorio)

#### Documentation Created
- `NGX_DESIGN_SYSTEM.md` - Complete UI/UX standardization guide
- `NGX_PULSE_MIGRATION_ANALYSIS.md` - Strategic migration assessment *(pendiente de incorporarse al repositorio; conservar borrador fuera de código hasta publicarlo)*

### August 22, 2025 - Phase 1: Critical Security & Stabilization ✅
#### Security Improvements
- **Protected credentials**: Created .env.example files, updated .gitignore, documented in SECURITY.md
- **Zero vulnerabilities**: Updated Vite 4.5.0 → 6.3.5, resolved esbuild vulnerability
- **Backend security**: Integrated CORS, Rate Limiting, Security Headers, Error Handling middleware
- **FastAPI middleware**: All security middleware now active and configured

#### Code Quality
- **Eliminated duplicates**: Removed DashboardPage 2/3, ProgramWizard 2, HamburgerButton 2, etc.
- **UI consolidation**: 47 shadcn/ui components consolidated to single location
- **Cleaned structure**: Removed `/src/extensions/` folder completely
- **Import consistency**: All UI imports now use `@/components/ui/` convention

#### Infrastructure
- **Frontend**: Running on http://localhost:5173 (Vite 6.3.5)
- **Backend**: Protected with comprehensive middleware stack
- **Dependencies**: All packages updated to latest stable versions
- **TypeScript**: Compiling without errors (strict mode still disabled)

### August 22, 2025 - Initial Cleanup
- **Removed 312MB** of duplicate files and folders
- **Eliminated all duplicate directories**: `src 2`, `node_modules 2`, `dist 2`, `public 2`, `docs 2`
- **Reorganized project structure** for better maintainability
- **Fixed all import paths** and CSS references
- **Frontend is now fully functional** at http://localhost:5173

## Essential Commands

### Development
```bash
# Install all dependencies (frontend + backend)
make install

# Run frontend development server (port 5173)
make run-frontend

# Run backend API server (port 8000)
make run-backend

# Run backend tests (pytest). Complement with `yarn test` hasta ampliar la suite.
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

### Frontend Architecture (Updated Structure)
```
frontend/src/
├── pages/                    # Application pages (18 pages)
├── components/               # UI components (37+ components)
├── hooks/                    # Custom React hooks
├── utils/                    # Utility functions and API client
├── styles/                   # CSS files and design system
├── shared/                   # Shared resources (future migration target)
│   ├── components/
│   ├── hooks/
│   └── utils/
├── features/                 # Feature-based organization (future)
├── services/                 # API services (future)
└── config/                   # Configuration files
```

**Key Files:**
- **Pages** (`frontend/src/pages/`): 18 pages including Dashboard, Profile, Health metrics, etc.
- **Components** (`frontend/src/components/`): Reusable UI components built with shadcn/ui
- **API Client** (`frontend/src/utils/apiClient.ts`): Centralized API communication with automatic token handling
- **Auth** (`frontend/src/utils/auth.ts`): Supabase authentication wrapper
- **State Management**: Zustand stores in `frontend/src/store/`
- **Routing**: React Router v6 with protected routes in `frontend/src/App.tsx`

### Dashboard System
- **Multi-tab Dashboard**: Resumen, Analíticas, Reportes, Notificaciones
- **Sparkline Charts**: Real-time mini-charts for KPI metrics (sleep, HRV, steps)
- **Advanced Analytics**: Time-series analysis with Recharts integration
- **PDF Report Generation**: Automated health reports with jsPDF
- **Notification Center**: Comprehensive alert system with categorization

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
- **Sparkline Integration**: Use MetricSparkline component for mini-charts
- **Theme System**: Dark/light mode support with ThemeProvider
- **Responsive Design**: Mobile-first approach with Tailwind CSS

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

## Useful Commands & Scripts

### Maintenance Commands
```bash
# Clean install (removes node_modules and reinstalls)
rm -rf node_modules package-lock.json && npm install

# Check for duplicate files/folders
find . -name "*2" -o -name "* 2" | head -20

# Check project size
du -sh frontend/

# Find specific files
find . -name "*.tsx" -o -name "*.ts" | wc -l

# Build for production
npm run build

# Preview production build
npm run preview
```

### Troubleshooting
```bash
# If CSS imports fail
# Ensure all CSS files are in src/styles/

# If imports fail after reorganization
# Check that files exist in both old and new locations temporarily

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📋 Phase 2 Roadmap: Architecture & Testing (In Progress)

### Planned Tasks (Week of Aug 23-30, 2025)
1. **Backend Architecture**
   - [ ] Implement connection pooling for Supabase
   - [ ] Create service layer pattern
   - [ ] Implement Repository pattern for data access
   - [ ] Add async/await to all DB operations

2. **Testing Framework**
   - [ ] Configure Vitest for frontend unit tests
   - [ ] Setup React Testing Library
   - [ ] Configure Playwright for E2E tests
   - [ ] Create initial test suite (target: 30% coverage)

3. **TypeScript Improvements**
   - [ ] Enable strict mode gradually
   - [ ] Fix ~400 type errors
   - [ ] Remove all `any` types
   - [ ] Add proper type definitions

4. **Code Refactoring**
   - [ ] Break down large files (>800 lines)
   - [ ] Extract business logic to custom hooks
   - [ ] Implement proper error boundaries
   - [ ] Add React.memo where needed

## 📚 Documentación Clave del Proyecto

### Documentos Estratégicos (Septiembre 2025)
- **[NGX_DESIGN_SYSTEM.md](../NGX_DESIGN_SYSTEM.md)** - Sistema de diseño unificado para todas las apps NGX
- **[NGX_PULSE_MIGRATION_ANALYSIS.md](../NGX_PULSE_MIGRATION_ANALYSIS.md)** - Análisis completo de migración con recomendaciones

### Estado del Proyecto (2025-09-15)
- **Completitud**: 75% funcional
- **Archivos**: 7,041 archivos TypeScript/React
- **Frontend**: 90% completo con dashboard operacional
- **Backend**: 30+ endpoints FastAPI funcionando
- **Database**: Supabase configurado y operacional
- **Timeline para producción**: 2-3 semanas

### Decisiones Clave
1. **NO MIGRAR al monorepo NGX_Ecosystem_Beta ahora**
2. **Completar NGX Pulse standalone primero**
3. **Integrar como microservicio después del launch**
4. **Mantener DB Supabase separada temporalmente**

## Important Notes
- The project uses npm (package-lock.json present)
- TypeScript strict mode is disabled - be cautious with type assumptions
- API client automatically handles token refresh and auth errors
- Supabase RLS policies must be considered when debugging data access issues
- The `brain` directory contains auto-generated API types - do not edit directly
- **After Phase 1 (Aug 22)**: Zero vulnerabilities, cleaned duplicates, secured backend

## Recent Updates (Phase 2 - Dashboard Enhancement)

### Completed Features
1. **Enhanced Sidebar Navigation**:
   - Improved active state with vertical bar + glow effect
   - Static gradient background (from-violet-500/20 via-violet-600/15 to-transparent)
   - Optimized transitions (250ms ease-out)

2. **Dashboard Tab System**:
   - **Analytics Tab**: Advanced charts with time-range filters, metric selection, CSV export
   - **Reports Tab**: PDF generation with jsPDF, custom templates, report history
   - **Notifications Tab**: Comprehensive alert center with categorization and settings

3. **Sparkline Charts**:
   - Real-time mini-charts for KPI metrics (sleep, HRV, steps, weight, mood, stress)
   - Empty state handling with graceful fallbacks
   - Smooth animations and micro-interactions

### Key Dependencies Added
- `jspdf` & `jspdf-autotable`: PDF report generation
- `recharts`: Advanced charting library
- Enhanced UI components for tabs, selects, and switches

### Usage Examples
```typescript
// Sparkline integration
<MetricSparkline
  metricType="sleep"
  data={sparklineData}
  height={20}
/>

// PDF report generation
const generatePDFReport = async () => {
  const pdf = new jsPDF();
  // ... report generation logic
  pdf.save('health-report.pdf');
};
```

---

## 🚨 ESTADO ACTUAL DEL PROYECTO - AUDITORÍA 2025-09-15

### Puntuación Global: 7.5/10 ⬆️ (Mejorado desde 6.8/10)
**Veredicto**: Proyecto 75% completo, listo para finalización en 2-3 semanas

### 📊 DECISIÓN ESTRATÉGICA CLAVE (2025-09-15)
**NO MIGRAR AL MONOREPO AHORA** - Completar NGX Pulse standalone primero
- **Razón**: 7,041 archivos funcionales vs monorepo vacío en `apps/pulse/`
- **Estrategia**: "Ship Fast, Integrate Smart"
- **Timeline**: 2-3 semanas para producción vs 8-10 semanas si se migra
- **Detalles completos**: Ver `NGX_PULSE_MIGRATION_ANALYSIS.md`

### 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

#### 1. **SEGURIDAD - MÁXIMA PRIORIDAD**
- **Bypass de autenticación crítico** en endpoint `/chat` (backend/app/apis/chat/__init__.py)
- Autenticación inconsistente entre módulos
- Sin validación de entrada más allá de Pydantic básico
- Gestión inadecuada de secretos y API keys
- Headers de seguridad configurados pero no aplicados correctamente

#### 2. **TESTING - CRÍTICO**
- **Cobertura actual: ~1%** (solo 3 tests en todo el proyecto)
- Sin tests unitarios implementados
- Sin tests de integración
- Sin tests E2E
- CI/CD no valida calidad del código
- Imposible hacer refactoring seguro sin cobertura de tests

#### 3. **ARQUITECTURA BACKEND - PROBLEMAS GRAVES**
- **Duplicación masiva**: Directorios `app/` y `app 2/` coexisten
- Sin capa de servicios (lógica de negocio mezclada con controladores)
- Sin sistema de caché implementado
- Operaciones síncronas bloqueando el event loop
- Sin connection pooling para base de datos
- Sin patrón Repository para acceso a datos

#### 4. **CALIDAD DE CÓDIGO FRONTEND**
- **TypeScript strict mode deshabilitado** (400+ errores ocultos)
- Duplicación de componentes UI (2-3 versiones del mismo componente)
- 127 warnings de ESLint ignorados
- Props drilling excesivo sin state management apropiado
- Sin memoización en componentes pesados

#### 5. **INFRAESTRUCTURA INEXISTENTE**
- Sin Docker/containerización
- Sin ambientes de staging
- Sin monitoreo o observabilidad (Sentry, Grafana)
- Sin sistema de migraciones de base de datos
- Sin health checks implementados
- Sin scripts de deployment

### ✅ Plan inmediato hacia BETA
1. Documentación transparente (README, INSTALL, SECURITY, guías internas).
2. Reintegrar routers de `backend/app 2`, restaurar autenticación real y sanitización reforzada.
3. Registrar instancias de rate limiter/error handler y crear métricas consultables.
4. Sustituir mocks (chat, notificaciones) por llamadas reales y degradaciones controladas.
5. Ampliar cobertura de pruebas (pytest/Vitest) y automatizar en Makefile/CI.
6. Documentar configuración de Supabase, RLS y scripts `seed-demo` para ambientes locales.

### ✅ FORTALEZAS ACTUALES
- Excelente sistema de diseño UI/UX con shadcn/ui
- Dashboard sofisticado con sparklines y generación de PDF
- Integración funcional con Supabase
- Rate limiting multicapa bien diseñado
- Arquitectura modular con potencial de escalabilidad

---

## 📋 PLAN DE IMPLEMENTACIÓN ACTUALIZADO (2025-09-15)

### 🎯 ESTRATEGIA: Completar NGX Pulse Standalone → Producción → Integración Futura

### 🔴 FASE 1 - FINALIZACIÓN PARA PRODUCCIÓN (Semanas 1-2)

#### Semana 1: Seguridad y Testing Foundation
**DÍA 1-2: Seguridad Crítica**
- [ ] Deshabilitar endpoint `/chat` temporalmente
- [ ] Auditar TODOS los endpoints para verificar autenticación
- [ ] Implementar middleware global de autenticación
- [ ] Corregir bypass en `backend/app/apis/chat/__init__.py`

**DÍA 3-4: Setup Testing**
- [ ] Configurar pytest con fixtures para backend
- [ ] Configurar Jest/Vitest para frontend
- [ ] Crear tests de autenticación (objetivo: 90% cobertura auth)
- [ ] Configurar CI/CD para rechazar PRs sin tests

**DÍA 5: Validación y Secretos**
- [ ] Implementar validación Pydantic exhaustiva
- [ ] Configurar vault para API keys
- [ ] Rotar todas las claves existentes
- [ ] Documentar configuración de seguridad

#### Semana 2: Tests Fundamentales
- [ ] Tests unitarios para módulos críticos
- [ ] Tests de integración para APIs principales
- [ ] Tests E2E para flujos de usuario críticos
- [ ] Configurar coverage reports automáticos

### 🟡 FASE 2 - DOCKERIZACIÓN Y DEPLOYMENT (Semana 3)

#### Containerización y CI/CD
**Docker Setup:**
- [ ] Crear Dockerfile multistage para frontend
- [ ] Crear Dockerfile para FastAPI backend
- [ ] docker-compose.yml para desarrollo local
- [ ] docker-compose.prod.yml para producción

**Deployment:**
- [ ] Configurar GitHub Actions para CI/CD
- [ ] Setup staging environment
- [ ] Deploy a producción con monitoring
- [ ] Configurar health checks y alertas

#### Semana 5: Arquitectura Backend
- [ ] Implementar Service Layer pattern
```python
# Ejemplo estructura:
backend/
├── app/
│   ├── api/          # Controllers
│   ├── services/     # Business logic
│   ├── repositories/ # Data access
│   └── models/       # Domain models
```
- [ ] Agregar async/await en todas las operaciones DB
- [ ] Implementar connection pooling con asyncpg
- [ ] Crear interfaces y contratos claros

#### Semana 6: TypeScript y State Management
- [ ] Habilitar TypeScript strict mode gradualmente
- [ ] Corregir los 400+ errores de tipo
- [ ] Implementar Zustand para estado global
- [ ] Integrar React Query para server state
- [ ] Eliminar prop drilling

### 🟢 FASE 3 - INTEGRACIÓN FUTURA AL MONOREPO (Mes 2+)

#### Semana 7-8: Infraestructura y DevOps
**Docker y Ambientes:**
- [ ] Crear Dockerfile para frontend y backend
- [ ] Configurar docker-compose para desarrollo
- [ ] Establecer ambiente de staging
- [ ] Implementar feature flags

**Monitoreo:**
- [ ] Integrar Sentry para error tracking
- [ ] Configurar Grafana para métricas
- [ ] Implementar health checks
- [ ] Configurar alertas automáticas

#### Semana 9: Base de Datos
- [ ] Implementar sistema de migraciones con Alembic
- [ ] Auditar y crear índices necesarios
- [ ] Optimizar queries lentas (N+1 problems)
- [ ] Documentar modelo de datos completo

#### Semana 10-11: Performance
**Backend:**
- [ ] Implementar Redis cache
- [ ] Configurar Celery para background jobs
- [ ] Optimizar serialización/deserialización
- [ ] Implementar API response compression

**Frontend:**
- [ ] Code splitting agresivo
- [ ] Lazy loading de rutas y componentes
- [ ] Optimización de bundle (objetivo: <500KB)
- [ ] PWA completa con offline support

---

## 📈 MÉTRICAS DE ÉXITO Y KPIs

| Métrica | Estado Actual | P0 (2 sem) | P1 (6 sem) | P2 (10 sem) |
|---------|--------------|------------|------------|-------------|
| Cobertura Tests | 1% | 30% | 60% | 80%+ |
| Vulnerabilidades Críticas | 5+ | 0 | 0 | 0 |
| TypeScript Errors | 400+ | 400+ | 100 | 0 |
| Performance Score | 65 | 70 | 80 | 90+ |
| Duplicación Código | 25% | 20% | 10% | <5% |
| Bundle Size | 1.2MB | 1MB | 700KB | <500KB |
| Time to Interactive | 4.5s | 4s | 3s | <2s |

---

## 🚀 COMANDOS PARA INICIAR MAÑANA

### Día 1 - Setup Inicial
```bash
# 1. Crear branch para fase P0
git checkout -b feature/p0-critical-fixes

# 2. Auditar seguridad
cd backend
grep -r "auth_required=False" app/
grep -r "@router" app/ | grep -v "auth"

# 3. Deshabilitar endpoint vulnerable temporalmente
# Comentar en backend/app/main.py la línea que incluye el router de chat

# 4. Setup testing
cd backend
pip install pytest pytest-cov pytest-asyncio
mkdir tests
touch tests/__init__.py tests/test_auth.py

cd ../frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Tests Iniciales a Crear
```python
# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_protected_endpoint_requires_auth():
    response = client.get("/routes/api/v1/user/profile")
    assert response.status_code == 401

def test_login_with_valid_credentials():
    # Implementar test de login
    pass

def test_jwt_validation():
    # Implementar validación de JWT
    pass
```

---

## ⚠️ ACCIONES INMEDIATAS REQUERIDAS

### HOY (Antes de cerrar):
1. ✅ Documentar estado actual en CLAUDE.md
2. ⏳ Notificar al equipo sobre vulnerabilidades críticas
3. ⏳ Crear backup del estado actual

### MAÑANA (Día 1):
1. 🔴 **08:00**: Deshabilitar endpoint `/chat` vulnerable
2. 🔴 **09:00**: Comenzar auditoría de autenticación
3. 🟡 **11:00**: Setup frameworks de testing
4. 🟡 **14:00**: Escribir primeros tests de seguridad
5. 🟢 **16:00**: Documentar hallazgos y progreso

---

## 📝 NOTAS IMPORTANTES

1. **NO DEPLOYAR A PRODUCCIÓN** hasta completar Fase P0
2. **Prioridad absoluta**: Seguridad y testing
3. **Code reviews obligatorios** para cada PR
4. **Documentar cada cambio** en CHANGELOG.md
5. **Daily standups** durante Fase P0 para tracking

---

## 🎯 OBJETIVO FINAL

Transformar NGX_PULSE de un proyecto con potencial (6.8/10) a una plataforma enterprise-ready (9.5/10) lista para:
- Manejar miles de usuarios concurrentes
- Integrarse con el ecosistema NGX
- Cumplir con estándares de seguridad OWASP
- Mantener 99.9% uptime
- Escalar horizontalmente según demanda

**Tiempo total estimado**: 10-11 semanas con 2 desarrolladores senior full-stack

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS (Septiembre 2025)

### Semana del 16-22 de Septiembre
1. **Lunes-Martes**: Setup testing framework (Jest + React Testing Library)
2. **Miércoles-Jueves**: Escribir tests para componentes críticos
3. **Viernes**: Comenzar habilitación de TypeScript strict mode

### Semana del 23-29 de Septiembre  
1. **Lunes-Miércoles**: Completar features faltantes del dashboard
2. **Jueves-Viernes**: Dockerización completa

### Semana del 30 Sept - 6 Oct
1. **Deploy a staging**
2. **Testing con usuarios beta**
3. **Launch a producción**

### Post-Launch (Octubre+)
- Comenzar integración gradual con NGX_Ecosystem_Beta
- Mantener NGX Pulse operacional durante la transición
- No breaking changes para usuarios

---

*Última actualización: 2025-09-15*
*Próxima revisión: 2025-09-22 (Post primera semana de desarrollo)*
*Responsable: Equipo NGX*
*Estrategia: Ship Fast, Integrate Smart*
