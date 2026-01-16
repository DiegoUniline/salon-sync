import { cn } from '@/lib/utils';

interface RevenueChartProps {
  weeklyRevenue: Array<{ day: string; amount: number }>;
}

export function RevenueChart({ weeklyRevenue }: RevenueChartProps) {
  const maxAmount = Math.max(...weeklyRevenue.map(d => d.amount), 1);
  const total = weeklyRevenue.reduce((sum, d) => sum + d.amount, 0);
  
  // Calculate today's index (0 = Monday, 6 = Sunday)
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Ingresos de la Semana</h3>
          <p className="text-sm text-muted-foreground">Últimos 7 días</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">
            ${total.toLocaleString()}
          </p>
          <p className="text-sm text-success">+12.5% vs semana anterior</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-48">
        {weeklyRevenue.map((data, index) => {
          const height = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
          const isToday = index === todayIndex;

          return (
            <div
              key={data.day}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full flex flex-col items-center relative group">
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-md px-2 py-1 text-xs shadow-lg z-10">
                  ${data.amount.toLocaleString()}
                </div>
                
                {/* Bar */}
                <div
                  className={cn(
                    'w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out',
                    isToday ? 'gradient-bg' : 'bg-primary/20 hover:bg-primary/40'
                  )}
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              </div>
              <span className={cn(
                'text-xs',
                isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}>
                {data.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
