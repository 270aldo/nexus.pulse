import React from 'react';
import SparklineChart from './SparklineChart';

interface MetricDataPoint {
  date: string;
  value: number | null;
}

export type MetricType = 'sleep' | 'steps' | 'hrv' | 'weight' | 'mood' | 'stress' | 'energy' | 'nutrition';

interface MetricSparklineProps {
  metricType: MetricType;
  data: MetricDataPoint[];
  height?: number;
  showDots?: boolean;
  className?: string;
}

// Configuración de colores temáticos por tipo de métrica
const METRIC_COLORS: Record<MetricType, string> = {
  sleep: '#3b82f6',      // blue-500 - Azul calmante para sueño
  steps: '#10b981',      // emerald-500 - Verde energético para actividad
  hrv: '#8b5cf6',        // violet-500 - Púrpura para HRV (brand color)
  weight: '#f59e0b',     // amber-500 - Ámbar para peso
  mood: '#ec4899',       // pink-500 - Rosa para estado de ánimo
  stress: '#ef4444',     // red-500 - Rojo para estrés
  energy: '#f97316',     // orange-500 - Naranja para energía
  nutrition: '#06b6d4',  // cyan-500 - Cian para nutrición
};

// Configuración de formato de valores para tooltip
const METRIC_FORMATS: Record<MetricType, { unit: string; decimals: number }> = {
  sleep: { unit: 'h', decimals: 1 },
  steps: { unit: '', decimals: 0 },
  hrv: { unit: 'ms', decimals: 0 },
  weight: { unit: 'kg', decimals: 1 },
  mood: { unit: '/10', decimals: 1 },
  stress: { unit: '/10', decimals: 1 },
  energy: { unit: '/10', decimals: 1 },
  nutrition: { unit: '%', decimals: 0 },
};

const MetricSparkline: React.FC<MetricSparklineProps> = ({
  metricType,
  data,
  height = 40,
  showDots = false,
  className = '',
}) => {
  const color = METRIC_COLORS[metricType];
  const format = METRIC_FORMATS[metricType];

  // Generar datos de placeholder si no hay datos reales
  const hasValidData = data.some(point => point.value !== null);
  
  if (!hasValidData) {
    return (
      <div className={`relative ${className} flex items-center justify-center`} style={{ height }}>
        <div className="w-full h-full bg-neutral-800/20 rounded border border-dashed border-neutral-700/30 flex items-center justify-center">
          <span className="text-xs text-neutral-500">Sin datos de {metricType}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <SparklineChart
        data={data}
        color={color}
        strokeWidth={1.5}
        height={height}
        showDots={showDots}
        animated={true}
      />
      
      {/* Tooltip hover con último valor */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white shadow-lg">
          {(() => {
            const lastValidPoint = data.slice().reverse().find(point => point.value !== null);
            if (lastValidPoint) {
              const formattedValue = lastValidPoint.value!.toFixed(format.decimals);
              return `${formattedValue}${format.unit}`;
            }
            return 'N/A';
          })()}
        </div>
      </div>
    </div>
  );
};

export default MetricSparkline;