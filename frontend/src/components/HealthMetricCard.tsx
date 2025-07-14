import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'health';
  isEmpty?: boolean;
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  variant = 'default',
  isEmpty = false
}) => {
  const cardClasses = [
    'ngx-card',
    variant === 'primary' && 'ngx-card--primary',
    variant === 'health' && 'ngx-card--health'
  ].filter(Boolean).join(' ');

  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="w-3 h-3" />;
      case 'negative':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  if (isEmpty) {
    return (
      <div className={cardClasses}>
        <div className="ngx-empty-state">
          {icon && <div className="ngx-empty-state__icon">{icon}</div>}
          <h3 className="ngx-empty-state__title">{title}</h3>
          <p className="ngx-empty-state__description">
            Conecta tu dispositivo o registra datos manualmente para ver esta métrica
          </p>
          <button className="ngx-btn ngx-btn--secondary">
            Registrar datos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      <div className="ngx-metric">
        {icon && (
          <div className="flex justify-center mb-3 text-ngx-primary">
            {icon}
          </div>
        )}
        
        <div className="ngx-metric__value">
          {value}
          {unit && <span className="text-lg text-ngx-muted ml-1">{unit}</span>}
        </div>
        
        <div className="ngx-metric__label">{title}</div>
        
        {trend && trendValue && (
          <div className={`ngx-metric__trend ngx-metric__trend--${trend}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de ejemplo para mostrar el uso
export const HealthMetricsGrid: React.FC = () => {
  const metrics = [
    {
      title: 'Frecuencia Cardíaca',
      value: 72,
      unit: 'bpm',
      trend: 'positive' as const,
      trendValue: '+2% esta semana',
      icon: <div className="w-6 h-6 bg-ngx-health-heart rounded-full" />,
      variant: 'health' as const
    },
    {
      title: 'Horas de Sueño',
      value: 7.5,
      unit: 'hrs',
      trend: 'neutral' as const,
      trendValue: 'Meta alcanzada',
      icon: <div className="w-6 h-6 bg-ngx-health-sleep rounded-full" />,
      variant: 'primary' as const
    },
    {
      title: 'Nivel de Energía',
      value: '',
      isEmpty: true,
      icon: <div className="w-6 h-6 bg-ngx-health-energy rounded-full" />
    },
    {
      title: 'Recuperación',
      value: 85,
      unit: '%',
      trend: 'positive' as const,
      trendValue: '+12% vs ayer',
      icon: <div className="w-6 h-6 bg-ngx-health-recovery rounded-full" />,
      variant: 'health' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <HealthMetricCard key={index} {...metric} />
      ))}
    </div>
  );
};