# Estado de migración de routers (backend)

## Inventario actual en `backend/app/apis/`
- `auth` (prioridad P0) — base para login/session handoff.
- `biometrics` (prioridad P1) — lecturas y resumen de biométricos.
- `nutrition` (prioridad P1) — registros de nutrición y diarios.
- `training` (prioridad P1) — sesiones y métricas de entrenamiento.
- `health_data` (existente).
- `ai_coach_messages_api` (existente).
- `chat` (existente).
- `demo` (solo para staging).

## Pendientes detectados
- No se encontraron referencias a una carpeta o módulo `app 2/` en el repositorio actual.
- Si aparecen módulos legacy externos, priorizar la migración hacia `backend/app/apis/<feature>/__init__.py` y asegurar exportación `router = APIRouter(...)`.

## Prioridades sugeridas
1. **Auth**: habilita el resto de endpoints protegidos y configuración de seguridad.
2. **Biometrics**: requerido por dashboards y reportes de salud.
3. **Nutrition**: requerido por diarios y métricas de cumplimiento nutricional.
4. **Training**: requerido por sesiones y progreso de entrenamiento.
