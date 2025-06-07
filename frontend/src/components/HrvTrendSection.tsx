import React from 'react';
import StyledContentBox from "./StyledContentBox";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface HrvDataPoint {
  date: string;
  hrv: number | null;
}

interface Props {
  hrv7DayTrend: HrvDataPoint[];
  isLoadingMetrics: boolean;
  title?: string;
}

const HrvTrendSection: React.FC<Props> = ({ hrv7DayTrend, isLoadingMetrics, title = "Tendencia HRV (Últimos 7d)" }) => {
  return (
    <StyledContentBox title={title}>
      {isLoadingMetrics ? (
        <div className="flex items-center justify-center h-full min-h-[180px]">
          <p className="text-neutral-400 text-sm">Cargando datos de HRV...</p>
        </div>
      ) : hrv7DayTrend && hrv7DayTrend.some(d => d.hrv !== null) ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={hrv7DayTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#a3a3a3' }} 
              axisLine={{ stroke: '#525252' }} 
              tickLine={{ stroke: '#525252' }} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#a3a3a3' }} 
              axisLine={{ stroke: '#525252' }} 
              tickLine={{ stroke: '#525252' }} 
              domain={['dataMin - 5', 'dataMax + 5']}
              unit="ms" // Added unit for clarity on YAxis if needed, though usually formatter handles it
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(38, 38, 38, 0.85)', 
                borderColor: '#525252', 
                borderRadius: '0.5rem', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                color: '#e5e5e5',
              }}
              labelStyle={{ fontWeight: 'bold', color: '#c084fc' }}
              itemStyle={{ color: '#e5e5e5' }}
              formatter={(value: number) => [`${value} ms`, 'HRV']}
            />
            <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ fontSize: '12px', color: '#a3a3a3' }}/>
            <Line 
              type="monotone" 
              dataKey="hrv" 
              name="HRV Promedio Diario"
              stroke="#c084fc" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#c084fc', strokeWidth: 1, stroke: '#262626' }}
              activeDot={{ r: 5, fill: '#c084fc', strokeWidth: 2, stroke: '#171717' }}
              connectNulls={true} 
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[180px]">
          <p className="text-neutral-400 text-sm">No hay suficientes datos de HRV para mostrar la tendencia.</p>
        </div>
      )}
    </StyledContentBox>
  );
};

export default HrvTrendSection;
