# 🧪 Estrategia de Testing - NGX Pulse

## 📊 Estado Actual vs Objetivo

### Métricas Actuales
- **Cobertura Total**: ~1% (3 tests)
- **Backend**: 3 tests unitarios básicos
- **Frontend**: 0 tests
- **E2E**: 0 tests
- **Performance**: 0 tests

### Objetivos
- **Cobertura Total**: 80%+
- **Backend**: 85% (crítico: 95%)
- **Frontend**: 75% (crítico: 90%)
- **E2E**: 50% flujos críticos
- **Performance**: Principales endpoints

## 🎯 Estrategia por Capas

### 1. Testing Pyramid
```
         /\
        /E2E\        (10%) - Flujos críticos completos
       /------\
      /Integra-\     (30%) - APIs, DB, servicios externos
     /  tion    \
    /------------\
   /   Unit      \   (60%) - Lógica de negocio, componentes
  /________________\
```

## 🔧 Configuración de Herramientas

### Backend Testing Stack

#### 1. Pytest Configuration
```python
# backend/pytest.ini
[tool:pytest]
minversion = 6.0
addopts = 
    -ra 
    -q 
    --strict-markers
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

[tool:pytest:markers]
unit: Unit tests
integration: Integration tests
e2e: End-to-end tests
slow: Slow running tests
security: Security related tests
```

#### 2. Test Structure
```bash
backend/
├── tests/
│   ├── conftest.py          # Fixtures globales
│   ├── unit/
│   │   ├── test_auth.py
│   │   ├── test_validators.py
│   │   ├── test_services.py
│   │   └── test_utils.py
│   ├── integration/
│   │   ├── test_api_auth.py
│   │   ├── test_api_health.py
│   │   ├── test_api_chat.py
│   │   └── test_database.py
│   ├── security/
│   │   ├── test_authentication.py
│   │   ├── test_authorization.py
│   │   └── test_input_validation.py
│   └── performance/
│       └── test_load.py
```

#### 3. Fixtures Esenciales
```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import asyncio
from typing import Generator

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_db():
    """Create test database"""
    engine = create_engine("sqlite:///./test.db")
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db) -> Generator:
    """Create test client"""
    from app.main import app
    from app.database import get_db
    
    def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """Get auth headers for protected endpoints"""
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def mock_openai(monkeypatch):
    """Mock OpenAI API calls"""
    class MockCompletion:
        @staticmethod
        def create(**kwargs):
            return {
                "choices": [{
                    "message": {
                        "content": "Mocked AI response"
                    }
                }]
            }
    
    monkeypatch.setattr("openai.ChatCompletion", MockCompletion)
```

### Frontend Testing Stack

#### 1. Vitest Configuration
```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*'
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

#### 2. Test Setup
```typescript
// frontend/src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

#### 3. Testing Utilities
```typescript
// frontend/src/test/utils.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

interface TestProviderProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: TestProviderProps) => {
  const testQueryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## 📝 Ejemplos de Tests por Tipo

### 1. Unit Tests - Backend

#### Auth Service Test
```python
# backend/tests/unit/test_auth_service.py
import pytest
from app.services.auth import AuthService
from app.core.security import verify_password, get_password_hash

class TestAuthService:
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "securepassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    def test_jwt_creation_and_validation(self):
        """Test JWT token creation and validation"""
        auth_service = AuthService()
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        
        token = auth_service.create_access_token(user_id)
        decoded = auth_service.verify_token(token)
        
        assert decoded["sub"] == user_id
        assert "exp" in decoded
    
    @pytest.mark.asyncio
    async def test_user_authentication(self, test_db):
        """Test user authentication flow"""
        auth_service = AuthService(db=test_db)
        
        # Create test user
        user = await auth_service.create_user(
            email="test@example.com",
            password="testpass123"
        )
        
        # Test successful authentication
        authenticated = await auth_service.authenticate_user(
            email="test@example.com",
            password="testpass123"
        )
        assert authenticated.id == user.id
        
        # Test failed authentication
        with pytest.raises(ValueError):
            await auth_service.authenticate_user(
                email="test@example.com",
                password="wrongpass"
            )
```

### 2. Unit Tests - Frontend

#### Component Test
```typescript
// frontend/src/components/dashboard/__tests__/MetricCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { MetricCard } from '../MetricCard'

