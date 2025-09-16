# 🏗️ Mejoras Arquitectónicas - NGX Pulse

## 🎯 Visión Arquitectónica

Transformar NGX Pulse de una aplicación monolítica a una arquitectura empresarial escalable, mantenible y resiliente.

### Objetivos Principales
1. **Separación de Concerns**: Lógica de negocio independiente de infraestructura
2. **Escalabilidad**: Soportar 100K+ usuarios concurrentes
3. **Testabilidad**: >90% cobertura en lógica crítica
4. **Observabilidad**: Monitoreo completo del sistema
5. **Resiliencia**: Tolerancia a fallos y recuperación automática

## 📐 Arquitectura Actual vs Propuesta

### Estado Actual
```
┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  FastAPI        │
│  (Monolítica)   │     │  (Sin capas)    │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Supabase      │
                        │  (Direct SQL)   │
                        └─────────────────┘
```

### Arquitectura Objetivo
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   API Gateway   │────▶│  Load Balancer  │
│  (Modular)      │     │   (Kong/NGINX)  │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┴───────────────────────┐
                        │                                                         │
                        ▼                                                         ▼
              ┌─────────────────┐                                       ┌─────────────────┐
              │  Auth Service   │                                       │  Health Service │
              │  (FastAPI)      │                                       │  (FastAPI)      │
              └────────┬────────┘                                       └────────┬────────┘
                       │                                                          │
                       ▼                                                          ▼
              ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
              │ Business Logic  │     │     Redis       │     │   Repository    │
              │    Layer        │────▶│    (Cache)      │     │     Layer       │
              └─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                                        │
                                                                        ▼
                                                              ┌─────────────────┐
                                                              │    Supabase     │
                                                              │  (Via ORM/SDK)  │
                                                              └─────────────────┘
```

## 🔧 Implementación por Capas

### 1. Capa de Presentación (Frontend)

#### Arquitectura Modular con Feature Slices
```typescript
// frontend/src/features/health/
├── api/              # API calls específicas del feature
├── components/       # Componentes del feature
├── hooks/           # Hooks personalizados
├── stores/          # Estado local del feature
├── types/           # Tipos TypeScript
└── index.ts         # Exports públicos
```

#### Ejemplo de Feature Slice
```typescript
// frontend/src/features/health/api/healthApi.ts
import { createApi } from '@/lib/api/createApi'
import type { HealthData, HealthMetrics } from '../types'

