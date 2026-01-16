import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  active: boolean;
}

interface InventoryMovement {
  id: string;
  branch_id: string;
  product_id: string;
  product_name?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  reference?: string;
}

export default function Inventario() {
  const { currentBranch } = useApp();
  const { canCreate, canEdit } = usePermissions();
  const isMobile = useIsMobile();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  
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

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentBranch?.id) return;
      setLoading(true);
      try {
        const [productsData, movementsData, categoriesData] = await Promise.all([
          api.products.getAll(),
          api.inventory.getMovements({ branch_id: currentBranch.id }),
          api.products.getCategories().catch(() => []),
        ]);
        setProducts(productsData.map((p: any) => ({
          ...p,
          min_stock: p.min_stock || p.minStock || 5,
        })));
        setMovements(movementsData.map((m: any) => ({
          ...m,
          branch_id: m.branch_id,
          product_id: m.product_id,
          product_name: m.product_name || m.product?.name,
        })));
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentBranch?.id]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && p.stock <= p.min_stock) ||
                        (stockFilter === 'ok' && p.stock > p.min_stock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;
  const totalValue = products.reduce((sum, p) => sum + (Number(p.cost) * p.stock), 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  const handleMovement = async () => {
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    let newStock = product.stock;
    let quantityChange = formData.quantity;

    if (movementType === 'in') {
      newStock += formData.quantity;
    } else if (movementType === 'out') {
      if (formData.quantity > product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      newStock -= formData.quantity;
      quantityChange = -formData.quantity;
    } else {
      quantityChange = formData.quantity - product.stock;
      newStock = formData.quantity;
    }

    try {
      const movementData = {
        branch_id: currentBranch?.id,
        product_id: formData.productId,
        type: movementType,
        quantity: quantityChange,
        reason: formData.reason || getDefaultReason(movementType),
      };

      let result;
      if (movementType === 'in') {
        result = await api.inventory.addIn(movementData);
      } else if (movementType === 'out') {
        result = await api.inventory.addOut(movementData);
      } else {
        result = await api.inventory.adjust(movementData);
      }

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === formData.productId ? { ...p, stock: newStock } : p
      ));

      const newMovement: InventoryMovement = {
        id: result.id || `im${Date.now()}`,
        branch_id: currentBranch?.id || '',
        product_id: formData.productId,
        product_name: product.name,
        type: movementType,
        quantity: quantityChange,
        reason: formData.reason || getDefaultReason(movementType),
        date: new Date().toISOString().split('T')[0],
      };

      setMovements(prev => [newMovement, ...prev]);
      toast.success('Movimiento registrado correctamente');
      setIsDialogOpen(false);
      setFormData({ productId: '', quantity: 1, reason: '' });
    } catch (error) {
      console.error('Error creating movement:', error);
      toast.error('Error al registrar movimiento');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Control de stock y movimientos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openMovementDialog('in')} disabled={!canCreate('inventario')}>
            <ArrowUpCircle className="h-4 w-4 mr-2 text-success" />
            Entrada
          </Button>
          <Button variant="outline" onClick={() => openMovementDialog('out')} disabled={!canCreate('inventario')}>
            <ArrowDownCircle className="h-4 w-4 mr-2 text-destructive" />
            Salida
          </Button>
          <Button variant="outline" onClick={() => openMovementDialog('adjustment')} disabled={!canEdit('inventario')}>
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
                  {categories.map(cat => (
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

          {/* Products Table */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.min_stock;
                return (
                  <div key={product.id} className="glass-card rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
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
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock</p>
                        <p className={cn("font-semibold", isLowStock && "text-destructive")}>
                          {product.stock} / {product.min_stock} min
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-semibold">${(Number(product.cost) * product.stock).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
                    const isLowStock = product.stock <= product.min_stock;
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
                          {product.min_stock}
                        </TableCell>
                        <TableCell className="text-right">${Number(product.cost).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(Number(product.cost) * product.stock).toLocaleString()}
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
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {isMobile ? (
            <div className="space-y-3">
              {movements.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                  No hay movimientos registrados
                </div>
              ) : (
                movements.map((movement) => (
                  <div key={movement.id} className="glass-card rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{movement.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(movement.date).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className={cn(
                        "text-lg font-bold",
                        movement.quantity > 0 ? "text-success" : "text-destructive"
                      )}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {movement.type === 'in' && (
                        <Badge className="bg-success/20 text-success border-success/30 gap-1">
                          <ArrowUpCircle className="h-3 w-3" />
                          Entrada
                        </Badge>
                      )}
                      {movement.type === 'out' && (
                        <Badge variant="destructive" className="gap-1">
                          <ArrowDownCircle className="h-3 w-3" />
                          Salida
                        </Badge>
                      )}
                      {movement.type === 'adjustment' && (
                        <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Ajuste
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground pt-2 border-t">
                      {movement.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Razón</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.date).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell className="font-medium">{movement.product_name}</TableCell>
                        <TableCell>
                          {movement.type === 'in' && (
                            <Badge className="bg-success/20 text-success border-success/30 gap-1">
                              <ArrowUpCircle className="h-3 w-3" />
                              Entrada
                            </Badge>
                          )}
                          {movement.type === 'out' && (
                            <Badge variant="destructive" className="gap-1">
                              <ArrowDownCircle className="h-3 w-3" />
                              Salida
                            </Badge>
                          )}
                          {movement.type === 'adjustment' && (
                            <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Ajuste
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          "text-center font-semibold",
                          movement.quantity > 0 ? "text-success" : "text-destructive"
                        )}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{movement.reason}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'in' && 'Registrar Entrada'}
              {movementType === 'out' && 'Registrar Salida'}
              {movementType === 'adjustment' && 'Ajustar Inventario'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select 
                value={formData.productId} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, productId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between gap-4">
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
                min={0}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Razón (opcional)</Label>
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
                className="gradient-bg border-0"
                onClick={handleMovement}
                disabled={!formData.productId}
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
