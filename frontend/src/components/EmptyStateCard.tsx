import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact' | 'illustrated';
  iconColor?: string;
  gradient?: string;
  className?: string;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  variant = 'default',
  iconColor = 'text-neutral-400',
  gradient = 'from-neutral-500/10 to-neutral-600/5',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          cardClass: 'p-4',
          iconSize: 'w-8 h-8',
          titleClass: 'text-sm font-medium',
          descClass: 'text-xs',
          buttonClass: 'text-xs px-2 py-1'
        };
      case 'illustrated':
        return {
          cardClass: 'p-6 text-center',
          iconSize: 'w-16 h-16',
          titleClass: 'text-lg font-semibold',
          descClass: 'text-sm',
          buttonClass: 'text-sm px-4 py-2'
        };
      default:
        return {
          cardClass: 'p-5',
          iconSize: 'w-12 h-12',
          titleClass: 'text-base font-medium',
          descClass: 'text-sm',
          buttonClass: 'text-sm px-3 py-2'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={`bg-gradient-to-br ${gradient} border border-neutral-700/30 hover:border-neutral-600/50 transition-all duration-300 group ${className}`}>
      <CardContent className={`${styles.cardClass} space-y-4 flex flex-col items-center justify-center min-h-[200px]`}>
        {/* Icono con animación */}
        <div className={`${styles.iconSize} flex items-center justify-center bg-neutral-800/50 rounded-full p-3 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`${styles.iconSize} ${iconColor} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />
        </div>

        {/* Contenido */}
        <div className="space-y-2 text-center">
          <h3 className={`${styles.titleClass} text-white`}>
            {title}
          </h3>
          <p className={`${styles.descClass} text-neutral-400 leading-relaxed max-w-xs`}>
            {description}
          </p>
        </div>

        {/* Acción */}
        {onAction && actionText && (
          <Button
            onClick={onAction}
            variant="outline"
            size="sm"
            className={`${styles.buttonClass} border-neutral-600/60 text-neutral-300 hover:bg-neutral-700/60 hover:text-white hover:border-neutral-500 transition-all duration-200 mt-4`}
          >
            {actionText}
          </Button>
        )}

        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none opacity-5">
          <svg
            className="absolute -top-4 -right-4 w-32 h-32 text-white"
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <pattern
                id={`dots-${title.replace(/\s+/g, '-').toLowerCase()}`}
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.2" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={`url(#dots-${title.replace(/\s+/g, '-').toLowerCase()})`}
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyStateCard;