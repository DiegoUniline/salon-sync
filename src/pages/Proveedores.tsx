import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  Search,
  Loader2,
  Building,
  FileText,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedContainer, AnimatedList, AnimatedListItem } from '@/components/ui/animated-container';

interface Supplier {
  id: string;
  code?: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  payment_terms?: number;
  notes?: string;
  active: boolean;
  created_at?: string;
}

export default function Proveedores() {
  const { currentBranch } = useApp();
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    rfc: '',
    payment_terms: 0,
    notes: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.suppliers.getAll();
      setSuppliers((data || []).map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        contact_name: s.contact_name,
        email: s.email,
        phone: s.phone,
        address: s.address,
        rfc: s.rfc,
        payment_terms: s.payment_terms || 0,
        notes: s.notes,
        active: s.active !== false,
        created_at: s.created_at,
      })));
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      rfc: '',
      payment_terms: 0,
      notes: '',
    });
    setEditingSupplier(null);
  };

  const openDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        rfc: supplier.rfc || '',
        payment_terms: supplier.payment_terms || 0,
        notes: supplier.notes || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await api.suppliers.update(editingSupplier.id, formData);
        setSuppliers(prev => prev.map(s => 
          s.id === editingSupplier.id ? { ...s, ...formData } : s
        ));
        toast.success('Proveedor actualizado');
      } else {
        const newSupplier = await api.suppliers.create(formData);
        setSuppliers(prev => [...prev, {
          id: newSupplier.id,
          code: newSupplier.code,
          ...formData,
          active: true,
          created_at: new Date().toISOString(),
        }]);
        toast.success('Proveedor creado');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast.error(error?.message || 'Error al guardar proveedor');
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    
    try {
      await api.suppliers.delete(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success('Proveedor eliminado');
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error(error?.message || 'Error al eliminar proveedor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            Proveedores
          </h1>
          <p className="text-muted-foreground">
            Gestiona los proveedores de tu negocio
          </p>
        </div>
        {canCreate('compras') && (
          <Button className="gradient-bg border-0" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.filter(s => s.active).length}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table - Desktop */}
      <Card className="glass-card hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Días de crédito</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay proveedores registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-mono text-sm">
                    {supplier.code || '-'}
                  </TableCell>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_name || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>
                    {supplier.payment_terms ? (
                      <Badge variant="outline">
                        {supplier.payment_terms} días
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Contado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit('compras') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete('compras') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSupplier(supplier.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        <AnimatedList>
          {filteredSuppliers.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay proveedores registrados</p>
              </CardContent>
            </Card>
          ) : (
            filteredSuppliers.map(supplier => (
              <AnimatedListItem key={supplier.id}>
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {supplier.code && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {supplier.code}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.contact_name && (
                          <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-2">
                          {supplier.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </span>
                          )}
                          {supplier.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </span>
                          )}
                        </div>
                        {supplier.payment_terms ? (
                          <Badge variant="secondary" className="mt-2">
                            <Calendar className="h-3 w-3 mr-1" />
                            {supplier.payment_terms} días de crédito
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        {canEdit('compras') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete('compras') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedListItem>
            ))
          )}
        </AnimatedList>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre de contacto</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="555-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="proveedor@email.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>RFC</Label>
                <Input
                  value={formData.rfc}
                  onChange={(e) => setFormData(prev => ({ ...prev, rfc: e.target.value }))}
                  placeholder="XAXX010101000"
                />
              </div>
              <div className="space-y-2">
                <Label>Días de crédito</Label>
                <Input
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="gradient-bg border-0" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSupplier ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