export const healthApi = createApi({
  baseURL: '/api/v1/health',
  endpoints: (builder) => ({
    getMetrics: builder.query<HealthMetrics, void>({
      query: () => '/metrics',
      providesTags: ['HealthMetrics'],
    }),
    createEntry: builder.mutation<HealthData, Partial<HealthData>>({
      query: (data) => ({
        url: '/entries',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HealthMetrics'],
    }),
  }),
})
```

### 2. Capa de API (Backend)

#### Clean Architecture Implementation

**Domain Layer (Entidades y Reglas de Negocio)**
```python
# backend/app/domain/health/entities.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from decimal import Decimal

@dataclass
class HealthMetric:
    """Entidad de dominio - sin dependencias externas"""
    id: Optional[str]
    user_id: str
    date: datetime
    sleep_hours: Decimal
    hrv: Optional[int]
    steps: int
    weight: Optional[Decimal]
    
    def calculate_health_score(self) -> Decimal:
        """Lógica de negocio pura"""
        base_score = Decimal('50')
        
        # Sleep contribution (max 30 points)
        sleep_score = min(self.sleep_hours * 4, 30)
        
        # HRV contribution (max 20 points)
        hrv_score = min((self.hrv or 0) / 5, 20) if self.hrv else 10
        
        # Steps contribution (max 30 points)
        steps_score = min(self.steps / 333, 30)
        
        return base_score + sleep_score + hrv_score + steps_score
    
    def validate(self) -> list[str]:
        """Validación de reglas de negocio"""
        errors = []
        
        if self.sleep_hours < 0 or self.sleep_hours > 24:
            errors.append("Sleep hours must be between 0 and 24")
        
        if self.steps < 0:
            errors.append("Steps cannot be negative")
            
        if self.weight and self.weight < 0:
            errors.append("Weight cannot be negative")
            
        return errors
```

**Application Layer (Casos de Uso)**
```python
# backend/app/application/health/use_cases.py
from typing import Protocol
from app.domain.health.entities import HealthMetric
from app.domain.health.events import HealthMetricCreated

class HealthRepository(Protocol):
    """Puerto - Interfaz del repositorio"""
    async def save(self, metric: HealthMetric) -> HealthMetric:
        ...
    
    async def get_by_user_and_date(
        self, user_id: str, date: datetime
    ) -> Optional[HealthMetric]:
        ...

class EventBus(Protocol):
    """Puerto - Interfaz del bus de eventos"""
    async def publish(self, event: DomainEvent) -> None:
        ...

class CreateHealthMetricUseCase:
    def __init__(
        self,
        repository: HealthRepository,
        event_bus: EventBus
    ):
        self.repository = repository
        self.event_bus = event_bus
    
    async def execute(self, data: dict) -> HealthMetric:
        # Crear entidad de dominio
        metric = HealthMetric(**data)
        
        # Validar reglas de negocio
        errors = metric.validate()
        if errors:
            raise ValueError(f"Validation errors: {', '.join(errors)}")
        
        # Verificar duplicados
        existing = await self.repository.get_by_user_and_date(
            metric.user_id, metric.date
        )
        if existing:
            raise ValueError("Metric already exists for this date")
        
        # Persistir
        saved_metric = await self.repository.save(metric)
        
        # Publicar evento
        await self.event_bus.publish(
            HealthMetricCreated(
                metric_id=saved_metric.id,
                user_id=saved_metric.user_id,
                health_score=saved_metric.calculate_health_score()
            )
        )
        
        return saved_metric
```

**Infrastructure Layer (Adaptadores)**
```python
# backend/app/infrastructure/health/repository.py
from app.domain.health.entities import HealthMetric
from app.infrastructure.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

class SqlAlchemyHealthRepository:
    """Adaptador - Implementación concreta del repositorio"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def save(self, metric: HealthMetric) -> HealthMetric:
        # Mapear entidad de dominio a modelo de DB
        db_model = HealthMetricModel(
            user_id=metric.user_id,
            date=metric.date,
            sleep_hours=metric.sleep_hours,
            hrv=metric.hrv,
            steps=metric.steps,
            weight=metric.weight
        )
        
        self.session.add(db_model)
        await self.session.commit()
        
        # Mapear de vuelta a entidad de dominio
        metric.id = str(db_model.id)
        return metric
```

**API Layer (Controllers)**
```python
# backend/app/api/v1/health/controller.py
from fastapi import APIRouter, Depends, HTTPException
from app.application.health.use_cases import CreateHealthMetricUseCase
from app.infrastructure.health.repository import SqlAlchemyHealthRepository
from app.infrastructure.events.redis_bus import RedisEventBus
from app.api.dependencies import get_current_user, get_db

router = APIRouter(prefix="/health", tags=["health"])

@router.post("/metrics")
async def create_health_metric(
    data: CreateHealthMetricRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Inyección de dependencias
    repository = SqlAlchemyHealthRepository(db)
    event_bus = RedisEventBus()
    use_case = CreateHealthMetricUseCase(repository, event_bus)
    
    try:
        metric = await use_case.execute({
            **data.dict(),
            "user_id": current_user.id
        })
        
        return HealthMetricResponse.from_domain(metric)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### 3. Capa de Infraestructura

#### Sistema de Caché con Redis

```python
# backend/app/infrastructure/cache/redis_cache.py
import json
from typing import Optional, Any
from redis.asyncio import Redis
from datetime import timedelta

class RedisCache:
    def __init__(self, redis: Redis):
        self.redis = redis
    
    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        return json.loads(value) if value else None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[timedelta] = None
    ):
        serialized = json.dumps(value)
        if ttl:
            await self.redis.setex(key, ttl, serialized)
        else:
            await self.redis.set(key, serialized)
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidar todas las claves que coincidan con el patrón"""
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(
                cursor, match=pattern, count=100
            )
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break

# Decorador para cachear
def cached(ttl: timedelta = timedelta(minutes=5)):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Intentar obtener del cache
            cached_value = await cache.get(cache_key)
            if cached_value:
                return cached_value
            
            # Ejecutar función y cachear resultado
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator
```

#### Sistema de Colas con Celery

```python
# backend/app/infrastructure/tasks/celery_app.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    'ngx_pulse',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.infrastructure.tasks.health_tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_routes={
        'app.tasks.health.*': {'queue': 'health'},
        'app.tasks.notifications.*': {'queue': 'notifications'},
    }
)

# backend/app/infrastructure/tasks/health_tasks.py
from app.infrastructure.tasks.celery_app import celery_app
from app.application.health.services import HealthAnalysisService

@celery_app.task(name='analyze_health_trends')
def analyze_health_trends(user_id: str):
    """Análisis asíncrono de tendencias de salud"""
    service = HealthAnalysisService()
    
    # Análisis pesado que no bloquea la API
    trends = service.analyze_user_trends(user_id)
    
    # Guardar resultados en cache
    cache_key = f"health_trends:{user_id}"
    redis_cache.set(cache_key, trends, ttl=timedelta(hours=1))
    
    # Notificar al usuario si hay insights importantes
    if trends.has_significant_changes:
        send_notification.delay(
            user_id=user_id,
            type='health_insight',
            data=trends.insights
        )
    
    return trends.dict()
```

### 4. Patrón Repository con Unit of Work

```python
# backend/app/infrastructure/database/unit_of_work.py
from typing import Protocol
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

class UnitOfWork(Protocol):
    health_repository: HealthRepository
    user_repository: UserRepository
    
    async def commit(self) -> None:
        ...
    
    async def rollback(self) -> None:
        ...

