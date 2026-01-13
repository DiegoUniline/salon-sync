import { useState } from 'react';
import { appointments, stylists, type Appointment } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List,
  Plus,
  Filter,
} from 'lucide-react';

type ViewMode = 'timeline' | 'calendar' | 'list';

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const statusColors = {
  'scheduled': 'bg-info/20 border-info/30 text-info',
  'in-progress': 'bg-warning/20 border-warning/30 text-warning',
  'completed': 'bg-success/20 border-success/30 text-success',
  'cancelled': 'bg-destructive/20 border-destructive/30 text-destructive',
};

export default function Agenda() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStylist, setSelectedStylist] = useState<string>('all');

  const dateStr = selectedDate.toISOString().split('T')[0];
  const filteredAppointments = appointments.filter(a => {
    const dateMatch = a.date === dateStr;
    const stylistMatch = selectedStylist === 'all' || a.stylistId === selectedStylist;
    return dateMatch && stylistMatch;
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const formattedDate = selectedDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gestiona tus citas del día</p>
        </div>
        <Button className="gradient-bg border-0">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[200px]">
              <p className="font-semibold capitalize">{formattedDate}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoy
            </Button>
          </div>

          {/* Filters & View Mode */}
          <div className="flex items-center gap-3">
            <Select value={selectedStylist} onValueChange={setSelectedStylist}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estilista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {stylists.filter(s => s.role !== 'receptionist').map(stylist => (
                  <SelectItem key={stylist.id} value={stylist.id}>
                    {stylist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="glass-card rounded-xl p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Stylist Headers */}
            <div className="flex border-b border-border pb-4 mb-4">
              <div className="w-20 flex-shrink-0" />
              {stylists.filter(s => 
                selectedStylist === 'all' 
                  ? s.role !== 'receptionist'
                  : s.id === selectedStylist
              ).map(stylist => (
                <div
                  key={stylist.id}
                  className="flex-1 text-center px-2"
                >
                  <div
                    className="h-10 w-10 rounded-full mx-auto flex items-center justify-center text-white font-medium mb-2"
                    style={{ backgroundColor: stylist.color }}
                  >
                    {stylist.name.charAt(0)}
                  </div>
                  <p className="font-medium text-sm truncate">{stylist.name}</p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {timeSlots.map(time => (
                <div key={time} className="flex items-start border-t border-border/50 min-h-[80px]">
                  <div className="w-20 flex-shrink-0 pr-4 py-2">
                    <span className="text-sm text-muted-foreground">{time}</span>
                  </div>
                  
                  {stylists.filter(s => 
                    selectedStylist === 'all' 
                      ? s.role !== 'receptionist'
                      : s.id === selectedStylist
                  ).map(stylist => {
                    const appointment = filteredAppointments.find(
                      a => a.stylistId === stylist.id && a.time === time
                    );

                    return (
                      <div key={stylist.id} className="flex-1 px-1 py-2">
                        {appointment && (
                          <AppointmentBlock appointment={appointment} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-card rounded-xl divide-y divide-border">
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay citas para este día
            </div>
          ) : (
            filteredAppointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(appointment => (
                <div key={appointment.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-16">
                      <p className="text-lg font-semibold">{appointment.time}</p>
                    </div>
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: appointment.stylist.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{appointment.client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.services.map(s => s.name).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${appointment.total}</p>
                      <span className={cn('badge-status', `badge-${appointment.status}`)}>
                        {appointment.status === 'scheduled' && 'Agendada'}
                        {appointment.status === 'in-progress' && 'En proceso'}
                        {appointment.status === 'completed' && 'Completada'}
                        {appointment.status === 'cancelled' && 'Cancelada'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          Vista de calendario mensual - Próximamente
        </div>
      )}
    </div>
  );
}

function AppointmentBlock({ appointment }: { appointment: Appointment }) {
  const duration = appointment.services.reduce((sum, s) => sum + s.duration, 0);
  const heightPixels = (duration / 60) * 80;

  return (
    <div
      className={cn(
        'rounded-lg border p-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg',
        statusColors[appointment.status]
      )}
      style={{
        height: `${Math.max(heightPixels, 60)}px`,
        backgroundColor: `${appointment.stylist.color}15`,
        borderColor: `${appointment.stylist.color}40`,
      }}
    >
      <p className="font-medium text-sm truncate text-foreground">
        {appointment.client.name}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {appointment.services.map(s => s.name).join(', ')}
      </p>
      <p className="text-xs font-medium mt-1 text-foreground">
        ${appointment.total}
      </p>
    </div>
  );
}
