import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
}

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-brand-violet">¡Error de Aplicación!</h1>
        <p className="text-lg mb-6 text-neutral-300">
          La aplicación ha encontrado un error inesperado.
        </p>
        <div className="space-y-4">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-6 py-3 bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold rounded-lg transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </div>
    </div>
  );
};

export const OuterErrorBoundary = ({ children }: Props) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error("Caught error in AppWrapper", error.message, error.stack);
      }}
      onReset={() => {
        window.location.href = '/';
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
