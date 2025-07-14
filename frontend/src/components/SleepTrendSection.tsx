import React from 'react';
import StyledContentBox from "./StyledContentBox";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SleepDataPoint {
  date: string;
  hours: number | null;
}

interface Props {
  sleep7DayTrend: SleepDataPoint[];
  isLoadingMetrics: boolean;
  title?: string;
}

const SleepTrendSection: React.FC<Props> = ({ sleep7DayTrend, isLoadingMetrics, title = "Tendencia: Sueño (Últimos 7d)" }) => {
  return (
    <div className="ngx-card h-full">{/* USAR ngx-card EN LUGAR DE StyledContentBox */}
      <h3 className="text-base font-semibold text-white mb-4 pb-2 border-b border-neutral-700/50">
        {title}
      </h3>
      {isLoadingMetrics ? (
        <div className="flex items-center justify-center h-full min-h-[600px]">
          <p className="text-neutral-400 text-sm">Cargando datos de sueño...</p>
        </div>
      ) : sleep7DayTrend && sleep7DayTrend.some(d => d.hours !== null) ? (
        <ResponsiveContainer width="100%" height={600}>
          <AreaChart data={sleep7DayTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSleepSection" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
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
              domain={['dataMin - 1', 'dataMax + 1']} 
              unit="h"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(38, 38, 38, 0.85)', 
                borderColor: '#525252', 
                borderRadius: '0.5rem', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                color: '#e5e5e5',
              }}
              labelStyle={{ fontWeight: 'bold', color: '#818cf8' }}
              itemStyle={{ color: '#e5e5e5' }}
              formatter={(value: number) => [`${value} h`, 'Horas de Sueño']}
            />
            <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ fontSize: '12px', color: '#a3a3a3' }}/>
            <Area 
              type="monotone" 
              dataKey="hours" 
              name="Horas de Sueño"
              stroke="#818cf8" 
              fillOpacity={1}
              fill="url(#colorSleepSection)" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#818cf8', strokeWidth: 1, stroke: '#262626' }}
              activeDot={{ r: 5, fill: '#818cf8', strokeWidth: 2, stroke: '#171717' }}
              connectNulls={true} 
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[600px]">
          <p className="text-neutral-400 text-sm">No hay suficientes datos de sueño para mostrar la tendencia.</p>
        </div>
      )}
    </div>
  );
};

export default SleepTrendSection;
