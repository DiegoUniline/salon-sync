import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  products as mockProducts,
  inventoryMovements as mockMovements,
  productCategories,
  type Product,
  type InventoryMovement,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Inventario() {
  const { currentBranch } = useApp();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [movements, setMovements] = useState<InventoryMovement[]>(mockMovements);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');

  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    reason: '',
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && p.stock <= p.minStock) ||
                        (stockFilter === 'ok' && p.stock > p.minStock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  const handleMovement = () => {
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    let newStock = product.stock;
    if (movementType === 'in') {
      newStock += formData.quantity;
    } else if (movementType === 'out') {
      if (formData.quantity > product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      newStock -= formData.quantity;
    } else {
      newStock = formData.quantity;
    }

    // Update product stock
    setProducts(prev => prev.map(p => 
      p.id === formData.productId ? { ...p, stock: newStock } : p
    ));

    // Create movement record
    const newMovement: InventoryMovement = {
      id: `im${Date.now()}`,
      branchId: currentBranch.id,
      productId: formData.productId,
      product,
      type: movementType,
      quantity: movementType === 'adjustment' 
        ? formData.quantity - product.stock 
        : (movementType === 'out' ? -formData.quantity : formData.quantity),
      reason: formData.reason || getDefaultReason(movementType),
      date: new Date().toISOString().split('T')[0],
    };

    setMovements(prev => [newMovement, ...prev]);
    toast.success('Movimiento registrado correctamente');
    setIsDialogOpen(false);
    setFormData({ productId: '', quantity: 1, reason: '' });
  };

  const getDefaultReason = (type: 'in' | 'out' | 'adjustment') => {
    switch (type) {
      case 'in': return 'Entrada de mercancía';
      case 'out': return 'Salida de mercancía';
      case 'adjustment': return 'Ajuste de inventario';
    }
  };

  const openMovementDialog = (type: 'in' | 'out' | 'adjustment') => {
    setMovementType(type);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Control de stock y movimientos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openMovementDialog('in')}>
            <ArrowUpCircle className="h-4 w-4 mr-2 text-success" />
            Entrada
          </Button>
          <Button variant="outline" onClick={() => openMovementDialog('out')}>
            <ArrowDownCircle className="h-4 w-4 mr-2 text-destructive" />
            Salida
          </Button>
          <Button variant="outline" onClick={() => openMovementDialog('adjustment')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Ajuste
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Unidades</p>
              <p className="text-2xl font-bold">{totalUnits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor de Inventario</p>
              <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-lg", lowStockCount > 0 ? "bg-destructive/10" : "bg-success/10")}>
              <AlertTriangle className={cn("h-5 w-5", lowStockCount > 0 ? "text-destructive" : "text-success")} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold">{lowStockCount} productos</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList>
          <TabsTrigger value="stock">Stock Actual</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {productCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="ok">Stock OK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-right">Costo Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.minStock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell className={cn("text-center font-semibold", isLowStock && "text-destructive")}>
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {product.minStock}
                      </TableCell>
                      <TableCell className="text-right">${product.cost}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(product.cost * product.stock).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Bajo
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-success/20 text-success border-success/30">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.date).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="font-medium">{movement.product.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {movement.type === 'in' && (
                            <>
                              <ArrowUpCircle className="h-4 w-4 text-success" />
                              <span className="text-success">Entrada</span>
                            </>
                          )}
                          {movement.type === 'out' && (
                            <>
                              <ArrowDownCircle className="h-4 w-4 text-destructive" />
                              <span className="text-destructive">Salida</span>
                            </>
                          )}
                          {movement.type === 'adjustment' && (
                            <>
                              <RefreshCw className="h-4 w-4 text-warning" />
                              <span className="text-warning">Ajuste</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-center font-semibold",
                        movement.quantity > 0 ? "text-success" : "text-destructive"
                      )}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.reference || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'in' && 'Entrada de Inventario'}
              {movementType === 'out' && 'Salida de Inventario'}
              {movementType === 'adjustment' && 'Ajuste de Inventario'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={formData.productId} onValueChange={(v) => setFormData(prev => ({ ...prev, productId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">Stock: {product.stock}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {movementType === 'adjustment' ? 'Nuevo Stock' : 'Cantidad'}
              </Label>
              <Input
                type="number"
                min={movementType === 'adjustment' ? 0 : 1}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Razón / Descripción</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={getDefaultReason(movementType)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleMovement}
                disabled={!formData.productId}
                className={cn(
                  movementType === 'in' && "bg-success hover:bg-success/90",
                  movementType === 'out' && "bg-destructive hover:bg-destructive/90",
                  movementType === 'adjustment' && "bg-warning hover:bg-warning/90"
                )}
              >
                {movementType === 'in' && 'Registrar Entrada'}
                {movementType === 'out' && 'Registrar Salida'}
                {movementType === 'adjustment' && 'Aplicar Ajuste'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
