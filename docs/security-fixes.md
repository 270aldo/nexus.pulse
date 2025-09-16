# 🔒 Plan de Correcciones de Seguridad - NGX Pulse

## 📋 Resumen de Vulnerabilidades Críticas

### 🔴 Críticas (P0)
1. **Bypass de Autenticación** en endpoint `/chat`
2. **API Keys en Texto Plano** en variables de entorno
3. **Falta de Validación de Entrada** (SQL Injection, XSS)
4. **Middleware de Seguridad Deshabilitado**

### 🟡 Altas (P1)
1. **Sin Rate Limiting Distribuido**
2. **Logs con Información Sensible**
3. **CORS Permisivo en Desarrollo**
4. **Sin Rotación de Tokens**

## 🛠️ Plan de Implementación Detallado

### 1. Corrección de Bypass de Autenticación

#### Problema Actual
```python
# backend/app/apis/chat.py
@router.post("/")
async def create_chat_session(request: ChatRequest):
    # NO HAY VERIFICACIÓN DE AUTENTICACIÓN
    user_id = request.user_id  # Usuario puede enviar cualquier ID
```

#### Solución Implementar
```python
# backend/app/apis/chat.py
from app.auth.dependencies import get_current_user

@router.post("/")
async def create_chat_session(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    # Validar que el user_id coincida con el usuario autenticado
    if request.user_id != current_user.get("sub"):
        raise HTTPException(
            status_code=403,
            detail="No autorizado para crear sesiones para otros usuarios"
        )
    
    # Continuar con la lógica existente...
```

#### Checklist
- [ ] Agregar `Depends(get_current_user)` a TODOS los endpoints
- [ ] Auditar cada archivo en `/apis/` para verificar auth
- [ ] Crear tests para verificar que endpoints sin auth fallan
- [ ] Documentar qué endpoints son públicos (si los hay)

### 2. Gestión Segura de API Keys

#### Problema Actual
```python
# Variables de entorno sin encriptar
OPENAI_API_KEY=sk-xxxxx
SUPABASE_SERVICE_KEY=xxxxx
```

#### Solución Implementar

**Paso 1: Crear módulo de configuración segura**
```python
# backend/app/core/security_config.py
import os
from cryptography.fernet import Fernet
from typing import Optional

class SecureConfig:
    def __init__(self):
        self._cipher_suite = self._init_cipher()
        self._cache = {}
    
    def _init_cipher(self) -> Fernet:
        # La clave de encriptación debe estar en un servicio seguro
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError("ENCRYPTION_KEY no configurada")
        return Fernet(key.encode())
    
    def get_secret(self, key: str) -> Optional[str]:
        if key in self._cache:
            return self._cache[key]
        
        encrypted_value = os.getenv(f"ENCRYPTED_{key}")
        if not encrypted_value:
            return None
            
        decrypted = self._cipher_suite.decrypt(
            encrypted_value.encode()
        ).decode()
        
        self._cache[key] = decrypted
        return decrypted

secure_config = SecureConfig()
```

**Paso 2: Script para encriptar secrets**
```python
# scripts/encrypt_secrets.py
from cryptography.fernet import Fernet
import sys

def encrypt_secret(value: str, key: str) -> str:
    cipher_suite = Fernet(key.encode())
    return cipher_suite.encrypt(value.encode()).decode()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python encrypt_secrets.py <secret> <encryption_key>")
        sys.exit(1)
    
    secret = sys.argv[1]
    key = sys.argv[2]
    print(f"Valor encriptado: {encrypt_secret(secret, key)}")
```

#### Checklist
- [ ] Implementar módulo de configuración segura
- [ ] Encriptar todos los secrets actuales
- [ ] Actualizar código para usar secure_config
- [ ] Documentar proceso de rotación de claves
- [ ] Configurar AWS Secrets Manager o similar para producción

### 3. Validación y Sanitización de Entrada

#### Implementación de Validadores

**Paso 1: Crear validadores centralizados**
```python
# backend/app/core/validators.py
import re
from typing import Any
import bleach
from pydantic import validator

class SecurityValidators:
    @staticmethod
    def sanitize_html(value: str) -> str:
        """Elimina HTML peligroso"""
        allowed_tags = ['b', 'i', 'u', 'em', 'strong']
        return bleach.clean(value, tags=allowed_tags, strip=True)
    
    @staticmethod
    def validate_sql_safe(value: str) -> str:
        """Previene SQL injection básico"""
        dangerous_patterns = [
            r"(\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE)\b)",
            r"(--|\*/|/\*|;)",
            r"(\bOR\b.*=.*)",
            r"(\bUNION\b.*\bSELECT\b)"
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError(f"Entrada potencialmente peligrosa detectada")
        
        return value
    
    @staticmethod
    def validate_no_script(value: str) -> str:
        """Previene XSS"""
        if re.search(r'<script|javascript:|onerror=|onclick=', value, re.IGNORECASE):
            raise ValueError("Script tags no permitidos")
        return value
```

