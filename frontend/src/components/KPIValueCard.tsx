import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

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
}) => {
  return (
    <Card 
      className={`bg-neutral-800/75 border border-neutral-700/30 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl ${className} ${onClick ? 'cursor-pointer hover:border-neutral-700/50' : ''}`}
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
      <CardContent className="pb-4 px-4">
        {isLoading ? (
          <div className="h-8 w-2/3 bg-neutral-700 rounded animate-pulse" />
        ) : (
          <div className={`${valueClassName} text-neutral-50`}>
            {value !== null && value !== undefined ? value : "N/A"}
            {unit && value !== null && value !== undefined && <span className="text-xs ml-1 text-neutral-400">{unit}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPIValueCard;