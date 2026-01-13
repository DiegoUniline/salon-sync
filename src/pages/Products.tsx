import { useState } from 'react';
import { products as mockProducts, productCategories, type Product } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { OdooLineEditor, type LineItem, type ColumnConfig } from '@/components/OdooLineEditor';
import { EditableCell } from '@/components/EditableCell';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Single form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Shampoo',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 5,
    active: true,
  });

  // Bulk form lines
  const [bulkLines, setBulkLines] = useState<LineItem[]>([]);

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

  const resetForm = () => {
    setFormData({ name: '', category: 'Shampoo', sku: '', price: 0, cost: 0, stock: 0, minStock: 5, active: true });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      active: product.active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Ingresa el nombre del producto');
      return;
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id ? { ...p, ...formData } : p
      ));
      toast.success('Producto actualizado');
    } else {
      const newProduct: Product = {
        id: `p${Date.now()}`,
        ...formData,
        sku: formData.sku || `SKU-${Date.now()}`,
      };
      setProducts(prev => [...prev, newProduct]);
      toast.success('Producto creado');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Producto eliminado');
  };

  const toggleProduct = (id: string, active: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active } : p));
  };

  const updateProductField = (id: string, field: string, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    toast.success('Actualizado');
  };

  // Bulk operations
  const bulkColumns: ColumnConfig[] = [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre del producto',
      width: 'flex-[2]',
    },
    {
      key: 'category',
      label: 'Categoría',
      type: 'search',
      placeholder: 'Categoría',
      width: 'w-36',
      searchItems: productCategories.map(c => ({ id: c, label: c })),
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      placeholder: 'SKU-001',
      width: 'w-28',
    },
    {
      key: 'cost',
      label: 'Costo',
      type: 'number',
      width: 'w-24',
      min: 0,
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      width: 'w-24',
      min: 0,
    },
    {
      key: 'stock',
      label: 'Stock',
      type: 'number',
      width: 'w-20',
      min: 0,
    },
  ];

  const addBulkLine = () => {
    setBulkLines(prev => [
      ...prev,
      { id: `line-${Date.now()}`, name: '', category: 'Shampoo', sku: '', cost: 0, price: 0, stock: 0 }
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
      toast.error('Agrega al menos un producto');
      return;
    }

    const newProducts: Product[] = validLines.map(line => ({
      id: `p${Date.now()}-${Math.random()}`,
      name: line.name,
      category: line.category || 'Shampoo',
      sku: line.sku || `SKU-${Date.now()}`,
      price: line.price || 0,
      cost: line.cost || 0,
      stock: line.stock || 0,
      minStock: 5,
      active: true,
    }));

    setProducts(prev => [...prev, ...newProducts]);
    toast.success(`${newProducts.length} productos creados`);
    setBulkLines([]);
    setIsBulkDialogOpen(false);
  };

  const getStockBadge = (product: Product) => {
    const isLow = product.stock <= product.minStock;
    return (
      <Badge variant={isLow ? 'destructive' : 'secondary'} className={cn(isLow && 'bg-warning/10 text-warning border-warning/30')}>
        {product.stock} uds
      </Badge>
    );
  };

  const getProfitMargin = (product: Product) => {
    const profit = product.price - product.cost;
    const margin = product.price > 0 ? ((profit / product.price) * 100).toFixed(0) : '0';
    return { margin: Number(margin), isGood: Number(margin) >= 40 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Catálogo y control de inventario</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Múltiples
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Productos (Estilo Odoo)</DialogTitle>
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
                  emptyMessage="Haz clic o presiona Tab para agregar productos"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => { setBulkLines([]); setIsBulkDialogOpen(false); }}>
                    Cancelar
                  </Button>
                  <Button className="gradient-bg border-0" onClick={handleBulkSubmit}>
                    Guardar {bulkLines.filter(l => l.name).length} Productos
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-bg border-0">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del producto"
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
                        {productCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Costo</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio de Venta</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stock Actual</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label>Producto activo</Label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button className="gradient-bg border-0" onClick={handleSubmit}>
                    {editingProduct ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
          <Button variant="outline" size="sm" onClick={() => setStockFilter('low')}>
            Ver productos
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Margen</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const { margin, isGood } = getProfitMargin(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <EditableCell
                        value={product.name}
                        onSave={(v) => updateProductField(product.id, 'name', v)}
                        type="text"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <EditableCell
                        value={product.sku}
                        onSave={(v) => updateProductField(product.id, 'sku', v)}
                        type="text"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={product.category}
                        onSave={(v) => updateProductField(product.id, 'category', v)}
                        type="select"
                        options={productCategories.map(c => ({ value: c, label: c }))}
                        displayValue={<Badge variant="secondary">{product.category}</Badge>}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableCell
                        value={product.cost}
                        onSave={(v) => updateProductField(product.id, 'cost', v)}
                        type="number"
                        min={0}
                        displayValue={<span className="text-muted-foreground">${product.cost}</span>}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableCell
                        value={product.price}
                        onSave={(v) => updateProductField(product.id, 'price', v)}
                        type="number"
                        min={0}
                        displayValue={<span className="font-semibold">${product.price}</span>}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn('flex items-center justify-center gap-1 text-sm font-medium', isGood ? 'text-success' : 'text-warning')}>
                        {isGood ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {margin}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <EditableCell
                        value={product.stock}
                        onSave={(v) => updateProductField(product.id, 'stock', v)}
                        type="number"
                        min={0}
                        displayValue={getStockBadge(product)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={product.active}
                        onCheckedChange={(active) => toggleProduct(product.id, active)}
                        className="scale-90"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                delay={index * 50}
                onEdit={() => openEditDialog(product)}
                onDelete={() => deleteProduct(product.id)}
                onToggle={(active) => toggleProduct(product.id, active)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No se encontraron productos
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  delay: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}

function ProductCard({ product, delay, onEdit, onDelete, onToggle }: ProductCardProps) {
  const isLowStock = product.stock <= product.minStock;
  const profit = product.price - product.cost;
  const profitMargin = product.price > 0 ? ((profit / product.price) * 100).toFixed(0) : '0';

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
          <Switch 
            checked={product.active} 
            onCheckedChange={onToggle}
            className="scale-75" 
          />
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
        'flex items-center gap-2 text-sm p-2 rounded-lg mb-4',
        isLowStock ? 'bg-warning/10 text-warning' : 'bg-secondary'
      )}>
        {isLowStock && <AlertTriangle className="h-4 w-4" />}
        <span className="font-medium">Stock: {product.stock}</span>
        <span className="text-muted-foreground">/ Mín: {product.minStock}</span>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
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