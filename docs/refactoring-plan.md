# 🔨 Plan de Refactorización - NGX Pulse

## 📊 Análisis de Deuda Técnica

### Problemas Principales Identificados

#### 1. **Duplicación Masiva** 🔴 Crítico
- Componentes UI duplicados entre `/components/ui/` y `/extensions/shadcn/`
- Directorios con sufijo "2" por todo el proyecto
- Múltiples implementaciones del mismo componente

#### 2. **TypeScript Mal Configurado** 🔴 Crítico
- Strict mode deshabilitado
- Múltiples `any` implícitos
- Falta de tipos en muchas funciones

#### 3. **Estado Global Antipatterns** 🟡 Alto
- Variables globales en backend
- Estado disperso en frontend
- Dependencias no utilizadas (Zustand, React Query)

#### 4. **Arquitectura Acoplada** 🟡 Alto
- Lógica de negocio mezclada con APIs
- Sin capa de servicios
- Acceso directo a base de datos

## 🎯 Estrategia de Refactorización

### Principios Guía
1. **Incremental**: Refactorizar por módulos, no todo a la vez
2. **Test-First**: Escribir tests antes de refactorizar
3. **Funcionalidad Primero**: No romper features existentes
4. **Medible**: Trackear métricas de mejora

## 📋 Plan Detallado por Área

### 1. Limpieza de Duplicados

#### Fase 1: Auditoría y Mapeo
```bash
# Script para identificar duplicados
#!/bin/bash
# find_duplicates.sh

echo "=== Directorios duplicados ==="
find . -type d -name "*2" | grep -v node_modules

echo "=== Componentes UI duplicados ==="
diff -r frontend/src/components/ui frontend/src/extensions/shadcn/components

echo "=== Archivos potencialmente duplicados ==="
fdupes -r frontend/src --exclude node_modules
```

#### Fase 2: Consolidación de Componentes UI

**Paso 1: Crear nueva estructura unificada**
```typescript
// frontend/src/lib/ui/index.ts
// Exportar todos los componentes desde un punto central

export * from './button'
export * from './card'
export * from './dialog'
export * from './form'
export * from './input'
// ... etc
```

**Paso 2: Migración gradual**
```typescript
// Crear aliases temporales para no romper imports existentes
// frontend/src/components/ui/button.tsx
export { Button } from '@/lib/ui/button'
console.warn('Deprecated: Import Button from @/lib/ui instead')
```

**Paso 3: Script de migración automática**
```javascript
// scripts/migrate-imports.js
const glob = require('glob');
const fs = require('fs');

const files = glob.sync('frontend/src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Reemplazar imports antiguos
  content = content.replace(
    /from ['"]@\/components\/ui\//g,
    'from \'@/lib/ui/'
  );
  
  content = content.replace(
    /from ['"]@\/extensions\/shadcn\/components\//g,
    'from \'@/lib/ui/'
  );
  
  fs.writeFileSync(file, content);
});
```

### 2. Habilitación de TypeScript Strict Mode

#### Estrategia Incremental

**Paso 1: Configuración gradual**
```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    // Habilitar incrementalmente
    "noImplicitAny": true,        // Semana 1
    "strictNullChecks": true,      // Semana 2
    "strictFunctionTypes": true,   // Semana 3
    "strictPropertyInitialization": true, // Semana 4
    "strict": true                 // Final
  },
  // Excluir temporalmente archivos problemáticos
  "exclude": [
    "src/legacy/**",
    "src/components/old/**"
  ]
}
```

**Paso 2: Fix automático de tipos comunes**
```typescript
// scripts/add-basic-types.ts
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

// Agregar tipos a funciones sin tipo de retorno
project.getSourceFiles().forEach(sourceFile => {
  sourceFile.getFunctions().forEach(func => {
    if (!func.getReturnType()) {
      // Inferir tipo de retorno
      func.setReturnType('void');
    }
  });
  
  // Agregar tipos a parámetros any
  sourceFile.forEachDescendant(node => {
    if (node.getKindName() === 'Parameter') {
      const param = node.asKindOrThrow(ts.SyntaxKind.Parameter);
      if (!param.getType()) {
        param.setType('unknown'); // Más seguro que any
      }
    }
  });
});

project.save();
```

**Paso 3: Tipos para componentes React**
```typescript
// Plantilla para migrar componentes
// ANTES:
export const MyComponent = (props) => {
  return <div>{props.title}</div>
}

// DESPUÉS:
interface MyComponentProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  subtitle, 
  onClick 
}) => {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
```

### 3. Refactorización de Estado Global

#### Backend: Eliminar Variables Globales

**Problema actual:**
```python
# backend/app/middleware/error_handler.py
global_error_handler = None  # MALO!

class GlobalErrorHandler:
    def __init__(self):
        global global_error_handler
        global_error_handler = self  # ANTIPATTERN!
```

