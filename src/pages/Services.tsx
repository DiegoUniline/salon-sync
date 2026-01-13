import { useState } from 'react';
import { services as mockServices, serviceCategories, type Service } from '@/lib/mockData';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { toast } from 'sonner';

const categoryIcons: Record<string, React.ReactNode> = {
  'Corte': <Scissors className="h-4 w-4" />,
  'Color': <Palette className="h-4 w-4" />,
  'Barba': <Scissors className="h-4 w-4" />,
  'Uñas': <Sparkles className="h-4 w-4" />,
  'Facial': <Sparkles className="h-4 w-4" />,
  'Peinado': <Sparkles className="h-4 w-4" />,
  'Tratamiento': <Sparkles className="h-4 w-4" />,
};

export default function Services() {
  const [services, setServices] = useState<Service[]>(mockServices);
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
  });

  // Bulk form lines
  const [bulkLines, setBulkLines] = useState<LineItem[]>([]);

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
    setFormData({ name: '', category: 'Corte', duration: 30, price: 0, commission: 0, active: true });
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
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Ingresa el nombre del servicio');
      return;
    }

    if (editingService) {
      setServices(prev => prev.map(s =>
        s.id === editingService.id
          ? { ...s, ...formData }
          : s
      ));
      toast.success('Servicio actualizado');
    } else {
      const newService: Service = {
        id: `s${Date.now()}`,
        ...formData,
      };
      setServices(prev => [...prev, newService]);
      toast.success('Servicio creado');
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success('Servicio eliminado');
  };

  const toggleService = (id: string, active: boolean) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active } : s));
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
      searchItems: serviceCategories.map(c => ({ id: c, label: c })),
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

  const handleBulkSubmit = () => {
    const validLines = bulkLines.filter(line => line.name);
    if (validLines.length === 0) {
      toast.error('Agrega al menos un servicio');
      return;
    }

    const newServices: Service[] = validLines.map(line => ({
      id: `s${Date.now()}-${Math.random()}`,
      name: line.name,
      category: line.category || 'Corte',
      duration: line.duration || 30,
      price: line.price || 0,
      commission: line.commission || 0,
      active: true,
    }));

    setServices(prev => [...prev, ...newServices]);
    toast.success(`${newServices.length} servicios creados`);
    setBulkLines([]);
    setIsBulkDialogOpen(false);
  };

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
              <Button variant="outline">
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
                  <Button className="gradient-bg border-0" onClick={handleBulkSubmit}>
                    Guardar {bulkLines.filter(l => l.name).length} Servicios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-bg border-0">
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
                        {serviceCategories.map(cat => (
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
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button className="gradient-bg border-0" onClick={handleSubmit}>
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
              {serviceCategories.map(cat => (
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
      {viewMode === 'table' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Duración</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Comisión</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded bg-primary/10 text-primary">
                        {categoryIcons[service.category] || <Scissors className="h-3 w-3" />}
                      </span>
                      {service.category}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration} min
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">${service.price}</TableCell>
                  <TableCell className="text-center">{service.commission || 0}%</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={service.active}
                      onCheckedChange={(active) => toggleService(service.id, active)}
                      className="scale-90"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteService(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron servicios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="space-y-8">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {categoryIcons[category] || <Scissors className="h-4 w-4" />}
                </div>
                <h2 className="text-lg font-semibold">{category}</h2>
                <span className="text-sm text-muted-foreground">
                  ({categoryServices.length})
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryServices.map((service, index) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    delay={index * 50}
                    onEdit={() => openEditDialog(service)}
                    onDelete={() => deleteService(service.id)}
                    onToggle={(active) => toggleService(service.id, active)}
                  />
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedServices).length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No se encontraron servicios
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  delay: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}

function ServiceCard({ service, delay, onEdit, onDelete, onToggle }: ServiceCardProps) {
  return (
    <div
      className="glass-card-hover rounded-xl p-5 fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{service.name}</h3>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {service.category}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Switch 
            checked={service.active} 
            onCheckedChange={onToggle}
            className="scale-75" 
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold text-foreground">${service.price}</span>
        </div>
      </div>

      {service.commission && (
        <p className="text-xs text-muted-foreground mt-3">
          Comisión: {service.commission}%
        </p>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}