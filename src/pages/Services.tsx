import { useState, useEffect } from 'react';
import { type Service } from '@/lib/mockData';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';
import { AnimatedContainer, AnimatedCard, AnimatedList, AnimatedListItem, PageTransition } from '@/components/ui/animated-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { OdooLineEditor, type LineItem, type ColumnConfig } from '@/components/OdooLineEditor';
import { EditableCell } from '@/components/EditableCell';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Scissors,
  Palette,
  Sparkles,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const categoryIcons: Record<string, React.ReactNode> = {
  'Corte': <Scissors className="h-4 w-4" />,
  'Color': <Palette className="h-4 w-4" />,
  'Barba': <Scissors className="h-4 w-4" />,
  'Uñas': <Sparkles className="h-4 w-4" />,
  'Facial': <Sparkles className="h-4 w-4" />,
  'Peinado': <Sparkles className="h-4 w-4" />,
  'Tratamiento': <Sparkles className="h-4 w-4" />,
};

// Helper to map API response to frontend Service type
const mapApiService = (apiService: any): Service => ({
  id: apiService.id,
  name: apiService.name,
  category: apiService.category,
  duration: apiService.duration,
  price: parseFloat(apiService.price) || 0,
  commission: parseFloat(apiService.commission) || 0,
  active: apiService.active === 1 || apiService.active === true,
  allowConcurrent: apiService.allow_concurrent === 1 || apiService.allow_concurrent === true,
  maxConcurrent: apiService.max_concurrent || 1,
});

