import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Heart, 
  Moon,
  Footprints,
  Calendar,
  ChevronDown,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAppContext } from './AppProvider';
import { supabase } from '../utils/supabaseClient';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface AnalyticsData {
  date: string;
  sleep: number | null;
  steps: number | null;
  hrv: number | null;
  weight: number | null;
  mood: number | null;
  stress: number | null;
}

interface MetricSummary {
  current: number | null;
  previous: number | null;
  change: number | null;
  trend: 'up' | 'down' | 'stable';
}

const AnalyticsTab: React.FC = () => {
  const { currentUserId } = useAppContext();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sleep', 'steps', 'hrv']);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [summaries, setSummaries] = useState<Record<string, MetricSummary>>({});
  const [isLoading, setIsLoading] = useState(true);

  const timeRangeOptions = {
    '7d': { label: 'Últimos 7 días', days: 7 },
    '30d': { label: 'Últimos 30 días', days: 30 },
    '90d': { label: 'Últimos 90 días', days: 90 }
  };

  const metricConfigs = {
    sleep: {
      label: 'Sueño',
      color: '#3b82f6',
      unit: 'h',
      icon: Moon,
      target: 8
    },
    steps: {
      label: 'Pasos',
      color: '#10b981',
      unit: '',
      icon: Footprints,
      target: 10000
    },
    hrv: {
      label: 'HRV',
      color: '#8b5cf6',
      unit: 'ms',
      icon: Activity,
      target: 40
    },
    weight: {
      label: 'Peso',
      color: '#f59e0b',
      unit: 'kg',
      icon: BarChart3,
      target: null
    },
    mood: {
      label: 'Estado de Ánimo',
      color: '#ec4899',
      unit: '/10',
      icon: Heart,
      target: 7
    },
    stress: {
      label: 'Estrés',
      color: '#ef4444',
      unit: '/10',
      icon: TrendingUp,
      target: 3
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    fetchAnalyticsData();
  }, [currentUserId, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!currentUserId) return;
    
    setIsLoading(true);
    try {
      const days = timeRangeOptions[timeRange].days;
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      // Fetch biometric data for the time range
      const { data: biometricData, error } = await supabase
        .from('biometric_entries')
        .select('metric_type, value_numeric, entry_date')
        .eq('user_id', currentUserId)
        .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
        .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: true });

      if (error) throw error;

      // Process data into daily aggregates
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const processedData: AnalyticsData[] = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = biometricData?.filter(entry => 
          entry.entry_date.startsWith(dateStr)
        ) || [];

        const result: AnalyticsData = {
          date: format(date, 'd MMM', { locale: es }),
          sleep: null,
          steps: null,
          hrv: null,
          weight: null,
          mood: null,
          stress: null
        };

        // Aggregate metrics for the day
        Object.keys(metricConfigs).forEach(metric => {
          const entries = dayData.filter(entry => entry.metric_type === (metric === 'sleep' ? 'sleep_hours' : metric));
          if (entries.length > 0) {
            // For most metrics, take the average. For steps, take the sum.
            if (metric === 'steps') {
              result[metric as keyof AnalyticsData] = entries.reduce((sum, entry) => sum + entry.value_numeric, 0) as any;
            } else {
              const avg = entries.reduce((sum, entry) => sum + entry.value_numeric, 0) / entries.length;
              result[metric as keyof AnalyticsData] = parseFloat(avg.toFixed(1)) as any;
            }
          }
        });

        return result;
      });

      setAnalyticsData(processedData);

      // Calculate summaries
      const newSummaries: Record<string, MetricSummary> = {};
      Object.keys(metricConfigs).forEach(metric => {
        const validData = processedData
          .map(d => d[metric as keyof AnalyticsData] as number)
          .filter(v => v !== null);
        
        if (validData.length > 0) {
          const current = validData[validData.length - 1];
          const previous = validData.length > 1 ? validData[validData.length - 2] : null;
          const change = previous ? ((current - previous) / previous) * 100 : null;
          
          newSummaries[metric] = {
            current,
            previous,
            change,
            trend: change === null ? 'stable' : change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
          };
        }
      });

      setSummaries(newSummaries);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Fecha', ...selectedMetrics.map(m => metricConfigs[m as keyof typeof metricConfigs].label)],
      ...analyticsData.map(row => [
        row.date,
        ...selectedMetrics.map(metric => row[metric as keyof AnalyticsData] || '')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngx-pulse-analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-neutral-800 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Analíticas Avanzadas</h2>
          <p className="text-sm text-neutral-400">Análisis detallado de tus métricas de salud</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              {Object.entries(timeRangeOptions).map(([key, option]) => (
                <SelectItem key={key} value={key}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={exportData}
            variant="outline" 
            size="sm"
            className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(metricConfigs).map(([key, config]) => {
          const summary = summaries[key];
          if (!summary) return null;

          const IconComponent = config.icon;
          const trendColor = summary.trend === 'up' ? 'text-green-400' : 
                           summary.trend === 'down' ? 'text-red-400' : 'text-neutral-400';

          return (
            <div key={key} className="ngx-card group hover:bg-neutral-800/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-800" style={{ backgroundColor: `${config.color}20` }}>
                    <IconComponent size={18} style={{ color: config.color }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{config.label}</h3>
                    <p className="text-xs text-neutral-400">Promedio {timeRangeOptions[timeRange].label.toLowerCase()}</p>
                  </div>
                </div>
                
                {summary.change !== null && (
                  <div className={`flex items-center gap-1 ${trendColor}`}>
                    <TrendingUp size={14} className={summary.trend === 'down' ? 'rotate-180' : ''} />
                    <span className="text-xs font-medium">
                      {Math.abs(summary.change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-white">
                  {summary.current?.toFixed(key === 'steps' ? 0 : 1)}
                </span>
                <span className="text-xs text-neutral-400">{config.unit}</span>
              </div>
              
              {config.target && (
                <div className="mt-2 text-xs text-neutral-500">
                  Meta: {config.target}{config.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="ngx-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-white">Tendencias de Métricas</h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(metricConfigs).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedMetrics.includes(key) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedMetrics(prev => 
                    prev.includes(key) 
                      ? prev.filter(m => m !== key)
                      : [...prev, key]
                  );
                }}
                className={`text-xs ${
                  selectedMetrics.includes(key) 
                    ? 'bg-violet-600/20 border-violet-500 text-violet-400' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                }`}
                style={selectedMetrics.includes(key) ? { borderColor: config.color } : {}}
              >
                <config.icon size={12} className="mr-1" />
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
              />
              <Legend />
              
              {selectedMetrics.map(metric => {
                const config = metricConfigs[metric as keyof typeof metricConfigs];
                return (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={{ fill: config.color, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: config.color, strokeWidth: 2, fill: '#1f2937' }}
                    connectNulls={false}
                    name={config.label}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Distribution */}
        <div className="ngx-card">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Bar dataKey="sleep" fill="#3b82f6" name="Sueño (h)" />
                <Bar dataKey="steps" fill="#10b981" name="Pasos (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Score */}
        <div className="ngx-card">
          <h3 className="text-lg font-semibold text-white mb-4">Puntuación de Rendimiento</h3>
          <div className="space-y-4">
            {selectedMetrics.slice(0, 3).map(metric => {
              const config = metricConfigs[metric as keyof typeof metricConfigs];
              const summary = summaries[metric];
              if (!summary || !config.target) return null;

              const score = Math.min(100, (summary.current! / config.target) * 100);
              
              return (
                <div key={metric} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">{config.label}</span>
                    <span className="text-sm font-medium text-white">{score.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${score}%`,
                        backgroundColor: config.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;