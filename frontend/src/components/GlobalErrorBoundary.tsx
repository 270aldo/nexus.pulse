import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔥 Global Error Boundary caught an error:', error);
      console.error('📍 Error Info:', errorInfo);
    }

    // Log error to external service in production
    this.logErrorToService(error, errorInfo);

    // Show toast notification
    toast.error('Se produjo un error inesperado. El equipo ha sido notificado.', {
      duration: 5000,
    });
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to your error tracking service
    // e.g., Sentry, LogRocket, Bugsnag, etc.
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user_id') || 'anonymous'
    };

    // For now, just log to console
    console.error('🚨 Error logged:', errorLog);

    // TODO: Send to error tracking service
    // errorTrackingService.log(errorLog);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard-page';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-neutral-900 border-neutral-700/50 shadow-2xl shadow-black/60">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-400">
                Algo salió mal
              </CardTitle>
              <CardDescription className="text-neutral-400 mt-2">
                Se produjo un error inesperado. Nuestro equipo ha sido notificado automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
                <p className="text-xs text-neutral-500 mb-1">ID del Error (para soporte)</p>
                <code className="text-xs text-neutral-300 font-mono break-all">
                  {this.state.errorId}
                </code>
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
                  <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-400">
                    🛠️ Detalles del Error (Solo Desarrollo)
                  </summary>
                  <div className="mt-2 text-xs text-red-300 font-mono whitespace-pre-wrap max-h-32 overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 bg-brand-violet hover:bg-brand-violet/90 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al Dashboard
                </Button>
              </div>

              <Button 
                onClick={this.handleReload}
                variant="ghost"
                className="w-full text-neutral-500 hover:text-neutral-300"
              >
                Recargar página completa
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;