**Paso 2: Aplicar en modelos Pydantic**
```python
# backend/app/models/chat.py
from pydantic import BaseModel, validator
from app.core.validators import SecurityValidators

class ChatMessage(BaseModel):
    content: str
    user_id: str
    
    @validator('content')
    def sanitize_content(cls, v):
        v = SecurityValidators.sanitize_html(v)
        v = SecurityValidators.validate_no_script(v)
        return v
    
    @validator('user_id')
    def validate_user_id(cls, v):
        # UUID validation
        import uuid
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id debe ser un UUID válido")
        return v
```

#### Checklist
- [ ] Instalar bleach para sanitización HTML
- [ ] Crear módulo de validadores de seguridad
- [ ] Aplicar validadores a TODOS los modelos Pydantic
- [ ] Agregar tests para cada validador
- [ ] Configurar Content Security Policy estricto

### 4. Habilitar Middleware de Seguridad

#### Actualizar main.py
```python
# backend/app/main.py
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.rate_limiter import RateLimitingMiddleware

# Habilitar middleware de seguridad
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    RateLimitingMiddleware,
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379")
)

# Configurar CORS restrictivo para producción
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://ngxpulse.com",
            "https://www.ngxpulse.com"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
```

#### Checklist
- [ ] Habilitar SecurityHeadersMiddleware
- [ ] Configurar RateLimitingMiddleware con Redis
- [ ] Restringir CORS en producción
- [ ] Agregar logging de seguridad
- [ ] Configurar WAF si está disponible

## 🧪 Plan de Testing de Seguridad

### 1. Tests Automatizados
```python
# tests/security/test_authentication.py
import pytest
from fastapi.testclient import TestClient

class TestAuthentication:
    def test_endpoint_without_auth_fails(self, client: TestClient):
        """Verificar que endpoints protegidos fallan sin auth"""
        response = client.post("/chat", json={"content": "test"})
        assert response.status_code == 401
    
    def test_invalid_token_rejected(self, client: TestClient):
        """Verificar que tokens inválidos son rechazados"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/health-data", headers=headers)
        assert response.status_code == 401
    
    def test_expired_token_rejected(self, client: TestClient):
        """Verificar que tokens expirados son rechazados"""
        # Implementar con token expirado real
        pass
```

### 2. Tests de Penetración
- [ ] Ejecutar OWASP ZAP contra la aplicación
- [ ] Probar SQL injection en todos los inputs
- [ ] Verificar XSS en campos de texto
- [ ] Probar bypass de autenticación
- [ ] Verificar rate limiting

### 3. Auditoría de Dependencias
```bash
# Backend
pip install safety
safety check

# Frontend
npm audit
npm audit fix
```

## 📊 Métricas de Seguridad

### KPIs a Monitorear
1. **Vulnerabilidades por Severidad**
   - Críticas: 0 (actual: 4)
   - Altas: 0 (actual: 4)
   - Medias: <5
   - Bajas: <10

2. **Cobertura de Tests de Seguridad**
   - Autenticación: 100%
   - Autorización: 100%
   - Validación de Input: 100%
   - Rate Limiting: 100%

3. **Tiempo de Respuesta a Incidentes**
   - Detección: <5 minutos
   - Contención: <30 minutos
   - Resolución: <2 horas

## 🚨 Plan de Respuesta a Incidentes

### 1. Detección
- Configurar alertas en Sentry/DataDog
- Monitorear logs en tiempo real
- Alertas por intentos de auth fallidos

### 2. Contención
- Script para bloquear IPs maliciosas
- Poder deshabilitar endpoints comprometidos
- Rollback rápido si es necesario

### 3. Recuperación
- Proceso de rotación de claves
- Notificación a usuarios afectados
- Post-mortem documentado

## 📅 Timeline de Implementación

### Día 1-2: Autenticación
- Corregir bypass en /chat
- Auditar todos los endpoints
- Implementar tests básicos

### Día 3: Gestión de Secretos
- Implementar encriptación
- Rotar todas las claves
- Configurar vault

### Día 4: Validación de Datos
- Implementar validadores
- Aplicar a todos los modelos
- Tests de validación

### Día 5: Middleware y Tests
- Habilitar todo el middleware
- Tests de penetración
- Documentación final

## ✅ Checklist de Verificación Final

- [ ] Todos los endpoints requieren autenticación (excepto login/register)
- [ ] Ningún secret en texto plano en el código
- [ ] Validación en TODOS los inputs de usuario
- [ ] Rate limiting funcionando
- [ ] Headers de seguridad configurados
- [ ] CORS restrictivo en producción
- [ ] Logs sin información sensible
- [ ] Tests de seguridad pasando
- [ ] Documentación de seguridad completa
- [ ] Plan de respuesta a incidentes activo

---

**Prioridad**: CRÍTICA
**Tiempo Estimado**: 5 días
**Responsable**: Equipo de Seguridad
**Última Actualización**: 2025-07-30