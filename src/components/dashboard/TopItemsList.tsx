import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { forwardRef } from 'react';

interface TopItem {
  name: string;
  count: number;
  revenue: number;
}

interface TopItemsListProps {
  title: string;
  items: TopItem[];
  type: 'services' | 'products';
}

export const TopItemsList = forwardRef<HTMLDivElement, TopItemsListProps>(
  ({ title, items, type }, ref) => {
    const maxRevenue = Math.max(...items.map(i => i.revenue));

    return (
      <div ref={ref} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <TrendingUp className="h-5 w-5 text-success" />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const percentage = (item.revenue / maxRevenue) * 100;

            return (
              <div key={item.name} className="space-y-2 fade-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      index === 0 && 'bg-primary text-primary-foreground',
                      index === 1 && 'bg-secondary text-secondary-foreground',
                      index === 2 && 'bg-muted text-muted-foreground'
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">${item.revenue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.count} {type === 'services' ? 'servicios' : 'uds'})
                    </span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      index === 0 ? 'gradient-bg' : 'bg-primary/40'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

TopItemsList.displayName = 'TopItemsList';
