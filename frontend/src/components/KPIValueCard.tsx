import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import MetricSparkline, { MetricType } from "./MetricSparkline";
import EmptyStateSparkline from "./EmptyStateSparkline";

interface SparklineDataPoint {
  date: string;
  value: number | null;
}

interface KPIValueCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: string; // e.g., "text-sky-400"
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
  titleClassName?: string;
  iconContainerClassName?: string;
  onClick?: () => void;
  // Nuevas props para sparklines
  sparklineData?: SparklineDataPoint[];
  metricType?: MetricType;
  showSparkline?: boolean;
  onSparklineAction?: () => void;
  sparklineActionText?: string;
}

const KPIValueCard: React.FC<KPIValueCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  iconColor = "text-neutral-400",
  isLoading = false,
  className = "",
  valueClassName = "text-2xl font-bold",
  titleClassName = "text-xs font-medium text-neutral-400 tracking-wider uppercase",
  iconContainerClassName = "p-2 bg-neutral-700/50 rounded-lg",
  onClick,
  // Nuevas props para sparklines
  sparklineData,
  metricType,
  showSparkline = false,
  onSparklineAction,
  sparklineActionText,
}) => {
  return (
    <Card 
      className={`bg-neutral-800/75 border border-neutral-700/30 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl card-hover-depth hover-glow ${className} ${onClick ? 'cursor-pointer hover:border-neutral-700/50' : ''} group`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className={titleClassName}>{title}</CardTitle>
        {Icon && (
          <div className={iconContainerClassName}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-4 px-4 space-y-3">
        {/* Valor principal */}
        {isLoading ? (
          <div className="h-8 w-2/3 loading-skeleton rounded metric-loading" />
        ) : (
          <div className={`${valueClassName} text-neutral-50 transition-all duration-200`}>
            {value !== null && value !== undefined ? value : (
              <span className="text-neutral-500 breathing">N/A</span>
            )}
            {unit && value !== null && value !== undefined && <span className="text-xs ml-1 text-neutral-400">{unit}</span>}
          </div>
        )}

        {/* Sparkline */}
        {showSparkline && !isLoading && metricType && (
          <div className="mt-2">
            {sparklineData && sparklineData.length > 0 && sparklineData.some(point => point.value !== null) ? (
              <MetricSparkline
                metricType={metricType}
                data={sparklineData}
                height={20}
                className="transition-opacity duration-300 group-hover:opacity-80"
              />
            ) : (
              <EmptyStateSparkline
                metricType={metricType}
                height={20}
                icon={Icon}
                onAction={onSparklineAction}
                actionText={sparklineActionText}
                className="transition-opacity duration-300 group-hover:opacity-90"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPIValueCard;