import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Clock, Loader2 } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  client_name?: string;
  stylist_name?: string;
  stylist_color?: string;
  total: number;
  services?: Array<{
    name: string;
    duration: number;
  }>;
}

const statusLabels = {
  'scheduled': 'Agendada',
  'in-progress': 'En proceso',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
};

export function AppointmentTimeline() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await api.appointments.getAll({ start_date: today, end_date: today });
        setAppointments(data);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  const todayAppointments = appointments
    .sort((a, b) => a.time.localeCompare(b.time));

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Citas de Hoy</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
  const totalDuration = appointment.services?.reduce((sum, s) => sum + s.duration, 0) || 0;
  const stylistColor = appointment.stylist_color || '#3B82F6';
  const stylistName = appointment.stylist_name || 'Sin asignar';
  const clientName = appointment.client_name || 'Cliente';

  return (
    <div
      className={cn(
        'group relative flex gap-4 p-4 rounded-lg transition-all duration-200 hover:bg-secondary/50 fade-up',
        appointment.status === 'in-progress' && 'bg-primary/5 border border-primary/20'
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        borderLeftWidth: '4px',
        borderLeftColor: stylistColor,
      }}
    >
      {/* Time */}
      <div className="flex flex-col items-center w-16">
        <span className="text-lg font-semibold">{appointment.time?.slice(0, 5)}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {totalDuration}min
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{clientName}</span>
          <span className={cn('badge-status', `badge-${appointment.status}`)}>
            {statusLabels[appointment.status]}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          {appointment.services?.map(s => s.name).join(', ') || 'Sin servicios'}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: stylistColor }}
          >
            {stylistName.charAt(0)}
          </div>
          <span className="text-sm text-muted-foreground">
            {stylistName}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="text-lg font-semibold">${Number(appointment.total).toLocaleString()}</span>
      </div>
    </div>
  );
}