export default function Services() {
  const isMobile = useIsMobile();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Single form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Corte',
    duration: 30,
    price: 0,
    commission: 0,
    active: true,
    allowConcurrent: false,
    maxConcurrent: 1,
  });

  // Bulk form lines
  const [bulkLines, setBulkLines] = useState<LineItem[]>([]);

  // Load services and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, categoriesData] = await Promise.all([
          api.services.getAll(),
          api.services.getCategories(),
        ]);
        setServices(servicesData.map(mapApiService));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading services:', error);
        toast.error('Error al cargar servicios');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const resetForm = () => {
    setFormData({ name: '', category: 'Corte', duration: 30, price: 0, commission: 0, active: true, allowConcurrent: false, maxConcurrent: 1 });
    setEditingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      duration: service.duration,
      price: service.price,
      commission: service.commission || 0,
      active: service.active,
      allowConcurrent: service.allowConcurrent || false,
      maxConcurrent: service.maxConcurrent || 1,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Ingresa el nombre del servicio');
      return;
    }

    try {
      setSaving(true);
      const apiData = {
        name: formData.name,
        category: formData.category,
        duration: formData.duration,
        price: formData.price,
        commission: formData.commission,
        active: formData.active ? 1 : 0,
        allow_concurrent: formData.allowConcurrent ? 1 : 0,
        max_concurrent: formData.maxConcurrent,
      };

      if (editingService) {
        const updated = await api.services.update(editingService.id, apiData);
        setServices(prev => prev.map(s =>
          s.id === editingService.id ? mapApiService(updated) : s
        ));
        toast.success('Servicio actualizado');
      } else {
        const created = await api.services.create(apiData);
        setServices(prev => [...prev, mapApiService(created)]);
        toast.success('Servicio creado');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Error al guardar servicio');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      await api.services.delete(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Servicio eliminado');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar servicio');
    }
  };

  const toggleService = async (id: string, active: boolean) => {
    try {
      await api.services.update(id, { active: active ? 1 : 0 });
      setServices(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Error al actualizar servicio');
    }
  };

  const updateServiceField = async (id: string, field: string, value: any) => {
    try {
      const apiField = field === 'allowConcurrent' ? 'allow_concurrent' : 
                       field === 'maxConcurrent' ? 'max_concurrent' : field;
      const apiValue = field === 'active' || field === 'allowConcurrent' ? (value ? 1 : 0) : value;
      
      await api.services.update(id, { [apiField]: apiValue });
      setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
      toast.success('Actualizado');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Error al actualizar');
    }
  };

  // Bulk operations
  const bulkColumns: ColumnConfig[] = [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre del servicio',
      width: 'flex-[2]',
    },
    {
      key: 'category',
      label: 'Categoría',
      type: 'search',
      placeholder: 'Categoría',
      width: 'w-40',
      searchItems: categories.map(c => ({ id: c, label: c })),
    },
    {
      key: 'duration',
      label: 'Duración (min)',
      type: 'number',
      width: 'w-32',
      min: 5,
      step: 5,
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      width: 'w-28',
      min: 0,
    },
    {
      key: 'commission',
      label: 'Comisión %',
      type: 'number',
      width: 'w-28',
      min: 0,
      max: 100,
    },
  ];

  const addBulkLine = () => {
    setBulkLines(prev => [
      ...prev,
      { id: `line-${Date.now()}`, name: '', category: 'Corte', duration: 30, price: 0, commission: 0 }
    ]);
  };

  const updateBulkLine = (lineId: string, key: string, value: any) => {
    setBulkLines(prev => prev.map(line =>
      line.id === lineId ? { ...line, [key]: value } : line
    ));
  };

  const removeBulkLine = (lineId: string) => {
    setBulkLines(prev => prev.filter(line => line.id !== lineId));
  };

  const handleBulkSubmit = async () => {
    const validLines = bulkLines.filter(line => line.name);
    if (validLines.length === 0) {
      toast.error('Agrega al menos un servicio');
      return;
    }

    try {
      setSaving(true);
      const bulkData = validLines.map(line => ({
        name: line.name,
        category: line.category || 'Corte',
        duration: line.duration || 30,
        price: line.price || 0,
        commission: line.commission || 0,
        active: 1,
      }));

      const created = await api.services.createBulk(bulkData);
      setServices(prev => [...prev, ...created.map(mapApiService)]);
      toast.success(`${created.length} servicios creados`);
      setBulkLines([]);
      setIsBulkDialogOpen(false);
    } catch (error) {
      console.error('Error creating bulk services:', error);
      toast.error('Error al crear servicios');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-muted-foreground">Catálogo de servicios disponibles</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!canCreate('servicios')}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Múltiples
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Servicios (Estilo Odoo)</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Usa Tab para moverte entre campos. Al llegar al último campo de la última línea, Tab agrega una nueva línea.
                </p>
                <OdooLineEditor
                  lines={bulkLines}
                  columns={bulkColumns}
                  onUpdateLine={updateBulkLine}
                  onRemoveLine={removeBulkLine}
                  onAddLine={addBulkLine}
                  emptyMessage="Haz clic o presiona Tab para agregar servicios"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => { setBulkLines([]); setIsBulkDialogOpen(false); }}>
                    Cancelar
                  </Button>
                  <Button className="gradient-bg border-0" onClick={handleBulkSubmit} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Guardar {bulkLines.filter(l => l.name).length} Servicios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-bg border-0" disabled={!canCreate('servicios')}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del servicio"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duración (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comisión %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.commission}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label>Servicio activo</Label>
                </div>
                
                {/* Citas simultáneas */}
                <div className="border rounded-lg p-4 space-y-4 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Permitir citas simultáneas</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        El estilista puede atender múltiples clientes a la vez con este servicio
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowConcurrent}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        allowConcurrent: checked,
                        maxConcurrent: checked ? 2 : 1 
                      }))}
                    />
                  </div>
                  
                  {formData.allowConcurrent && (
                    <div className="space-y-2">
                      <Label>Máximo de clientes simultáneos</Label>
                      <Select 
                        value={formData.maxConcurrent.toString()} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, maxConcurrent: parseInt(v) }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 clientes</SelectItem>
                          <SelectItem value="3">3 clientes</SelectItem>
                          <SelectItem value="4">4 clientes</SelectItem>
                          <SelectItem value="5">5 clientes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button className="gradient-bg border-0" onClick={handleSubmit} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingService ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg p-1 bg-secondary/50">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'gradient-bg border-0' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className={viewMode === 'card' ? 'gradient-bg border-0' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && !isMobile && (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Duración</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Comisión</TableHead>
                <TableHead className="text-center">Simultáneos</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <EditableCell
                      value={service.name}
                      onSave={(value) => updateServiceField(service.id, 'name', value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5">
                      {categoryIcons[service.category]}
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <EditableCell
                      value={service.duration}
                      type="number"
                      onSave={(value) => updateServiceField(service.id, 'duration', value)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableCell
                      value={service.price}
                      type="number"
                      onSave={(value) => updateServiceField(service.id, 'price', value)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <EditableCell
                      value={service.commission || 0}
                      type="number"
                      onSave={(value) => updateServiceField(service.id, 'commission', value)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {service.allowConcurrent ? (
                      <Badge variant="secondary">{service.maxConcurrent || 2}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={service.active}
                      onCheckedChange={(checked) => toggleService(service.id, checked)}
                      disabled={!canEdit('servicios')}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(service)}
                        disabled={!canEdit('servicios')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteService(service.id)}
                        disabled={!canDelete('servicios')}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Card View */}
      {(viewMode === 'card' || isMobile) && (
        <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="col-span-full space-y-3">
              <div className="flex items-center gap-2">
                {categoryIcons[category]}
                <h2 className="font-semibold text-lg">{category}</h2>
                <Badge variant="secondary">{categoryServices.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryServices.map((service) => (
                  <AnimatedListItem key={service.id}>
                    <ServiceCard
                      service={service}
                      onEdit={() => openEditDialog(service)}
                      onDelete={() => deleteService(service.id)}
                      onToggle={(active) => toggleService(service.id, active)}
                      canEdit={canEdit('servicios')}
                      canDelete={canDelete('servicios')}
                    />
                  </AnimatedListItem>
                ))}
              </div>
            </div>
          ))}
        </AnimatedList>
      )}

      {/* Empty State */}
      {filteredServices.length === 0 && !loading && (
        <div className="glass-card rounded-xl p-12 text-center">
          <Scissors className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-1">No hay servicios</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all' 
              ? 'No se encontraron servicios con esos filtros'
              : 'Comienza agregando tu primer servicio'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Button className="gradient-bg border-0" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Servicio
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function ServiceCard({ service, onEdit, onDelete, onToggle, canEdit, canDelete }: ServiceCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card rounded-xl p-4 space-y-3',
        !service.active && 'opacity-60'
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{service.name}</h3>
          <p className="text-sm text-muted-foreground">{service.category}</p>
        </div>
        <Switch
          checked={service.active}
          onCheckedChange={onToggle}
          disabled={!canEdit}
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
        <div className="flex items-center gap-1 font-medium">
          <DollarSign className="h-4 w-4" />
          <span>${service.price}</span>
        </div>
      </div>

      {service.commission > 0 && (
        <Badge variant="secondary" className="text-xs">
          Comisión: {service.commission}%
        </Badge>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onEdit}
          disabled={!canEdit}
        >
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={!canDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
