import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Gift, Plus, Loader2, Trash2, Edit, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Promo {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  applies_to: 'all' | 'service' | 'product' | 'category';
  target_ids: string[];
  min_purchase: number;
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  type: 'percentage' as 'percentage' | 'fixed',
  value: 10,
  applies_to: 'all' as 'all' | 'service' | 'product' | 'category',
  min_purchase: 0,
  start_date: '',
  end_date: '',
  usage_limit: '' as string | number,
  is_active: true,
};

export default function Promociones() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Promo[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.promotions.getAll();
      setItems(data as any);
    } catch (e: any) {
      toast.error(e?.message || 'Error al cargar promociones');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null); setForm({ ...emptyForm }); setOpen(true);
  };
  const openEdit = (p: Promo) => {
    setEditing(p);
    setForm({
      name: p.name,
      code: p.code || '',
      description: p.description || '',
      type: p.type,
      value: Number(p.value) || 0,
      applies_to: p.applies_to,
      min_purchase: Number(p.min_purchase) || 0,
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      usage_limit: p.usage_limit ?? '',
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nombre requerido'); return; }
    if (!form.value || form.value <= 0) { toast.error('Valor debe ser mayor a 0'); return; }
    if (form.type === 'percentage' && form.value > 100) { toast.error('Porcentaje no puede ser mayor a 100'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        type: form.type,
        value: Number(form.value),
        applies_to: form.applies_to,
        min_purchase: Number(form.min_purchase) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
        is_active: form.is_active,
      };
      if (editing) await api.promotions.update(editing.id, payload);
      else await api.promotions.create(payload);
      toast.success(editing ? 'Promoción actualizada' : 'Promoción creada');
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await api.promotions.delete(id);
      toast.success('Promoción eliminada');
      load();
    } catch (e: any) { toast.error(e?.message || 'Error al eliminar'); }
  };

  const toggleActive = async (p: Promo) => {
    try {
      await api.promotions.update(p.id, { is_active: !p.is_active });
      setItems(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
    } catch (e: any) { toast.error(e?.message || 'Error'); }
  };

  const appliesLabel = (a: string) => ({ all: 'Todo', service: 'Servicios', product: 'Productos', category: 'Categoría' } as any)[a] || a;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6 text-primary" /> Promociones y descuentos</h1>
          <p className="text-muted-foreground text-sm">Crea códigos y descuentos aplicables en el punto de venta</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nueva promoción</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Todas las promociones</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Sin promociones. Crea la primera.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Aplica a</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.name}
                      {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                    </TableCell>
                    <TableCell>{p.code ? <Badge variant="outline" className="font-mono">{p.code}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {p.type === 'percentage' ? `${Number(p.value).toFixed(0)}%` : `$${Number(p.value).toFixed(2)}`}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{appliesLabel(p.applies_to)}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {p.start_date || p.end_date ? (
                        <>{p.start_date || '—'} → {p.end_date || 'Sin fin'}</>
                      ) : <span className="text-muted-foreground">Siempre</span>}
                    </TableCell>
                    <TableCell className="text-xs">{p.times_used}{p.usage_limit ? `/${p.usage_limit}` : ''}</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(p.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar promoción' : 'Nueva promoción'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Descuento Verano" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Código (opcional)</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VERANO25" className="font-mono" />
              </div>
              <div>
                <Label>Estado</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <span className="text-sm">{form.is_active ? 'Activa' : 'Inactiva'}</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage"><span className="flex items-center gap-2"><Percent className="h-3 w-3" /> Porcentaje</span></SelectItem>
                    <SelectItem value="fixed"><span className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> Monto fijo</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor {form.type === 'percentage' ? '(%)' : '($)'}</Label>
                <Input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Aplica a</Label>
                <Select value={form.applies_to} onValueChange={v => setForm({ ...form, applies_to: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda la venta</SelectItem>
                    <SelectItem value="service">Solo servicios</SelectItem>
                    <SelectItem value="product">Solo productos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Compra mínima ($)</Label>
                <Input type="number" step="0.01" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Desde</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div>
                <Label>Límite usos</Label>
                <Input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="∞" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
