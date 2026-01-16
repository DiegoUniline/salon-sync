import { useState, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Ban,
  CalendarX,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

// Types
interface DaySchedule {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

interface WeekSchedule {
  [key: number]: DaySchedule;
}

interface Branch {
  id: string;
  name: string;
}

interface Stylist {
  id: string;
  name: string;
  full_name?: string;
  color?: string;
  role?: string;
}

interface BlockedDay {
  id: string;
  type: 'all' | 'branch' | 'stylist';
  target_id?: string;
  targetId?: string;
  start_date: string;
  startDate?: string;
  end_date: string;
  endDate?: string;
  reason: string;
}

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const defaultSchedule: WeekSchedule = {
  0: { isOpen: true, startTime: '09:00', endTime: '20:00' },
  1: { isOpen: true, startTime: '09:00', endTime: '20:00' },
  2: { isOpen: true, startTime: '09:00', endTime: '20:00' },
  3: { isOpen: true, startTime: '09:00', endTime: '20:00' },
  4: { isOpen: true, startTime: '09:00', endTime: '20:00' },
  5: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  6: { isOpen: false, startTime: '09:00', endTime: '14:00' },
};

export default function Horarios() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data from API
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [branchSchedule, setBranchSchedule] = useState<WeekSchedule>(defaultSchedule);
  const [stylistSchedule, setStylistSchedule] = useState<WeekSchedule>(defaultSchedule);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);

  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    type: 'all' as 'all' | 'branch' | 'stylist',
    targetId: '',
    dateRange: undefined as DateRange | undefined,
    reason: '',
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load branch schedule when branch changes
  useEffect(() => {
    if (selectedBranch) {
      loadBranchSchedule(selectedBranch);
    }
  }, [selectedBranch]);

  // Load stylist schedule when stylist changes
  useEffect(() => {
    if (selectedStylist && selectedBranch) {
      loadStylistSchedule(selectedStylist, selectedBranch);
    }
  }, [selectedStylist, selectedBranch]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [branchesData, usersData, blockedData] = await Promise.all([
        api.branches.getAll(),
        api.users.getAll({ role: 'stylist' }),
        api.schedules.getBlocked(),
      ]);
      
      const branchesList = branchesData.branches || branchesData || [];
      setBranches(branchesList);
      
      if (branchesList.length > 0) {
        setSelectedBranch(branchesList[0].id);
      }
      
      const usersList = usersData.users || usersData || [];
      setStylists(usersList.map((u: any) => ({
        id: u.id,
        name: u.name || u.full_name,
        full_name: u.full_name,
        color: u.color || '#3B82F6',
        role: u.role,
      })));
      
      const blocked = blockedData.blocked || blockedData || [];
      setBlockedDays(blocked.map((b: any) => ({
        id: b.id,
        type: b.type,
        target_id: b.target_id,
        targetId: b.target_id,
        start_date: b.start_date,
        startDate: b.start_date,
        end_date: b.end_date,
        endDate: b.end_date,
        reason: b.reason,
      })));
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadBranchSchedule = async (branchId: string) => {
    try {
      const data = await api.schedules.getBranch(branchId);
      if (data.schedule) {
        setBranchSchedule(normalizeSchedule(data.schedule));
      } else {
        setBranchSchedule({ ...defaultSchedule });
      }
    } catch (error) {
      console.error('Error loading branch schedule:', error);
      setBranchSchedule({ ...defaultSchedule });
    }
  };

  const loadStylistSchedule = async (stylistId: string, branchId: string) => {
    try {
      const data = await api.schedules.getStylist(stylistId, branchId);
      if (data.schedule) {
        setStylistSchedule(normalizeSchedule(data.schedule));
      } else {
        setStylistSchedule({ ...defaultSchedule });
      }
    } catch (error) {
      console.error('Error loading stylist schedule:', error);
      setStylistSchedule({ ...defaultSchedule });
    }
  };

  const normalizeSchedule = (schedule: any): WeekSchedule => {
    const normalized: WeekSchedule = {};
    for (let i = 0; i < 7; i++) {
      const day = schedule[i] || schedule[i.toString()] || defaultSchedule[i];
      normalized[i] = {
        isOpen: day.isOpen ?? day.is_open ?? true,
        startTime: day.startTime || day.start_time || '09:00',
        endTime: day.endTime || day.end_time || '20:00',
      };
    }
    return normalized;
  };

  // Update branch schedule
  const updateBranchSchedule = async (dayIndex: number, field: keyof DaySchedule, value: any) => {
    const newSchedule = {
      ...branchSchedule,
      [dayIndex]: { ...branchSchedule[dayIndex], [field]: value }
    };
    setBranchSchedule(newSchedule);
    
    try {
      await api.schedules.updateBranch(selectedBranch, newSchedule);
      toast.success('Horario actualizado');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  // Update stylist schedule
  const updateStylistSchedule = async (dayIndex: number, field: keyof DaySchedule, value: any) => {
    if (!selectedStylist) return;
    
    const newSchedule = {
      ...stylistSchedule,
      [dayIndex]: { ...stylistSchedule[dayIndex], [field]: value }
    };
    setStylistSchedule(newSchedule);
    
    try {
      await api.schedules.updateStylist(selectedStylist, {
        branch_id: selectedBranch,
        schedule: newSchedule,
      });
      toast.success('Horario actualizado');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  // Copy branch schedule to stylist
  const copyBranchToStylist = async () => {
    if (!selectedStylist) return;
    
    setStylistSchedule({ ...branchSchedule });
    
    try {
      await api.schedules.updateStylist(selectedStylist, {
        branch_id: selectedBranch,
        schedule: branchSchedule,
      });
      toast.success('Horario copiado de la sucursal');
    } catch (error: any) {
      toast.error(error.message || 'Error al copiar horario');
    }
  };

  // Add blocked days
  const addBlockedDays = async () => {
    if (!blockForm.dateRange?.from) {
      toast.error('Selecciona las fechas');
      return;
    }
    if (!blockForm.reason) {
      toast.error('Ingresa el motivo');
      return;
    }

    try {
      setSaving(true);
      await api.schedules.createBlocked({
        type: blockForm.type,
        target_id: blockForm.type !== 'all' ? blockForm.targetId : null,
        start_date: format(blockForm.dateRange.from, 'yyyy-MM-dd'),
        end_date: format(blockForm.dateRange.to || blockForm.dateRange.from, 'yyyy-MM-dd'),
        reason: blockForm.reason,
      });
      
      toast.success('Días bloqueados agregados');
      setIsBlockDialogOpen(false);
      setBlockForm({ type: 'all', targetId: '', dateRange: undefined, reason: '' });
      loadInitialData();
    } catch (error: any) {
      toast.error(error.message || 'Error al bloquear días');
    } finally {
      setSaving(false);
    }
  };

  // Delete blocked day
  const deleteBlockedDay = async (id: string) => {
    try {
      await api.schedules.deleteBlocked(id);
      toast.success('Bloqueo eliminado');
      setBlockedDays(prev => prev.filter(bd => bd.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar bloqueo');
    }
  };

  // Get target name for blocked day
  const getTargetName = (block: BlockedDay) => {
    if (block.type === 'all') return 'Todos';
    if (block.type === 'branch') {
      const branch = branches.find(b => b.id === (block.target_id || block.targetId));
      return branch?.name || 'Sucursal';
    }
    if (block.type === 'stylist') {
      const stylist = stylists.find(s => s.id === (block.target_id || block.targetId));
      return stylist?.name || 'Profesional';
    }
    return '';
  };

  // Format date range for display
  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (isSameDay(startDate, endDate)) {
      return format(startDate, "d 'de' MMMM, yyyy", { locale: es });
    }
    return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM, yyyy", { locale: es })}`;
  };

  // Get blocked days count
  const getBlockedDaysCount = (block: BlockedDay) => {
    const start = parseISO(block.start_date || block.startDate || '');
    const end = parseISO(block.end_date || block.endDate || '');
    const days = eachDayOfInterval({ start, end });
    return days.length;
  };

  // Schedule editor component
  const ScheduleEditor = ({ 
    schedule, 
    onUpdate,
    showCopyButton = false,
    onCopy
  }: { 
    schedule: WeekSchedule; 
    onUpdate: (dayIndex: number, field: keyof DaySchedule, value: any) => void;
    showCopyButton?: boolean;
    onCopy?: () => void;
  }) => (
    <div className="space-y-4">
      {showCopyButton && onCopy && (
        <Button variant="outline" size="sm" onClick={onCopy} className="mb-4">
          <Copy className="h-4 w-4 mr-2" />
          Copiar horario de sucursal
        </Button>
      )}
      <div className="grid gap-3">
        {dayNames.map((day, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg border transition-colors",
              schedule[index]?.isOpen ? "bg-background" : "bg-muted/50"
            )}
          >
            <div className="w-28 flex items-center gap-2">
              <Switch
                checked={schedule[index]?.isOpen ?? false}
                onCheckedChange={(checked) => onUpdate(index, 'isOpen', checked)}
              />
              <span className={cn(
                "font-medium text-sm",
                !schedule[index]?.isOpen && "text-muted-foreground"
              )}>
                {day}
              </span>
            </div>

            {schedule[index]?.isOpen ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={schedule[index]?.startTime || '09:00'}
                    onChange={(e) => onUpdate(index, 'startTime', e.target.value)}
                    className="w-28 h-9"
                  />
                </div>
                <span className="text-muted-foreground">a</span>
                <Input
                  type="time"
                  value={schedule[index]?.endTime || '20:00'}
                  onChange={(e) => onUpdate(index, 'endTime', e.target.value)}
                  className="w-28 h-9"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Cerrado
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Horarios</h1>
          <p className="text-muted-foreground">Gestiona horarios de sucursales y profesionales</p>
        </div>
        <Button className="gradient-bg border-0" onClick={() => setIsBlockDialogOpen(true)}>
          <CalendarX className="h-4 w-4 mr-2" />
          Bloquear Días
        </Button>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branches" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>
          <TabsTrigger value="stylists" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Profesionales</span>
          </TabsTrigger>
          <TabsTrigger value="blocked" className="gap-2">
            <CalendarX className="h-4 w-4" />
            <span className="hidden sm:inline">Días Bloqueados</span>
            {blockedDays.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {blockedDays.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Branch Schedules */}
        <TabsContent value="branches" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Horario de Sucursal
                </span>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>
              <CardDescription>
                Define los días y horarios de operación de cada sucursal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleEditor
                schedule={branchSchedule}
                onUpdate={(dayIndex, field, value) => updateBranchSchedule(dayIndex, field, value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stylist Schedules */}
        <TabsContent value="stylists" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-4">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Horario de Profesional
                </span>
                <div className="flex gap-2">
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStylist || ''} onValueChange={setSelectedStylist}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylists.map(stylist => (
                        <SelectItem key={stylist.id} value={stylist.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: stylist.color || '#3B82F6' }}
                            />
                            {stylist.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
              <CardDescription>
                Define horarios personalizados para cada profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStylist ? (
                <ScheduleEditor
                  schedule={stylistSchedule}
                  onUpdate={(dayIndex, field, value) => updateStylistSchedule(dayIndex, field, value)}
                  showCopyButton
                  onCopy={copyBranchToStylist}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona un profesional para ver/editar su horario</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Days */}
        <TabsContent value="blocked" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarX className="h-5 w-5 text-primary" />
                Días Bloqueados
              </CardTitle>
              <CardDescription>
                Vacaciones, feriados y días sin servicio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedDays.length > 0 ? (
                isMobile ? (
                  <div className="space-y-3">
                    {blockedDays.map(block => (
                      <div key={block.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {formatDateRange(
                                block.start_date || block.startDate || '',
                                block.end_date || block.endDate || ''
                              )}
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              {getBlockedDaysCount(block)} día{getBlockedDaysCount(block) > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteBlockedDay(block.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={block.type === 'all' ? 'default' : 'outline'}
                          >
                            {block.type === 'all' ? 'General' : block.type === 'branch' ? 'Sucursal' : 'Profesional'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getTargetName(block)}
                          </span>
                        </div>
                        
                        <p className="text-sm">{block.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fechas</TableHead>
                        <TableHead>Días</TableHead>
                        <TableHead>Aplica a</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedDays.map(block => (
                        <TableRow key={block.id}>
                          <TableCell className="font-medium">
                            {formatDateRange(
                              block.start_date || block.startDate || '',
                              block.end_date || block.endDate || ''
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getBlockedDaysCount(block)} día{getBlockedDaysCount(block) > 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={block.type === 'all' ? 'default' : 'outline'}
                              >
                                {block.type === 'all' ? 'General' : block.type === 'branch' ? 'Sucursal' : 'Profesional'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {getTargetName(block)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{block.reason}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteBlockedDay(block.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarX className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay días bloqueados</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsBlockDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar bloqueo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block Days Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarX className="h-5 w-5" />
              Bloquear Días
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Aplica a</Label>
              <Select 
                value={blockForm.type} 
                onValueChange={(v: 'all' | 'branch' | 'stylist') => setBlockForm(prev => ({ ...prev, type: v, targetId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos (general)</SelectItem>
                  <SelectItem value="branch">Sucursal específica</SelectItem>
                  <SelectItem value="stylist">Profesional específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockForm.type === 'branch' && (
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select value={blockForm.targetId} onValueChange={(v) => setBlockForm(prev => ({ ...prev, targetId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {blockForm.type === 'stylist' && (
              <div className="space-y-2">
                <Label>Profesional</Label>
                <Select value={blockForm.targetId} onValueChange={(v) => setBlockForm(prev => ({ ...prev, targetId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylists.map(stylist => (
                      <SelectItem key={stylist.id} value={stylist.id}>{stylist.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !blockForm.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockForm.dateRange?.from ? (
                      blockForm.dateRange.to ? (
                        <>
                          {format(blockForm.dateRange.from, "d MMM", { locale: es })} -{" "}
                          {format(blockForm.dateRange.to, "d MMM, yyyy", { locale: es })}
                        </>
                      ) : (
                        format(blockForm.dateRange.from, "d 'de' MMMM, yyyy", { locale: es })
                      )
                    ) : (
                      "Seleccionar fechas"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={blockForm.dateRange?.from}
                    selected={blockForm.dateRange}
                    onSelect={(range) => setBlockForm(prev => ({ ...prev, dateRange: range }))}
                    numberOfMonths={1}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                placeholder="Ej: Vacaciones, Día festivo, Mantenimiento..."
                value={blockForm.reason}
                onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addBlockedDays} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
