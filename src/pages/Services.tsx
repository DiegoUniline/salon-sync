import { useState } from 'react';
import { services, serviceCategories, type Service } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Scissors,
  Palette,
  Sparkles,
  Edit,
  MoreHorizontal,
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-muted-foreground">Catálogo de servicios disponibles</p>
        </div>
        <Button className="gradient-bg border-0">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
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
        </div>
      </div>

      {/* Services Grid */}
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
                <ServiceCard key={service.id} service={service} delay={index * 50} />
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
    </div>
  );
}

function ServiceCard({ service, delay }: { service: Service; delay: number }) {
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
          <Switch checked={service.active} className="scale-75" />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
        <Button variant="outline" size="sm" className="flex-1">
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
      </div>
    </div>
  );
}
