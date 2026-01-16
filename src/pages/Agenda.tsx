import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List,
  Plus,
  Building2,
  Users,
  Clock,
  Phone,
  DollarSign,
  Scissors,
  Loader2,
} from 'lucide-react';
import { AppointmentFormDialog } from '@/components/AppointmentFormDialog';

type ViewMode = 'day' | 'week' | 'month';

interface Stylist {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  client_id: string;
  client?: Client;
  stylist_id: string;
  stylist?: Stylist;
  branch_id: string;
  services?: Service[];
  total: number;
  notes?: string;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const statusColors = {
  'scheduled': 'bg-info/20 border-info text-info',
  'in-progress': 'bg-warning/20 border-warning text-warning',
  'completed': 'bg-success/20 border-success text-success',
  'cancelled': 'bg-destructive/20 border-destructive text-destructive',
};

const statusLabels = {
  'scheduled': 'Programada',
  'in-progress': 'En curso',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
};

export default function Agenda() {
  const { currentBranch } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBranches, setSelectedBranches] = useState<string[]>([currentBranch?.id || '']);
  const [selectedStylists, setSelectedStylists] = useState<string[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInitialDate, setDialogInitialDate] = useState<string>('');
  const [dialogInitialTime, setDialogInitialTime] = useState<string>('');
  const [dialogInitialStylist, setDialogInitialStylist] = useState<string>('');
  const [dialogInitialDuration, setDialogInitialDuration] = useState<number | undefined>();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ time: string; stylistId: string; date: Date } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ time: string } | null>(null);
  const dragRef = useRef<boolean>(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [branchesData, usersData] = await Promise.all([
          api.branches.getAll(),
          api.users.getAll(),
        ]);
        setBranches(branchesData);
        setStylists(usersData.filter((u: any) => u.role !== 'receptionist'));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load appointments when date or filters change
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const startDate = viewMode === 'month' 
          ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0]
          : viewMode === 'week'
          ? getWeekDates(selectedDate)[0].toISOString().split('T')[0]
          : selectedDate.toISOString().split('T')[0];
        
        const endDate = viewMode === 'month'
          ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0]
          : viewMode === 'week'
          ? getWeekDates(selectedDate)[6].toISOString().split('T')[0]
          : selectedDate.toISOString().split('T')[0];

        const data = await api.appointments.getAll({ start_date: startDate, end_date: endDate });
        setAppointments(data);
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    };
    loadAppointments();
  }, [selectedDate, viewMode]);

  const filteredStylists = stylists.filter(s => s.role !== 'receptionist');

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7;
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
      // Handle date format "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD"
      const appointmentDate = (a.date || '').split('T')[0];
      const dateMatch = appointmentDate === str;
      const branchMatch = selectedBranches.length === 0 || selectedBranches.includes(a.branch_id);
      const stylistMatch = selectedStylists.length === 0 || selectedStylists.includes(a.stylist_id);
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
    ? `${weekDates[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
    : selectedDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isCurrentMonth = (date: Date) => date.getMonth() === selectedDate.getMonth();

  const toggleBranch = (branchId: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const toggleStylist = (stylistId: string) => {
    setSelectedStylists(prev => 
      prev.includes(stylistId) ? prev.filter(id => id !== stylistId) : [...prev, stylistId]
    );
  };

  const openNewAppointmentDialog = (date: Date, time: string, stylistId: string, duration?: number) => {
    setDialogInitialDate(date.toISOString().split('T')[0]);
    setDialogInitialTime(time);
    setDialogInitialStylist(stylistId);
    setDialogInitialDuration(duration);
    setIsDialogOpen(true);
  };

  const handleSlotClick = (time: string, stylistId: string, date: Date) => {
    if (dragRef.current) return;
    openNewAppointmentDialog(date, time, stylistId);
  };

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
    
    return timeIndex >= Math.min(startIndex, endIndex) && timeIndex <= Math.max(startIndex, endIndex);
  };

  const displayStylists = selectedStylists.length > 0
    ? filteredStylists.filter(s => selectedStylists.includes(s.id))
    : filteredStylists;

  const reloadAppointments = async () => {
    try {
      const startDate = viewMode === 'month' 
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0]
        : viewMode === 'week'
        ? getWeekDates(selectedDate)[0].toISOString().split('T')[0]
        : selectedDate.toISOString().split('T')[0];
      
      const endDate = viewMode === 'month'
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0]
        : viewMode === 'week'
        ? getWeekDates(selectedDate)[6].toISOString().split('T')[0]
        : selectedDate.toISOString().split('T')[0];

      const data = await api.appointments.getAll({ start_date: startDate, end_date: endDate });
      setAppointments(data);
    } catch (error) {
      console.error('Error reloading appointments:', error);
    }
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const getStylistColor = (stylistId: string) => {
    const stylist = stylists.find(s => s.id === stylistId);
    return stylist?.color || '#3B82F6';
  };

  const getStylistName = (stylistId: string) => {
    const stylist = stylists.find(s => s.id === stylistId);
    return stylist?.name || 'Sin asignar';
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button 
            className="font-semibold text-sm capitalize hover:text-primary transition-colors min-w-[140px] text-center"
            onClick={() => setSelectedDate(new Date())}
          >
            {formattedDate}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                {selectedBranches.length > 0 && <span className="bg-primary/20 text-primary rounded px-1">{selectedBranches.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              {branches.map(branch => (
                <label key={branch.id} className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-muted rounded text-sm">
                  <Checkbox checked={selectedBranches.includes(branch.id)} onCheckedChange={() => toggleBranch(branch.id)} />
                  {branch.name}
                </label>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Users className="h-3.5 w-3.5" />
                {selectedStylists.length > 0 && <span className="bg-primary/20 text-primary rounded px-1">{selectedStylists.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              {filteredStylists.map(stylist => (
                <label key={stylist.id} className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-muted rounded text-sm">
                  <Checkbox checked={selectedStylists.includes(stylist.id)} onCheckedChange={() => toggleStylist(stylist.id)} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stylist.color }} />
                  {stylist.name}
                </label>
              ))}
            </PopoverContent>
          </Popover>

          <div className="flex border rounded-md p-0.5 bg-muted/50">
            {[
              { mode: 'day' as ViewMode, label: 'D' },
              { mode: 'week' as ViewMode, label: 'S' },
              { mode: 'month' as ViewMode, label: 'M' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded transition-colors",
                  viewMode === mode ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Button size="sm" className="h-8 gradient-bg border-0" onClick={() => openNewAppointmentDialog(selectedDate, '09:00', displayStylists[0]?.id || '')}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="flex-1 glass-card rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="flex border-b bg-muted/30 flex-shrink-0">
            <div className="w-12 flex-shrink-0" />
            {displayStylists.map(stylist => (
              <div key={stylist.id} className="flex-1 py-2 px-1 text-center border-l border-border/30">
                <div
                  className="h-7 w-7 rounded-full mx-auto flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: stylist.color }}
                >
                  {stylist.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto select-none">
            {timeSlots.map(time => (
              <div key={time} className="flex border-t border-border/30" style={{ minHeight: '44px' }}>
                <div className="w-12 flex-shrink-0 text-[10px] text-muted-foreground py-1 text-right pr-2">
                  {time}
                </div>
                
                {displayStylists.map(stylist => {
                  // Find appointment that starts in this hour slot
                  const slotHour = parseInt(time.split(':')[0]);
                  const appointment = filteredAppointments.find(a => {
                    if (a.stylist_id !== stylist.id) return false;
                    // Handle time format "HH:MM:SS" or "HH:MM"
                    const timeStr = (a.time || '').slice(0, 5);
                    const appointmentHour = parseInt(timeStr.split(':')[0]);
                    return appointmentHour === slotHour;
                  });
                  const isInDragRange = isSlotInDragRange(time, stylist.id);

                  return (
                    <div 
                      key={stylist.id} 
                      className={cn(
                        'flex-1 border-l border-border/30 cursor-pointer transition-colors relative',
                        isInDragRange && 'bg-primary/20',
                        !appointment && 'hover:bg-muted/40'
                      )}
                      onMouseDown={() => !appointment && handleMouseDown(time, stylist.id, selectedDate)}
                      onMouseEnter={() => handleMouseEnter(time)}
                      onClick={() => !appointment && !dragRef.current && handleSlotClick(time, stylist.id, selectedDate)}
                    >
                      {appointment && (
                        <AppointmentChip 
                          appointment={appointment}
                          stylistColor={getStylistColor(appointment.stylist_id)}
                          onClick={() => setSelectedAppointment(appointment)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="flex-1 glass-card rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-8 border-b bg-muted/30 flex-shrink-0">
            <div className="w-12" />
            {weekDates.map((date, i) => (
              <div 
                key={i} 
                className={cn("text-center py-2 border-l border-border/30", isToday(date) && "bg-primary/10")}
                onClick={() => { setSelectedDate(date); setViewMode('day'); }}
              >
                <p className="text-[10px] text-muted-foreground">{dayNames[i]}</p>
                <p className={cn(
                  "text-sm font-semibold w-6 h-6 mx-auto flex items-center justify-center rounded-full cursor-pointer hover:bg-primary/20",
                  isToday(date) && "bg-primary text-primary-foreground"
                )}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto select-none">
            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-8 border-t border-border/30" style={{ minHeight: '36px' }}>
                <div className="w-12 text-[10px] text-muted-foreground py-1 text-right pr-2">{time}</div>
                
                {weekDates.map((date, i) => {
                  const dayAppointments = getAppointmentsForDate(date);
                  const slotHour = parseInt(time.split(':')[0]);
                  const appointment = dayAppointments.find(a => {
                    const appointmentHour = parseInt((a.time || '').split(':')[0]);
                    return appointmentHour === slotHour;
                  });

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        'border-l border-border/30 cursor-pointer transition-colors p-0.5',
                        isToday(date) && 'bg-primary/5',
                        !appointment && 'hover:bg-muted/30'
                      )}
                      onClick={() => {
                        if (appointment) {
                          setSelectedAppointment(appointment);
                        } else {
                          openNewAppointmentDialog(date, time, displayStylists[0]?.id || '');
                        }
                      }}
                    >
                      {appointment && (
                        <div
                          className="rounded px-1 py-0.5 text-[10px] truncate"
                          style={{
                            backgroundColor: `${getStylistColor(appointment.stylist_id)}25`,
                            borderLeft: `2px solid ${getStylistColor(appointment.stylist_id)}`,
                          }}
                        >
                          {appointment.client?.name?.split(' ')[0] || 'Cliente'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="flex-1 glass-card rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-7 bg-muted/30 flex-shrink-0">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-2">{day}</div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
            {monthDates.map((date, i) => {
              const dayAppointments = date ? getAppointmentsForDate(date) : [];
              const today = date ? isToday(date) : false;
              const currentMonth = date ? isCurrentMonth(date) : false;

              return (
                <div
                  key={i}
                  className={cn(
                    'border-t border-l border-border/30 p-1 cursor-pointer hover:bg-muted/20 transition-colors overflow-hidden',
                    today && 'bg-primary/5',
                    !currentMonth && 'opacity-40'
                  )}
                  onClick={() => { if (date) { setSelectedDate(date); setViewMode('day'); } }}
                >
                  <p className={cn(
                    "text-xs font-medium mb-0.5",
                    today && "text-primary"
                  )}>
                    {date?.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayAppointments.slice(0, 2).map(apt => (
                      <div
                        key={apt.id}
                        className="text-[9px] px-1 rounded truncate"
                        style={{ backgroundColor: `${getStylistColor(apt.stylist_id)}20`, borderLeft: `2px solid ${getStylistColor(apt.stylist_id)}` }}
                      >
                        {apt.time} {apt.client?.name?.split(' ')[0] || 'Cliente'}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <p className="text-[9px] text-muted-foreground">+{dayAppointments.length - 2}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-sm">
          {selectedAppointment && (() => {
              const clientName = (selectedAppointment as any).client_name || selectedAppointment.client?.name || 'Cliente';
              const clientPhone = (selectedAppointment as any).client_phone || selectedAppointment.client?.phone || '-';
              const timeFormatted = (selectedAppointment.time || '').slice(0, 5);
              return (
                <>
                  <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getStylistColor(selectedAppointment.stylist_id) }}
                      />
                      {clientName}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-3">
                    <Badge className={cn("text-xs", statusColors[selectedAppointment.status])}>
                      {statusLabels[selectedAppointment.status]}
                    </Badge>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{timeFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{clientPhone}</span>
                      </div>
                    </div>

                {selectedAppointment.services && selectedAppointment.services.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Servicios</p>
                    <div className="space-y-1.5">
                      {selectedAppointment.services.map(service => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                            {service.name}
                          </span>
                          <span className="font-medium">${service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: getStylistColor(selectedAppointment.stylist_id) }}
                    >
                      {getStylistName(selectedAppointment.stylist_id).split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium">{getStylistName(selectedAppointment.stylist_id)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold">
                    <DollarSign className="h-5 w-5" />
                    {selectedAppointment.total}
                  </div>
                </div>
              </div>
            </>
              );
            })()}
        </DialogContent>
      </Dialog>

      <AppointmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialDate={dialogInitialDate}
        initialTime={dialogInitialTime}
        initialStylistId={dialogInitialStylist}
        initialDuration={dialogInitialDuration}
        onSave={reloadAppointments}
      />
    </div>
  );
}

function AppointmentChip({ appointment, stylistColor, onClick }: { appointment: Appointment; stylistColor: string; onClick: () => void }) {
  const duration = appointment.services?.reduce((sum, s) => sum + s.duration, 0) || 60;
  const slots = Math.ceil(duration / 60);
  const height = Math.max(slots * 44 - 4, 40);
  
  // Use direct fields from API (client_name, client_phone) or fallback to nested objects
  const clientName = (appointment as any).client_name || appointment.client?.name || 'Cliente';
  const clientPhone = (appointment as any).client_phone || appointment.client?.phone || '';
  const serviceName = appointment.services?.[0]?.name || 'Servicio';
  const timeFormatted = (appointment.time || '').slice(0, 5);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'absolute inset-x-0.5 top-0.5 rounded px-1.5 py-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md z-10 overflow-hidden'
      )}
      style={{
        height: `${height}px`,
        backgroundColor: `${stylistColor}20`,
        borderLeft: `3px solid ${stylistColor}`,
      }}
    >
      <p className="font-medium text-xs truncate">{clientName}</p>
      <p className="text-[10px] text-muted-foreground truncate">{serviceName}</p>
      {clientPhone && <p className="text-[10px] text-muted-foreground truncate">📞 {clientPhone}</p>}
      {slots > 1 && <p className="text-[10px] font-medium mt-0.5">${appointment.total}</p>}
    </div>
  );
}
