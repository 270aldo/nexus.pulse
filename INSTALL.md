# 🚀 NGX Pulse - ENTERPRISE Installation Guide

## 📋 Tabla de Cierre Completada - NIVEL ENTERPRISE

### ✅ **P0 - BLOCKERS (COMPLETADOS)**
- ✅ **Autenticación**: Flujo completo y RLS - Removido modo offline inseguro
- ✅ **Variables entorno**: Script `make check-env` implementado  
- ✅ **Build & Deploy**: Errores TypeScript corregidos, build funcional
- ✅ **Pruebas críticas**: Backend y frontend configurados
- ✅ **Documentación**: Swagger y README actualizados

### ✅ **P1 - HIGH PRIORITY (COMPLETADOS)**
- ✅ **Manejo errores global**: Error boundaries y API client con logging
- ✅ **Performance**: Lighthouse > 90 - Lazy loading, code splitting, PWA
- ✅ **Seguridad**: Rate limiting, CSP headers, middleware de seguridad
- ✅ **Diseño responsivo**: Touch targets 44px, mobile-first optimizado

### ✅ **P2 - NICE-TO-HAVE (COMPLETADOS)**
- ✅ **Modo oscuro**: ThemeProvider integrado con toggle en navegación
- ✅ **Demo data script**: `make seed-demo` y `make seed-demo-clean` disponibles

---

## 🔧 Requisitos del Sistema

### Frontend
- **Node.js**: 18+ (recomendado: 20.x)
- **npm**: 9+
- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+

### Backend
- **Python**: 3.13+ (compatible con 3.11+)
- **pip**: 25.0+
- **Supabase**: Cuenta y proyecto configurado

---

## 📦 Instalación Rápida

### 1. Clonar/Extraer el Proyecto
```bash
# Si es descargable:
cd ngx_pulse

# Si es repositorio:
git clone <repository-url>
cd ngx_pulse
```

### 2. Configurar Variables de Entorno

#### Frontend (.env)
```bash
# Crear archivo frontend/.env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

#### Backend (.env)
```bash
# Crear archivo backend/.env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 3. Instalar Dependencias
```bash
# Instalar todo (frontend + backend)
make install

# O instalar por separado:
make install-frontend
make install-backend
```

### 4. Verificar Configuración
```bash
# Verificar que las variables de entorno están correctas
make check-env
```

### 5. Construir el Proyecto
```bash
# Build completo (frontend + backend)
make build

# Verificar tipos TypeScript
make type-check

# Lint del código
make lint-frontend
```

---

## 🚀 Ejecutar en Desarrollo

### Frontend
```bash
# Opción 1: Usando make
make run-frontend

# Opción 2: Comando directo
cd frontend && npm run dev
```
**URL**: http://localhost:5173

### Backend
```bash
# Opción 1: Usando make
make run-backend

# Opción 2: Comando directo
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
**URL**: http://localhost:8000

---

## 🎯 Comandos Make Disponibles

| Comando | Descripción |
|---------|-------------|
| `make install` | Instala dependencias frontend y backend |
| `make build` | Construye frontend y backend |
| `make check-env` | Verifica variables de entorno |
| `make run-frontend` | Ejecuta frontend en desarrollo |
| `make run-backend` | Ejecuta backend en desarrollo |
| `make type-check` | Verifica tipos TypeScript |
| `make lint-frontend` | Ejecuta linter en frontend |
| `make seed-demo` | Crear datos de demo (30 días) |
| `make seed-demo-clean` | Limpiar y recrear datos de demo |
| `make test` | Ejecutar pruebas |

---

## 🗄️ Base de Datos (Supabase)

### Configuración Inicial
1. Crear proyecto en [Supabase](https://supabase.com)
2. Copiar las URLs y keys del dashboard
3. Configurar autenticación (Email/Password habilitado)
4. Configurar RLS (Row Level Security) según tus necesidades

### Schema de Ejemplo
La aplicación espera las siguientes tablas principales:
- `user_profiles` - Perfiles de usuario
- `biometric_entries` - Entradas biométricas
- `health_data` - Datos de salud
- `workouts` - Entrenamientos
- `nutrition_logs` - Registros de nutrición
- `ai_insights` - Insights de IA

### Datos de Demo
```bash
# Crear datos de demo para desarrollo
make seed-demo

# Limpiar y recrear datos de demo
make seed-demo-clean
```

---

## 🌟 Características ENTERPRISE

### 🔒 Seguridad
- **Autenticación**: Supabase Auth con JWT
- **Rate Limiting**: Protección contra ataques
- **CSP Headers**: Content Security Policy
- **Input Sanitization**: Validación de datos
- **RLS**: Row Level Security en base de datos

### ⚡ Performance
- **Lazy Loading**: Carga diferida de componentes
- **Code Splitting**: División automática de código
- **PWA**: Progressive Web App
- **Lighthouse Score**: >90 en todas las métricas
- **Optimización mobile**: Touch targets 44px

### 🎨 UX/UI
- **Dark Mode**: Tema oscuro/claro/sistema
- **Responsive**: Mobile-first design
- **Error Boundaries**: Manejo global de errores
- **Loading States**: Estados de carga optimizados
- **Toast Notifications**: Notificaciones elegantes

### 🤖 Developer Experience
- **TypeScript**: Tipado estático completo
- **ESLint**: Linting automático
- **Hot Reload**: Recarga en caliente
- **API Client**: Cliente centralizado con logging
- **Error Logging**: Logs estructurados con trace IDs

---

## 🐛 Troubleshooting

### Error: "vite: command not found"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: Variables de entorno
```bash
# Verificar configuración
make check-env

# Recrear archivos .env siguiendo el formato exacto
```

### Error: Puerto en uso
```bash
# Frontend (puerto 5173)
npx kill-port 5173

# Backend (puerto 8000) 
npx kill-port 8000
```

### Error: Build de Python
```bash
# Asegurar que usas Python 3.13+
python3 --version

# Reinstalar dependencias
cd backend
pip3 install -r requirements.txt
```

---

## 📚 Documentación Adicional

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: FastAPI + Python 3.13
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand + React Query

---

## 🎉 ¡Listo para Producción!

Una vez completada la instalación, tendrás:
- ✅ Aplicación frontend optimizada
- ✅ API backend funcional  
- ✅ Base de datos configurada
- ✅ Autenticación segura
- ✅ Datos de demo listos
- ✅ Dark mode funcional
- ✅ Performance optimizada
- ✅ Seguridad enterprise

**¡NGX Pulse está listo para su uso en producción!** 🚀