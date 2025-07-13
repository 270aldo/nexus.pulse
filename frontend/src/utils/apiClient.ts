// NGX Pulse API Client - Centralized HTTP client with authentication and interceptors
import { supabase } from './supabaseClient';
import { toast } from 'sonner';

// Import authManager for auto-logout functionality
let authManager: any = null;
const getAuthManager = async () => {
  if (!authManager) {
    const { authManager: manager } = await import('./auth');
    authManager = manager;
  }
  return authManager;
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  traceId?: string;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  traceId?: string;
  timestamp?: string;
}

interface ErrorLogEntry {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  error: string;
  traceId: string;
  userId?: string;
  userAgent: string;
}

class ApiClient {
  private baseUrl: string;
  private errorLogs: ErrorLogEntry[] = [];

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id;
    } catch {
      return undefined;
    }
  }

  private logError(method: string, url: string, error: string, status?: number, traceId?: string): void {
    const errorLog: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      error,
      traceId: traceId || this.generateTraceId(),
      userAgent: navigator.userAgent
    };

    this.errorLogs.push(errorLog);

    // Keep only last 50 error logs in memory
    if (this.errorLogs.length > 50) {
      this.errorLogs = this.errorLogs.slice(-50);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('🔥 API Error:', errorLog);
    }

    // TODO: Send to error tracking service in production
    // this.sendErrorToTrackingService(errorLog);
  }

  private showUserFriendlyError(status?: number, message?: string): void {
    let userMessage = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';

    if (status) {
      switch (true) {
        case status === 401:
          userMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          // Redirect to login
          window.location.href = '/auth';
          return;
        case status === 403:
          userMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case status === 404:
          userMessage = 'El recurso solicitado no fue encontrado.';
          break;
        case status >= 500:
          userMessage = 'Error del servidor. El equipo técnico ha sido notificado.';
          break;
        case status >= 400 && status < 500:
          userMessage = message || 'Datos de solicitud inválidos.';
          break;
      }
    }

    toast.error(userMessage, {
      duration: 5000,
    });
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get Supabase session token
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response, method: string, url: string): Promise<ApiResponse<T>> {
    const traceId = this.generateTraceId();
    
    try {
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}`;
        
        // Handle authentication errors automatically
        if (response.status === 401 || response.status === 419) {
          try {
            const manager = await getAuthManager();
            console.warn(`🔒 Auto-logout triggered by ${response.status} response`);
            await manager.signOut();
            // Note: authManager.signOut() should handle redirect to /auth-page
          } catch (authError) {
            console.error('Failed to auto-logout:', authError);
          }
        }
        
        // Log error
        this.logError(method, url, errorMessage, response.status, traceId);
        
        // Show user-friendly error (but don't show auth errors since we're auto-logging out)
        if (response.status !== 401 && response.status !== 419) {
          this.showUserFriendlyError(response.status, errorMessage);
        }
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          traceId,
          data: undefined
        };
      }

      return {
        success: true,
        data,
        status: response.status,
        traceId,
        error: undefined
      };
    } catch (error) {
      const errorMessage = 'Error al procesar la respuesta del servidor';
      
      // Log parsing error
      this.logError(method, url, errorMessage, response.status, traceId);
      
      // Show user-friendly error
      this.showUserFriendlyError(response.status, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        status: response.status,
        traceId,
        data: undefined
      };
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const traceId = this.generateTraceId();
    
    try {
      const headers = await this.getAuthHeaders();
      headers['X-Trace-ID'] = traceId;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
      });
      
      return this.handleResponse<T>(response, 'GET', fullUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red';
      this.logError('GET', fullUrl, errorMessage, undefined, traceId);
      this.showUserFriendlyError(undefined, 'Error de conexión. Verifica tu conexión a internet.');
      
      return {
        success: false,
        error: errorMessage,
        traceId,
        data: undefined
      };
    }
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const traceId = this.generateTraceId();
    
    try {
      const headers = await this.getAuthHeaders();
      headers['X-Trace-ID'] = traceId;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response, 'POST', fullUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red';
      this.logError('POST', fullUrl, errorMessage, undefined, traceId);
      this.showUserFriendlyError(undefined, 'Error de conexión. Verifica tu conexión a internet.');
      
      return {
        success: false,
        error: errorMessage,
        traceId,
        data: undefined
      };
    }
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response, 'PUT', `${this.baseUrl}${endpoint}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      
      return this.handleResponse<T>(response, 'DELETE', `${this.baseUrl}${endpoint}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  // Debug methods for development
  getErrorLogs(): ErrorLogEntry[] {
    return [...this.errorLogs];
  }

  clearErrorLogs(): void {
    this.errorLogs = [];
    console.log('🧹 Error logs cleared');
  }

  getHealthStatus(): { healthy: boolean; errorRate: number; lastErrors: ErrorLogEntry[] } {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const recentErrors = this.errorLogs.filter(log => 
      new Date(log.timestamp).getTime() > lastHour
    );
    
    return {
      healthy: recentErrors.length < 10, // Healthy if less than 10 errors in the last hour
      errorRate: recentErrors.length,
      lastErrors: this.errorLogs.slice(-5) // Last 5 errors
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { ApiResponse, ApiError, ErrorLogEntry };