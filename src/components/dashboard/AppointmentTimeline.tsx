import { appointments, type Appointment } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

const statusLabels = {
  'scheduled': 'Agendada',
  'in-progress': 'En proceso',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
};

export function AppointmentTimeline() {
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Citas de Hoy</h3>
        <span className="text-sm text-muted-foreground">
          {todayAppointments.length} citas
        </span>
      </div>

      <div className="space-y-3">
        {todayAppointments.map((appointment, index) => (
          <AppointmentCard 
            key={appointment.id} 
            appointment={appointment}
            delay={index * 50}
          />
        ))}

        {todayAppointments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No hay citas programadas para hoy
          </p>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, delay }: { appointment: Appointment; delay: number }) {
  const totalDuration = appointment.services.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div
      className={cn(
        'group relative flex gap-4 p-4 rounded-lg transition-all duration-200 hover:bg-secondary/50 fade-up',
        appointment.status === 'in-progress' && 'bg-primary/5 border border-primary/20'
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        borderLeftWidth: '4px',
        borderLeftColor: appointment.stylist.color,
      }}
    >
      {/* Time */}
      <div className="flex flex-col items-center w-16">
        <span className="text-lg font-semibold">{appointment.time}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {totalDuration}min
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{appointment.client.name}</span>
          <span className={cn('badge-status', `badge-${appointment.status}`)}>
            {statusLabels[appointment.status]}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          {appointment.services.map(s => s.name).join(', ')}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: appointment.stylist.color }}
          >
            {appointment.stylist.name.charAt(0)}
          </div>
          <span className="text-sm text-muted-foreground">
            {appointment.stylist.name}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="text-lg font-semibold">${appointment.total}</span>
      </div>
    </div>
  );
}
