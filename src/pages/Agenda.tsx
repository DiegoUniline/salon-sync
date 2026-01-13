import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { appointments as mockAppointments, stylists, branches, type Appointment } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List,
  Plus,
  Building2,
  Users,
} from 'lucide-react';
import { AppointmentFormDialog } from '@/components/AppointmentFormDialog';

type ViewMode = 'day' | 'week' | 'month';

const timeSlots = Array.from({ length: 13 }, (_, i) => {
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
  const { currentBranch } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  
  // Multi-filters
  const [selectedBranches, setSelectedBranches] = useState<string[]>([currentBranch.id]);
  const [selectedStylists, setSelectedStylists] = useState<string[]>([]);

  // Dialog state for creating appointments
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInitialDate, setDialogInitialDate] = useState<string>('');
  const [dialogInitialTime, setDialogInitialTime] = useState<string>('');
  const [dialogInitialStylist, setDialogInitialStylist] = useState<string>('');
  const [dialogInitialDuration, setDialogInitialDuration] = useState<number | undefined>();

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ time: string; stylistId: string; date: Date } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ time: string } | null>(null);
  const dragRef = useRef<boolean>(false);

  // Get stylists filtered by selected branches
  const filteredStylists = stylists.filter(s => s.role !== 'receptionist');

  // Get week dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  // Get month dates
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startPadding; i++) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - (startPadding - i));
      days.push(d);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay);
      d.setDate(lastDay.getDate() + i);
      days.push(d);
    }
    
    return days;
  };

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const monthDates = useMemo(() => getMonthDates(selectedDate), [selectedDate]);

  const getAppointmentsForDate = (date: Date) => {
    const str = date.toISOString().split('T')[0];
    return appointments.filter(a => {
      const dateMatch = a.date === str;
      const branchMatch = selectedBranches.length === 0 || selectedBranches.includes(a.branchId);
      const stylistMatch = selectedStylists.length === 0 || selectedStylists.includes(a.stylistId);
      return dateMatch && branchMatch && stylistMatch;
    });
  };

  const filteredAppointments = getAppointmentsForDate(selectedDate);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const formattedDate = viewMode === 'month' 
    ? selectedDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    : viewMode === 'week'
    ? `${weekDates[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  const toggleStylist = (stylistId: string) => {
    setSelectedStylists(prev => 
      prev.includes(stylistId) 
        ? prev.filter(id => id !== stylistId)
        : [...prev, stylistId]
    );
  };

  // Open dialog for new appointment
  const openNewAppointmentDialog = (date: Date, time: string, stylistId: string, duration?: number) => {
    setDialogInitialDate(date.toISOString().split('T')[0]);
    setDialogInitialTime(time);
    setDialogInitialStylist(stylistId);
    setDialogInitialDuration(duration);
    setIsDialogOpen(true);
  };

  // Handle slot click
  const handleSlotClick = (time: string, stylistId: string, date: Date) => {
    if (dragRef.current) return;
    openNewAppointmentDialog(date, time, stylistId);
  };

  // Drag handlers for time range selection
  const handleMouseDown = (time: string, stylistId: string, date: Date) => {
    dragRef.current = false;
    setIsDragging(true);
    setDragStart({ time, stylistId, date });
    setDragEnd({ time });
  };

  const handleMouseEnter = (time: string) => {
    if (isDragging && dragStart) {
      dragRef.current = true;
      setDragEnd({ time });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const startIndex = timeSlots.indexOf(dragStart.time);
      const endIndex = timeSlots.indexOf(dragEnd.time);
      const startTime = timeSlots[Math.min(startIndex, endIndex)];
      const endTime = timeSlots[Math.max(startIndex, endIndex)];
      
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]) + 1;
      const duration = (endHour - startHour) * 60;

      openNewAppointmentDialog(dragStart.date, startTime, dragStart.stylistId, duration);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => { dragRef.current = false; }, 100);
  };

  const isSlotInDragRange = (time: string, stylistId: string) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (stylistId !== dragStart.stylistId) return false;
    
    const startIndex = timeSlots.indexOf(dragStart.time);
    const endIndex = timeSlots.indexOf(dragEnd.time);
    const timeIndex = timeSlots.indexOf(time);
    
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    return timeIndex >= minIndex && timeIndex <= maxIndex;
  };

  const displayStylists = selectedStylists.length > 0
    ? filteredStylists.filter(s => selectedStylists.includes(s.id))
    : filteredStylists;

  // Handle appointment save
  const handleSaveAppointment = (appointment: Appointment) => {
    setAppointments(prev => {
      const existing = prev.find(a => a.id === appointment.id);
      if (existing) {
        return prev.map(a => a.id === appointment.id ? appointment : a);
      }
      return [...prev, appointment];
    });
  };

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Click o arrastra en un horario para crear cita</p>
        </div>
        <Button className="gradient-bg border-0" onClick={() => openNewAppointmentDialog(selectedDate, '09:00', displayStylists[0]?.id || '')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[250px]">
              <p className="font-semibold capitalize">{formattedDate}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Hoy
            </Button>
          </div>

          {/* Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Sucursales
                  {selectedBranches.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2">
                      {selectedBranches.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3">
                <div className="space-y-2">
                  <p className="font-medium text-sm mb-3">Filtrar por sucursal</p>
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                      <Checkbox 
                        checked={selectedBranches.includes(branch.id)}
                        onCheckedChange={() => toggleBranch(branch.id)}
                      />
                      <span className="text-sm">{branch.name}</span>
                    </label>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedBranches([])}
                    >
                      Limpiar filtro
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Stylist Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Estilistas
                  {selectedStylists.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2">
                      {selectedStylists.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3">
                <div className="space-y-2">
                  <p className="font-medium text-sm mb-3">Filtrar por estilista</p>
                  {filteredStylists.map(stylist => (
                    <label key={stylist.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                      <Checkbox 
                        checked={selectedStylists.includes(stylist.id)}
                        onCheckedChange={() => toggleStylist(stylist.id)}
                      />
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stylist.color }}
                      />
                      <span className="text-sm">{stylist.name}</span>
                    </label>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedStylists([])}
                    >
                      Limpiar filtro
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Día
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                <List className="h-4 w-4 mr-1" />
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Mes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="glass-card rounded-xl p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Stylist Headers */}
            <div className="flex border-b border-border pb-4 mb-4">
              <div className="w-20 flex-shrink-0" />
              {displayStylists.map(stylist => (
                <div key={stylist.id} className="flex-1 text-center px-2">
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
            <div className="relative select-none">
              {timeSlots.map(time => (
                <div key={time} className="flex items-start border-t border-border/50 min-h-[80px]">
                  <div className="w-20 flex-shrink-0 pr-4 py-2">
                    <span className="text-sm text-muted-foreground">{time}</span>
                  </div>
                  
                  {displayStylists.map(stylist => {
                    const appointment = filteredAppointments.find(
                      a => a.stylistId === stylist.id && a.time === time
                    );
                    const isInDragRange = isSlotInDragRange(time, stylist.id);

                    return (
                      <div 
                        key={stylist.id} 
                        className={cn(
                          'flex-1 px-1 py-2 cursor-pointer transition-colors min-h-[80px]',
                          isInDragRange && 'bg-primary/20',
                          !appointment && 'hover:bg-muted/30'
                        )}
                        onMouseDown={() => !appointment && handleMouseDown(time, stylist.id, selectedDate)}
                        onMouseEnter={() => handleMouseEnter(time)}
                        onClick={() => !appointment && !dragRef.current && handleSlotClick(time, stylist.id, selectedDate)}
                      >
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

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="glass-card rounded-xl p-4 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-border pb-4 mb-4">
              <div className="w-16" />
              {weekDates.map((date, i) => (
                <div 
                  key={i} 
                  className={cn(
                    'text-center px-1',
                    isToday(date) && 'text-primary'
                  )}
                >
                  <p className="text-sm text-muted-foreground">{dayNames[i]}</p>
                  <p className={cn(
                    'text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full',
                    isToday(date) && 'bg-primary text-primary-foreground'
                  )}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative select-none">
              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-8 border-t border-border/50 min-h-[60px]">
                  <div className="w-16 pr-2 py-2">
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </div>
                  
                  {weekDates.map((date, i) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const appointment = dayAppointments.find(a => a.time === time);

                    return (
                      <div 
                        key={i} 
                        className={cn(
                          'px-1 py-1 border-l border-border/30 cursor-pointer transition-colors',
                          isToday(date) && 'bg-primary/5',
                          !appointment && 'hover:bg-muted/30'
                        )}
                        onClick={() => {
                          if (!appointment) {
                            const stylistId = displayStylists[0]?.id || '';
                            openNewAppointmentDialog(date, time, stylistId);
                          }
                        }}
                      >
                        {appointment && (
                          <div
                            className={cn(
                              'rounded p-1.5 text-xs cursor-pointer hover:scale-[1.02] transition-transform',
                              statusColors[appointment.status]
                            )}
                            style={{
                              backgroundColor: `${appointment.stylist.color}20`,
                              borderLeft: `3px solid ${appointment.stylist.color}`,
                            }}
                          >
                            <p className="font-medium truncate text-foreground">
                              {appointment.client.name}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {appointment.services[0]?.name}
                            </p>
                          </div>
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

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="glass-card rounded-xl p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDates.map((date, i) => {
              const dayAppointments = date ? getAppointmentsForDate(date) : [];
              const today = isToday(date!);
              const currentMonth = date ? isCurrentMonth(date) : false;

              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] p-2 rounded-lg border border-transparent transition-colors cursor-pointer',
                    today && 'border-primary bg-primary/5',
                    !currentMonth && 'opacity-40',
                    currentMonth && !today && 'hover:bg-muted/30'
                  )}
                  onClick={() => {
                    if (date) {
                      setSelectedDate(date);
                      setViewMode('day');
                    }
                  }}
                >
                  <p className={cn(
                    'text-sm font-medium mb-1',
                    today && 'text-primary'
                  )}>
                    {date?.getDate()}
                  </p>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(apt => (
                      <div
                        key={apt.id}
                        className="text-xs p-1 rounded truncate"
                        style={{
                          backgroundColor: `${apt.stylist.color}20`,
                          borderLeft: `2px solid ${apt.stylist.color}`,
                        }}
                      >
                        <span className="font-medium">{apt.time}</span>
                        <span className="text-muted-foreground ml-1">{apt.client.name}</span>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayAppointments.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Form Dialog */}
      <AppointmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialDate={dialogInitialDate}
        initialTime={dialogInitialTime}
        initialStylistId={dialogInitialStylist}
        initialDuration={dialogInitialDuration}
        onSave={handleSaveAppointment}
      />
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
