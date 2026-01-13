import { useState } from 'react';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  branches,
  stylists,
  branchSchedules as mockBranchSchedules,
  stylistSchedules as mockStylistSchedules,
  blockedDays as mockBlockedDays,
  dayNames,
  defaultSchedule,
  type BranchSchedule,
  type StylistSchedule,
  type BlockedDay,
  type WeekSchedule,
  type DaySchedule,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

export default function Horarios() {
  const isMobile = useIsMobile();
  const [branchSchedules, setBranchSchedules] = useState<BranchSchedule[]>(mockBranchSchedules);
  const [stylistSchedules, setStylistSchedules] = useState<StylistSchedule[]>(mockStylistSchedules);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>(mockBlockedDays);

  const [selectedBranch, setSelectedBranch] = useState(branches[0].id);
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);

  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    type: 'all' as 'all' | 'branch' | 'stylist',
    targetId: '',
    dateRange: undefined as DateRange | undefined,
    reason: '',
  });

  // Get schedule for branch
  const getBranchSchedule = (branchId: string): WeekSchedule => {
    const found = branchSchedules.find(bs => bs.branchId === branchId);
    return found?.schedule || { ...defaultSchedule };
  };

  // Get schedule for stylist
  const getStylistSchedule = (stylistId: string, branchId: string): WeekSchedule => {
    const found = stylistSchedules.find(ss => ss.stylistId === stylistId && ss.branchId === branchId);
    return found?.schedule || { ...defaultSchedule };
  };

  // Update branch schedule
  const updateBranchSchedule = (branchId: string, dayIndex: number, field: keyof DaySchedule, value: any) => {
    setBranchSchedules(prev => {
      const existing = prev.find(bs => bs.branchId === branchId);
      if (existing) {
        return prev.map(bs => bs.branchId === branchId
          ? {
            ...bs,
            schedule: {
              ...bs.schedule,
              [dayIndex]: { ...bs.schedule[dayIndex], [field]: value }
            }
          }
          : bs
        );
      } else {
        return [...prev, {
          branchId,
          schedule: {
            ...defaultSchedule,
            [dayIndex]: { ...defaultSchedule[dayIndex], [field]: value }
          }
        }];
      }
    });
    toast.success('Horario actualizado');
  };

  // Update stylist schedule
  const updateStylistSchedule = (stylistId: string, branchId: string, dayIndex: number, field: keyof DaySchedule, value: any) => {
    setStylistSchedules(prev => {
      const existing = prev.find(ss => ss.stylistId === stylistId && ss.branchId === branchId);
      if (existing) {
        return prev.map(ss => (ss.stylistId === stylistId && ss.branchId === branchId)
          ? {
            ...ss,
            schedule: {
              ...ss.schedule,
              [dayIndex]: { ...ss.schedule[dayIndex], [field]: value }
            }
          }
          : ss
        );
      } else {
        return [...prev, {
          stylistId,
          branchId,
          schedule: {
            ...defaultSchedule,
            [dayIndex]: { ...defaultSchedule[dayIndex], [field]: value }
          }
        }];
      }
    });
    toast.success('Horario actualizado');
  };

  // Copy branch schedule to stylist
  const copyBranchToStylist = (stylistId: string, branchId: string) => {
    const branchSchedule = getBranchSchedule(branchId);
    setStylistSchedules(prev => {
      const existing = prev.find(ss => ss.stylistId === stylistId && ss.branchId === branchId);
      if (existing) {
        return prev.map(ss => (ss.stylistId === stylistId && ss.branchId === branchId)
          ? { ...ss, schedule: { ...branchSchedule } }
          : ss
        );
      } else {
        return [...prev, { stylistId, branchId, schedule: { ...branchSchedule } }];
      }
    });
    toast.success('Horario copiado de la sucursal');
  };

  // Add blocked days
  const addBlockedDays = () => {
    if (!blockForm.dateRange?.from) {
      toast.error('Selecciona las fechas');
      return;
    }
    if (!blockForm.reason) {
      toast.error('Ingresa el motivo');
      return;
    }

    const newBlock: BlockedDay = {
      id: `bd${Date.now()}`,
      type: blockForm.type,
      targetId: blockForm.type !== 'all' ? blockForm.targetId : undefined,
      startDate: format(blockForm.dateRange.from, 'yyyy-MM-dd'),
      endDate: format(blockForm.dateRange.to || blockForm.dateRange.from, 'yyyy-MM-dd'),
      reason: blockForm.reason,
    };

    setBlockedDays(prev => [...prev, newBlock]);
    toast.success('Días bloqueados agregados');
    setIsBlockDialogOpen(false);
    setBlockForm({ type: 'all', targetId: '', dateRange: undefined, reason: '' });
  };

  // Delete blocked day
  const deleteBlockedDay = (id: string) => {
    setBlockedDays(prev => prev.filter(bd => bd.id !== id));
    toast.success('Bloqueo eliminado');
  };

  // Get target name for blocked day
  const getTargetName = (block: BlockedDay) => {
    if (block.type === 'all') return 'Todos';
    if (block.type === 'branch') {
      const branch = branches.find(b => b.id === block.targetId);
      return branch?.name || 'Sucursal';
    }
    if (block.type === 'stylist') {
      const stylist = stylists.find(s => s.id === block.targetId);
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
    const start = parseISO(block.startDate);
    const end = parseISO(block.endDate);
    const days = eachDayOfInterval({ start, end });
    return days.length;
  };

  const currentBranchSchedule = getBranchSchedule(selectedBranch);

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
                    <SelectValue />
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
                schedule={currentBranchSchedule}
                onUpdate={(dayIndex, field, value) => updateBranchSchedule(selectedBranch, dayIndex, field, value)}
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
                      {stylists.filter(s => s.role === 'stylist' || s.role === 'admin').map(stylist => (
                        <SelectItem key={stylist.id} value={stylist.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: stylist.color }}
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
                  schedule={getStylistSchedule(selectedStylist, selectedBranch)}
                  onUpdate={(dayIndex, field, value) => updateStylistSchedule(selectedStylist, selectedBranch, dayIndex, field, value)}
                  showCopyButton
                  onCopy={() => copyBranchToStylist(selectedStylist, selectedBranch)}
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
                            <p className="font-medium">{formatDateRange(block.startDate, block.endDate)}</p>
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
                            variant={block.type === 'all' ? 'destructive' : 'outline'}
                            className={cn(
                              block.type === 'all' && 'bg-destructive/10 text-destructive border-destructive/30'
                            )}
                          >
                            {block.type === 'all' && <Ban className="h-3 w-3 mr-1" />}
                            {block.type === 'branch' && <Building2 className="h-3 w-3 mr-1" />}
                            {block.type === 'stylist' && <Users className="h-3 w-3 mr-1" />}
                            {getTargetName(block)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{block.reason}</p>
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
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedDays.map(block => (
                        <TableRow key={block.id}>
                          <TableCell className="font-medium">
                            {formatDateRange(block.startDate, block.endDate)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getBlockedDaysCount(block)} día{getBlockedDaysCount(block) > 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={block.type === 'all' ? 'destructive' : 'outline'}
                              className={cn(
                                block.type === 'all' && 'bg-destructive/10 text-destructive border-destructive/30'
                              )}
                            >
                              {block.type === 'all' && <Ban className="h-3 w-3 mr-1" />}
                              {block.type === 'branch' && <Building2 className="h-3 w-3 mr-1" />}
                              {block.type === 'stylist' && <Users className="h-3 w-3 mr-1" />}
                              {getTargetName(block)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{block.reason}</TableCell>
                          <TableCell className="text-right">
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
                  <Check className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
                  <p>No hay días bloqueados programados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block Days Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-primary" />
              Bloquear Días
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Aplicar bloqueo a</Label>
              <Select 
                value={blockForm.type} 
                onValueChange={(v: 'all' | 'branch' | 'stylist') => setBlockForm(prev => ({ ...prev, type: v, targetId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Todos (feriado)
                    </span>
                  </SelectItem>
                  <SelectItem value="branch">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Sucursal específica
                    </span>
                  </SelectItem>
                  <SelectItem value="stylist">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Profesional específico
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockForm.type === 'branch' && (
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select value={blockForm.targetId} onValueChange={(v) => setBlockForm(prev => ({ ...prev, targetId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sucursal" />
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
                    <SelectValue placeholder="Selecciona profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylists.filter(s => s.role === 'stylist' || s.role === 'admin').map(stylist => (
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
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                      <span className="text-muted-foreground">Selecciona fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={blockForm.dateRange}
                    onSelect={(range) => setBlockForm(prev => ({ ...prev, dateRange: range }))}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={blockForm.reason}
                onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ej: Vacaciones, Feriado, Mantenimiento..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="gradient-bg border-0" onClick={addBlockedDays}>
                <CalendarX className="h-4 w-4 mr-2" />
                Bloquear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
