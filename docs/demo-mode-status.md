# Estado de demo vs. datos reales (frontend)

## Módulos con mocks en `frontend/src/`

- `frontend/src/utils/demoClient.ts`
  - Cliente de autenticación demo (offline). Actualmente **no está referenciado** por otros módulos de frontend; queda como alternativa de desarrollo.
- `frontend/src/utils/demoAIService.ts`
  - Mock de IA para endpoints `/api/ai/*`.
  - Usado como fallback automático desde `frontend/src/utils/apiClient.ts` cuando el backend no responde.
- `frontend/src/components/NotificationsTab.tsx`
  - Datos simulados en memoria (`mockNotifications`) para la lista de notificaciones.

## Vistas con datos reales (backend/Supabase)

- **Login/Sign Up** (`frontend/src/pages/AuthPage.tsx`, `frontend/src/pages/SignUpPage.tsx`):
  - Autenticación real vía Supabase (`supabase.auth`).
- **Dashboard** (`frontend/src/pages/DashboardPage.tsx`):
  - Métricas biométricas, tendencias y sparklines reales vía Supabase.
  - Mensajes del AI Coach vía `apiClient` (backend), con fallback a mock si el backend no responde.
- **Logging pages** (datos reales vía Supabase):
  - `frontend/src/pages/BiometricLogPage.tsx`
  - `frontend/src/pages/TrainingLogPage.tsx`
  - `frontend/src/pages/NutritionLogPage.tsx`
  - `frontend/src/pages/WellnessLogPage.tsx`
  - `frontend/src/pages/DailyCheckinPage.tsx`

## Vistas en modo demo o parcial (con fallback)

- **Program Wizard** (`frontend/src/components/ProgramWizard.tsx`):
  - Usa `/api/ai/generate-program` vía `apiClient`, con fallback automático a mock si el backend no responde.
- **Mensajes del AI Coach** en el Dashboard:
  - `/api/ai/coach-messages` vía `apiClient`, con fallback automático a mock si el backend no responde.
- **Notificaciones** (`frontend/src/components/NotificationsTab.tsx`):
  - Persisten en modo demo con `mockNotifications` hasta que exista endpoint real.