**Solución con Dependency Injection:**
```python
# backend/app/core/dependencies.py
from functools import lru_cache
from typing import Annotated
from fastapi import Depends

class ErrorHandler:
    def __init__(self):
        self.error_stats = {}
    
    def handle_error(self, error: Exception):
        # Lógica de manejo
        pass

@lru_cache()
def get_error_handler() -> ErrorHandler:
    return ErrorHandler()

# Uso en endpoints
@router.get("/")
async def my_endpoint(
    error_handler: Annotated[ErrorHandler, Depends(get_error_handler)]
):
    try:
        # lógica
    except Exception as e:
        error_handler.handle_error(e)
```

#### Frontend: Implementar Zustand

**Configuración de stores:**
```typescript
// frontend/src/stores/useAppStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  id: string;
  email: string;
  profile?: UserProfile;
}

interface AppState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Acciones
  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Estado inicial
        user: null,
        isAuthenticated: false,
        theme: 'light',
        sidebarOpen: true,
        
        // Implementación de acciones
        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),
        
        toggleSidebar: () => set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        })),
        
        setTheme: (theme) => set({ theme }),
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false 
        }),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ 
          theme: state.theme,
          sidebarOpen: state.sidebarOpen 
        }),
      }
    )
  )
)
```

**Migración de Context a Zustand:**
```typescript
// ANTES (Context API)
const AppContext = createContext();
export const useApp = () => useContext(AppContext);

// DESPUÉS (Zustand)
import { useAppStore } from '@/stores/useAppStore';

// En componentes
function MyComponent() {
  const { user, setUser } = useAppStore();
  // Uso directo, sin providers
}
```

### 4. Implementar React Query

**Configuración:**
```typescript
// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 10, // 10 minutos
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

**Hooks personalizados con React Query:**
```typescript
// frontend/src/hooks/useHealthData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

export function useHealthData(userId: string) {
  return useQuery({
    queryKey: ['healthData', userId],
    queryFn: () => apiClient.get(`/api/v1/health-data/${userId}`),
    enabled: !!userId,
  })
}

export function useCreateHealthEntry() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: HealthEntryData) => 
      apiClient.post('/api/v1/health-data', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthData'] })
    },
  })
}
```

### 5. Arquitectura de Carpetas Mejorada

```
frontend/src/
├── app/                    # Configuración de la app
│   ├── router.tsx
│   └── providers.tsx
├── features/              # Features por dominio
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── dashboard/
│   ├── health/
│   └── profile/
├── lib/                   # Utilidades compartidas
│   ├── ui/               # Componentes UI unificados
│   ├── api/
│   ├── utils/
│   └── constants/
├── stores/               # Estado global con Zustand
└── types/               # Tipos TypeScript globales
```

## 📊 Métricas de Éxito

### Antes vs Después

| Métrica | Antes | Objetivo | Cómo Medir |
|---------|-------|----------|------------|
| Duplicación de código | ~40% | <5% | SonarQube |
| Complejidad ciclomática | 15+ | <10 | ESLint complexity |
| Cobertura de tipos | ~20% | 95%+ | tsc --noEmit |
| Bundle size | 1.2MB | <600KB | webpack-bundle-analyzer |
| Tiempo de build | 45s | <20s | CI/CD metrics |

## 🚀 Cronograma de Implementación

### Semana 1: Limpieza y Preparación
- [ ] Eliminar directorios "2" duplicados
- [ ] Consolidar componentes UI
- [ ] Configurar herramientas de análisis
- [ ] Escribir tests para código a refactorizar

### Semana 2: TypeScript Strict
- [ ] Habilitar noImplicitAny
- [ ] Corregir tipos en utils y hooks
- [ ] Agregar tipos a componentes core
- [ ] Documentar patrones de tipado

### Semana 3: Estado y Arquitectura
- [ ] Implementar Zustand stores
- [ ] Migrar de Context API
- [ ] Configurar React Query
- [ ] Refactorizar estructura de carpetas

### Semana 4: Optimización y Pulido
- [ ] Eliminar dependencias no usadas
- [ ] Optimizar imports y bundles
- [ ] Code splitting agresivo
- [ ] Documentación actualizada

## ✅ Checklist Pre-Refactoring

Antes de refactorizar cualquier módulo:
- [ ] Tests escritos y pasando
- [ ] Backup del código actual
- [ ] Métricas base capturadas
- [ ] Plan de rollback definido
- [ ] Equipo informado del cambio

## 🛡️ Estrategia de Rollback

Si algo sale mal:
1. **Git tags** antes de cada refactor mayor
2. **Feature flags** para cambios grandes
3. **Deployment gradual** con canary releases
4. **Monitoreo activo** de errores post-deploy

---

**Prioridad**: ALTA
**Duración**: 4 semanas
**Riesgo**: Medio (mitigado con tests)
**ROI**: Alto (mantenibilidad a largo plazo)
**Última Actualización**: 2025-07-30