import { useState } from 'react';
import { products, productCategories, type Product } from '@/lib/mockData';
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
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' ||
                         (stockFilter === 'low' && product.stock <= product.minStock) ||
                         (stockFilter === 'normal' && product.stock > product.minStock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Catálogo y control de inventario</p>
        </div>
        <Button className="gradient-bg border-0">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="glass-card rounded-xl p-4 border-warning/30 bg-warning/5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Stock bajo detectado</p>
            <p className="text-sm text-muted-foreground">
              {lowStockCount} producto{lowStockCount > 1 ? 's' : ''} con stock bajo o agotado
            </p>
          </div>
          <Button variant="outline" size="sm">
            Ver productos
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
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
              {productCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el stock</SelectItem>
              <SelectItem value="low">Stock bajo</SelectItem>
              <SelectItem value="normal">Stock normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, index) => (
          <ProductCard key={product.id} product={product} delay={index * 50} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const isLowStock = product.stock <= product.minStock;
  const profit = product.price - product.cost;
  const profitMargin = ((profit / product.price) * 100).toFixed(0);

  return (
    <div
      className={cn(
        'glass-card-hover rounded-xl p-5 fade-up',
        isLowStock && 'border-warning/30'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-secondary">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={product.active} className="scale-75" />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="text-xs">
          {product.category}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <div>
          <p className="text-muted-foreground">Precio</p>
          <p className="font-semibold text-lg">${product.price}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Margen</p>
          <p className={cn(
            'font-semibold flex items-center gap-1',
            Number(profitMargin) >= 40 ? 'text-success' : 'text-warning'
          )}>
            {Number(profitMargin) >= 40 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {profitMargin}%
          </p>
        </div>
      </div>

      <div className={cn(
        'flex items-center justify-between p-2 rounded-lg text-sm',
        isLowStock ? 'bg-warning/10 text-warning' : 'bg-secondary'
      )}>
        <span>Stock:</span>
        <span className="font-semibold">
          {product.stock} {isLowStock && '(Bajo)'}
        </span>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="flex-1">
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
      </div>
    </div>
  );
}
