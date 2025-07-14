import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MetricType } from './MetricSparkline';

interface EmptyStateSparklineProps {
  metricType: MetricType;
  height?: number;
  icon?: LucideIcon;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

// Configuración de gradientes por tipo de métrica
const METRIC_GRADIENTS: Record<MetricType, string> = {
  sleep: 'from-blue-500/20 to-blue-600/10',
  steps: 'from-emerald-500/20 to-emerald-600/10',
  hrv: 'from-violet-500/20 to-violet-600/10',
  weight: 'from-amber-500/20 to-amber-600/10',
  mood: 'from-pink-500/20 to-pink-600/10',
  stress: 'from-red-500/20 to-red-600/10',
  energy: 'from-orange-500/20 to-orange-600/10',
  nutrition: 'from-cyan-500/20 to-cyan-600/10',
};

// Mensajes por defecto por tipo de métrica
const DEFAULT_MESSAGES: Record<MetricType, string> = {
  sleep: 'Sin datos de sueño',
  steps: 'Sin datos de pasos',
  hrv: 'Sin datos de HRV',
  weight: 'Sin datos de peso',
  mood: 'Sin datos de humor',
  stress: 'Sin datos de estrés',
  energy: 'Sin datos de energía',
  nutrition: 'Sin datos nutricionales',
};

// CTAs por defecto por tipo de métrica
const DEFAULT_ACTIONS: Record<MetricType, string> = {
  sleep: 'Registrar',
  steps: 'Conectar',
  hrv: 'Medir',
  weight: 'Añadir',
  mood: 'Registrar',
  stress: 'Registrar',
  energy: 'Registrar',
  nutrition: 'Registrar',
};

const EmptyStateSparkline: React.FC<EmptyStateSparklineProps> = ({
  metricType,
  height = 40,
  icon: Icon,
  message,
  actionText,
  onAction,
  className = '',
}) => {
  const gradient = METRIC_GRADIENTS[metricType];
  const defaultMessage = DEFAULT_MESSAGES[metricType];
  const defaultAction = DEFAULT_ACTIONS[metricType];

  return (
    <div 
      className={`relative w-full flex items-center justify-center rounded border-dashed border border-neutral-700/20 bg-neutral-800/10 ${className}`}
      style={{ height }}
    >
      {/* Línea de placeholder simple */}
      <div className="absolute inset-x-2 top-1/2 transform -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-neutral-600/30 to-transparent"></div>
      
      {/* Contenido centrado muy simple */}
      <div className="flex items-center space-x-1 bg-neutral-900/80 px-2 py-1 rounded text-xs">
        <span className="text-neutral-500">{message || defaultMessage}</span>
        {onAction && (
          <button
            onClick={onAction}
            className="text-neutral-400 hover:text-neutral-300 transition-colors underline ml-1"
          >
            {actionText || defaultAction}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyStateSparkline;