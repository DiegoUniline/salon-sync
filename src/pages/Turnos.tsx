import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  shifts as mockShifts,
  stylists,
  type Shift,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  User,
  Calendar,
  PlayCircle,
  StopCircle,
  Banknote,
  AlertCircle,
  CheckCircle,
  LogIn,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Turnos() {
  const { currentBranch } = useApp();
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [closingShift, setClosingShift] = useState<Shift | null>(null);

  const [openFormData, setOpenFormData] = useState({
    userId: '',
    initialCash: '',
  });

  const [closeFormData, setCloseFormData] = useState({
    finalCash: '',
  });

  const filteredShifts = shifts.filter(s => s.branchId === currentBranch.id);
  const openShift = filteredShifts.find(s => s.status === 'open');

  const today = new Date().toISOString().split('T')[0];

  const openTurn = () => {
    if (!openFormData.userId || !openFormData.initialCash) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const user = stylists.find(s => s.id === openFormData.userId)!;
    const now = new Date();

    const newShift: Shift = {
      id: `sh${Date.now()}`,
      branchId: currentBranch.id,
      userId: openFormData.userId,
      user,
      date: today,
      startTime: now.toTimeString().slice(0, 5),
      initialCash: parseFloat(openFormData.initialCash),
      status: 'open',
    };

    setShifts(prev => [newShift, ...prev]);
    toast.success('Turno abierto correctamente');
    setIsOpenDialogOpen(false);
    setOpenFormData({ userId: '', initialCash: '' });
  };

  const initiateClose = (shift: Shift) => {
    setClosingShift(shift);
    setIsCloseDialogOpen(true);
  };

  const closeTurn = () => {
    if (!closingShift || !closeFormData.finalCash) {
      toast.error('Ingresa el efectivo final');
      return;
    }

    const now = new Date();

    setShifts(prev => prev.map(s => 
      s.id === closingShift.id
        ? {
            ...s,
            endTime: now.toTimeString().slice(0, 5),
            finalCash: parseFloat(closeFormData.finalCash),
            status: 'closed' as const,
          }
        : s
    ));

    toast.success('Turno cerrado correctamente');
    setIsCloseDialogOpen(false);
    setClosingShift(null);
    setCloseFormData({ finalCash: '' });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turnos</h1>
          <p className="text-muted-foreground">Control de apertura y cierre de turnos</p>
        </div>
        <div className="flex gap-2">
          {!openShift ? (
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg border-0">
                  <LogIn className="h-4 w-4 mr-2" />
                  Abrir Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Turno</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Responsable</Label>
                    <Select 
                      value={openFormData.userId} 
                      onValueChange={(v) => setOpenFormData(prev => ({ ...prev, userId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {stylists.map(stylist => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stylist.color }} />
                              {stylist.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Efectivo Inicial en Caja</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        value={openFormData.initialCash}
                        onChange={(e) => setOpenFormData(prev => ({ ...prev, initialCash: e.target.value }))}
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha: {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      <span>Hora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsOpenDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="gradient-bg border-0"
                      onClick={openTurn}
                      disabled={!openFormData.userId || !openFormData.initialCash}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Abrir Turno
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button 
              variant="destructive"
              onClick={() => initiateClose(openShift)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Turno
            </Button>
          )}
        </div>
      </div>

      {/* Current Shift Status */}
      {openShift && (
        <div className="glass-card rounded-xl p-6 border-2 border-success/30 bg-success/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-success/20 animate-pulse">
              <Clock className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Turno Activo</h3>
              <p className="text-muted-foreground">Iniciado a las {formatTime(openShift.startTime)}</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span className="text-sm">Responsable</span>
              </div>
              <p className="font-semibold">{openShift.user.name}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Fecha</span>
              </div>
              <p className="font-semibold">{new Date(openShift.date).toLocaleDateString('es-MX')}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Banknote className="h-4 w-4" />
                <span className="text-sm">Efectivo Inicial</span>
              </div>
              <p className="font-semibold">${openShift.initialCash.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {!openShift && (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-warning" />
          <h3 className="text-lg font-semibold mb-1">No hay turno activo</h3>
          <p className="text-muted-foreground">Abre un turno para comenzar a registrar ventas y gastos</p>
        </div>
      )}

      {/* Shifts History */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Historial de Turnos</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead className="text-right">Efectivo Inicial</TableHead>
              <TableHead className="text-right">Efectivo Final</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay turnos registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredShifts
                .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
                .map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(shift.date).toLocaleDateString('es-MX')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: shift.user.color }}
                        />
                        {shift.user.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(shift.startTime)}</span>
                        {shift.endTime && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span>{formatTime(shift.endTime)}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${shift.initialCash.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.finalCash !== undefined ? (
                        `$${shift.finalCash.toLocaleString()}`
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {shift.status === 'open' ? (
                        <Badge className="bg-success/20 text-success border-success/30 gap-1">
                          <PlayCircle className="h-3 w-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Cerrado
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Close Turn Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={(open) => { setIsCloseDialogOpen(open); if (!open) setClosingShift(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Turno</DialogTitle>
          </DialogHeader>
          
          {closingShift && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-secondary/50 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsable:</span>
                  <span className="font-medium">{closingShift.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora de apertura:</span>
                  <span>{formatTime(closingShift.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efectivo inicial:</span>
                  <span className="font-medium">${closingShift.initialCash.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Efectivo Final en Caja</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    value={closeFormData.finalCash}
                    onChange={(e) => setCloseFormData({ finalCash: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setIsCloseDialogOpen(false); setClosingShift(null); }}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={closeTurn}
                  disabled={!closeFormData.finalCash}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Cerrar Turno
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
