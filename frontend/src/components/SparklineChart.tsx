import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineDataPoint {
  date: string;
  value: number | null;
}

interface SparklineChartProps {
  data: SparklineDataPoint[];
  color?: string;
  strokeWidth?: number;
  height?: number;
  showDots?: boolean;
  animated?: boolean;
  className?: string;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = '#8b5cf6', // brand-violet por defecto
  strokeWidth = 1.5,
  height = 40,
  showDots = false,
  animated = true,
  className = '',
}) => {
  // Filtrar datos nulos para el gráfico
  const validData = data.filter(point => point.value !== null);
  
  // Si no hay datos válidos, mostrar línea plana
  if (validData.length === 0) {
    return (
      <div className={`w-full ${className} flex items-center justify-center`} style={{ height }}>
        <div className="w-full h-full bg-neutral-800/30 rounded border border-dashed border-neutral-700/50 flex items-center justify-center">
          <span className="text-xs text-neutral-500">Sin datos</span>
        </div>
      </div>
    );
  }

  // Calcular el rango Y para mejor visualización
  const values = validData.map(d => d.value as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 1; // 10% padding o mínimo 1

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <YAxis 
            hide 
            domain={[minValue - padding, maxValue + padding]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={false}
            connectNulls={false}
            animationDuration={animated ? 800 : 0}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;