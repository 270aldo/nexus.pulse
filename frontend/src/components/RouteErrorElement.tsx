import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';

const RouteErrorElement: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Oops! Algo salió mal</h1>
          <p className="text-neutral-300 mb-6">
            La página que intentas acceder tiene un problema técnico.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold rounded-lg transition-colors"
          >
            Ir al Inicio
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
          >
            Recargar Página
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-neutral-400 hover:text-neutral-300">
              Detalles del error (solo desarrollo)
            </summary>
            <pre className="mt-2 p-3 bg-neutral-800 rounded text-xs text-red-300 overflow-auto max-h-32">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default RouteErrorElement;