class SqlAlchemyUnitOfWork:
    def __init__(self, session_factory):
        self.session_factory = session_factory
    
    @asynccontextmanager
    async def __call__(self):
        async with self.session_factory() as session:
            self.session = session
            self.health_repository = SqlAlchemyHealthRepository(session)
            self.user_repository = SqlAlchemyUserRepository(session)
            
            try:
                yield self
                await self.commit()
            except Exception:
                await self.rollback()
                raise
    
    async def commit(self):
        await self.session.commit()
    
    async def rollback(self):
        await self.session.rollback()

# Uso en casos de uso
class ComplexHealthUseCase:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow
    
    async def execute(self, data: dict):
        async with self.uow:
            # Todas las operaciones en una transacción
            user = await self.uow.user_repository.get(data['user_id'])
            metric = await self.uow.health_repository.save(
                HealthMetric(**data)
            )
            user.last_health_update = datetime.now()
            await self.uow.user_repository.update(user)
            # Commit automático al salir del context manager
```

## 🚀 Estrategia de Migración

### Fase 1: Preparación (Semana 1)
1. **Setup de Infraestructura**
   - [ ] Configurar Redis para desarrollo
   - [ ] Configurar Celery y workers
   - [ ] Setup de herramientas de monitoreo

2. **Crear Estructura Base**
   - [ ] Crear carpetas según clean architecture
   - [ ] Definir interfaces y protocolos
   - [ ] Configurar inyección de dependencias

### Fase 2: Migración por Módulos (Semanas 2-3)
1. **Módulo de Autenticación**
   - [ ] Extraer lógica a casos de uso
   - [ ] Implementar repository pattern
   - [ ] Agregar caching de sesiones

2. **Módulo de Health Data**
   - [ ] Migrar lógica de negocio a domain layer
   - [ ] Implementar event-driven updates
   - [ ] Agregar procesamiento asíncrono

### Fase 3: Optimización (Semana 4)
1. **Performance**
   - [ ] Implementar caching estratégico
   - [ ] Optimizar queries con DataLoader
   - [ ] Agregar paginación eficiente

2. **Observabilidad**
   - [ ] Integrar OpenTelemetry
   - [ ] Configurar dashboards
   - [ ] Alertas automáticas

## 📊 Métricas de Arquitectura

### KPIs a Monitorear
1. **Performance**
   - Response time P95 < 200ms
   - Throughput > 1000 req/s
   - Error rate < 0.1%

2. **Escalabilidad**
   - Horizontal scaling sin downtime
   - Auto-scaling basado en métricas
   - Distribución de carga uniforme

3. **Mantenibilidad**
   - Tiempo de onboarding < 1 semana
   - Tiempo de implementar feature < 2 días
   - Bugs en producción < 5/mes

## 🛡️ Patrones de Resiliencia

### 1. Circuit Breaker
```python
# backend/app/infrastructure/resilience/circuit_breaker.py
from typing import Callable, Any
import asyncio
from datetime import datetime, timedelta

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: timedelta = timedelta(seconds=60),
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        if self.state == 'OPEN':
            if self._should_attempt_reset():
                self.state = 'HALF_OPEN'
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        return (
            self.last_failure_time and
            datetime.now() - self.last_failure_time >= self.recovery_timeout
        )
    
    def _on_success(self):
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
```

### 2. Retry with Backoff
```python
# backend/app/infrastructure/resilience/retry.py
import asyncio
from typing import TypeVar, Callable, Optional
from functools import wraps

T = TypeVar('T')

def retry_with_backoff(
    max_attempts: int = 3,
    backoff_factor: float = 2,
    max_delay: float = 60,
    exceptions: tuple = (Exception,)
):
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            delay = 1
            last_exception = None
            
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(min(delay, max_delay))
                        delay *= backoff_factor
                    else:
                        raise e
            
            raise last_exception
        
        return wrapper
    return decorator
```

## ✅ Checklist de Implementación

### Arquitectura Backend
- [ ] Estructura de carpetas Clean Architecture
- [ ] Casos de uso para toda la lógica de negocio
- [ ] Repository pattern implementado
- [ ] Unit of Work para transacciones
- [ ] Event-driven architecture
- [ ] Sistema de caché con Redis
- [ ] Colas de tareas con Celery
- [ ] Circuit breakers en servicios externos
- [ ] Logging estructurado
- [ ] Métricas con Prometheus

### Arquitectura Frontend
- [ ] Feature slices modulares
- [ ] Estado global con Zustand
- [ ] Server state con React Query
- [ ] Lazy loading de módulos
- [ ] Error boundaries por feature
- [ ] Suspense para loading states
- [ ] Optimistic updates
- [ ] Offline support con PWA

### DevOps
- [ ] Docker compose para desarrollo
- [ ] Kubernetes manifests para producción
- [ ] CI/CD pipeline completo
- [ ] Infrastructure as Code
- [ ] Monitoreo con Grafana
- [ ] Alertas con PagerDuty

---

**Impacto Esperado**: 
- 🚀 10x mejora en escalabilidad
- 📈 50% reducción en tiempo de desarrollo
- 🛡️ 99.9% uptime
- ⚡ <200ms response time

**Timeline**: 4-6 semanas
**Equipo**: 2 backend, 1 frontend, 1 DevOps
**Última Actualización**: 2025-07-30