describe('MetricCard', () => {
  it('renders metric information correctly', () => {
    render(
      <MetricCard
        title="Sleep"
        value="7.5"
        unit="hours"
        trend={0.5}
        icon="moon"
      />
    )
    
    expect(screen.getByText('Sleep')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('hours')).toBeInTheDocument()
  })
  
  it('shows positive trend indicator', () => {
    render(
      <MetricCard
        title="Steps"
        value="10,000"
        trend={15}
      />
    )
    
    const trendElement = screen.getByText('+15%')
    expect(trendElement).toHaveClass('text-green-500')
  })
  
  it('shows negative trend indicator', () => {
    render(
      <MetricCard
        title="Stress"
        value="High"
        trend={-10}
      />
    )
    
    const trendElement = screen.getByText('-10%')
    expect(trendElement).toHaveClass('text-red-500')
  })
})
```

#### Hook Test
```typescript
// frontend/src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { vi } from 'vitest'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  
  it('initializes with no user when not authenticated', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
  
  it('logs in user successfully', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.user).toEqual({
      email: 'test@example.com',
      id: expect.any(String)
    })
    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### 3. Integration Tests

#### API Integration Test
```python
# backend/tests/integration/test_api_health.py
import pytest
from fastapi.testclient import TestClient

class TestHealthAPI:
    def test_create_health_entry(self, client: TestClient, auth_headers: dict):
        """Test creating a health data entry"""
        response = client.post(
            "/api/v1/health-data",
            headers=auth_headers,
            json={
                "date": "2025-07-30",
                "sleep_hours": 7.5,
                "hrv": 65,
                "steps": 10000,
                "mood": "good"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["sleep_hours"] == 7.5
        assert "id" in data
    
    def test_get_health_summary(self, client: TestClient, auth_headers: dict):
        """Test retrieving health summary"""
        # Create test data first
        for i in range(7):
            client.post(
                "/api/v1/health-data",
                headers=auth_headers,
                json={
                    "date": f"2025-07-{23+i}",
                    "sleep_hours": 7 + i * 0.1,
                    "steps": 8000 + i * 500
                }
            )
        
        # Get summary
        response = client.get(
            "/api/v1/health-data/summary?days=7",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        summary = response.json()
        assert "average_sleep" in summary
        assert "total_steps" in summary
        assert summary["days_tracked"] == 7
```

### 4. E2E Tests

#### Playwright E2E Test
```typescript
// e2e/tests/auth-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can sign up, login, and access dashboard', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup')
    
    // Fill signup form
    await page.fill('[name="email"]', 'newuser@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="confirmPassword"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
    
    // Login with created account
    await page.fill('[name="email"]', 'newuser@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    
    // Should be back on dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})
```

## 🎯 Plan de Implementación por Fases

### Fase 1: Setup y Tests Críticos (Días 1-2)

#### Backend
- [ ] Configurar pytest y fixtures
- [ ] Tests de autenticación (100% cobertura)
- [ ] Tests de autorización
- [ ] Tests de validación de datos

#### Frontend
- [ ] Configurar Vitest
- [ ] Tests de componentes críticos (Login, Dashboard)
- [ ] Tests de hooks de autenticación
- [ ] Tests de utilidades API

### Fase 2: Cobertura Core (Días 3-4)

#### Backend
- [ ] Tests de servicios principales
- [ ] Tests de APIs CRUD
- [ ] Tests de integración con DB
- [ ] Tests de middleware

#### Frontend
- [ ] Tests de todas las páginas
- [ ] Tests de componentes UI
- [ ] Tests de estado global
- [ ] Tests de rutas protegidas

### Fase 3: E2E y Performance (Día 5)

- [ ] Configurar Playwright
- [ ] E2E flujos críticos (auth, CRUD)
- [ ] Tests de performance con k6
- [ ] Tests de seguridad automatizados

## 📊 Métricas y Reportes

### Coverage Reports
```bash
# Backend coverage
cd backend && pytest --cov=app --cov-report=html

# Frontend coverage
cd frontend && npm run test:coverage

# E2E tests
npm run test:e2e
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run Backend Tests
  run: |
    cd backend
    pytest --cov=app --cov-fail-under=80
    
- name: Run Frontend Tests
  run: |
    cd frontend
    npm run test:ci
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## ✅ Checklist de Calidad

### Tests Deben:
- [ ] Ser independientes entre sí
- [ ] Usar datos de prueba aislados
- [ ] Limpiar después de ejecutarse
- [ ] Tener nombres descriptivos
- [ ] Cubrir casos edge
- [ ] Ser rápidos (<100ms unit, <1s integration)

### No Deben:
- [ ] Depender de servicios externos reales
- [ ] Modificar datos de producción
- [ ] Tener sleeps o waits hardcodeados
- [ ] Compartir estado entre tests

## 🚀 Scripts de Automatización

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ci": "vitest run --coverage --reporter=json",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

**Meta**: 80% cobertura en 5 días
**Prioridad**: CRÍTICA
**Responsable**: Todo el equipo
**Última Actualización**: 2025-07-30