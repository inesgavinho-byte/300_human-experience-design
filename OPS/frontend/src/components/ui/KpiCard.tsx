import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  className?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, subtitle, className }: KpiCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {trend !== undefined && (
          <div className="mt-1 flex items-center text-xs">
            {trend >= 0 ? (
              <TrendingUp className="mr-1 h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="mr-1 h-3.5 w-3.5 text-error" />
            )}
            <span className={trend >= 0 ? 'text-success' : 'text-error'}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="ml-1 text-muted-foreground">vs mês anterior</span>
          </div>
        )}
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
