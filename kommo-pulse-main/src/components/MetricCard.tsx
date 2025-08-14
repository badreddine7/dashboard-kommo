import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'accent';
  className?: string;
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  tooltip
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-success shadow-glow border-success/20';
      case 'warning':
        return 'bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20 dark:from-warning/20 dark:via-warning/10 dark:to-transparent';
      case 'destructive':
        return 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-destructive/20 dark:from-destructive/20 dark:via-destructive/10 dark:to-transparent';
      case 'accent':
        return 'bg-gradient-accent shadow-accent border-accent/20';
      default:
        return 'bg-gradient-card shadow-elegant border-border/50';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-success-foreground';
      case 'warning':
        return 'text-warning';
      case 'destructive':
        return 'text-destructive';
      case 'accent':
        return 'text-accent-foreground';
      default:
        return 'text-primary';
    }
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const cardContent = (
    <Card className={`transition-all duration-300 hover:scale-105 ${getVariantStyles()} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground/80">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconStyles()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-card-foreground/60 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-medium ${getTrendColor(trend.value)}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

export default MetricCard;