import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LazyPageLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultLoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center">
    <Card className="w-80 bg-neutral-900 border-neutral-700/50 shadow-2xl shadow-black/60">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Animated NGX Pulse logo */}
          <div className="mx-auto w-12 h-12 bg-brand-violet rounded-full flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 bg-white rounded-full animate-ping"></div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-violet">NGX Pulse</h3>
            <p className="text-sm text-neutral-400">Cargando...</p>
          </div>
          
          {/* Progress bar animation */}
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-violet to-purple-400 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const LazyPageLoader: React.FC<LazyPageLoaderProps> = ({ 
  children, 
  fallback = <DefaultLoadingFallback /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Custom CSS for progress bar animation (add to global CSS or styled component)
const progressKeyframes = `
  @keyframes progress {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject keyframes if not already present
if (typeof document !== 'undefined' && !document.getElementById('lazy-loader-styles')) {
  const style = document.createElement('style');
  style.id = 'lazy-loader-styles';
  style.textContent = progressKeyframes;
  document.head.appendChild(style);
}

export default LazyPageLoader;