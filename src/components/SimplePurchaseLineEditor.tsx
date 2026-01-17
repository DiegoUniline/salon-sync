import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

export interface PurchaseLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  cost: number;
  stock: number;
}

interface SimplePurchaseLineEditorProps {
  lines: PurchaseLine[];
  products: ProductOption[];
  onAddLine: () => void;
  onUpdateLine: (lineId: string, updates: Partial<PurchaseLine>) => void;
  onRemoveLine: (lineId: string) => void;
  total: number;
}

export function SimplePurchaseLineEditor({
  lines,
  products,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  total,
}: SimplePurchaseLineEditorProps) {
  const handleProductSelect = (lineId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const quantity = lines.find(l => l.id === lineId)?.quantity || 1;
      const unitCost = product.cost || 0;
      onUpdateLine(lineId, {
        productId: product.id,
        productName: product.name,
        unitCost,
        subtotal: quantity * unitCost,
      });
    }
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    const line = lines.find(l => l.id === lineId);
    if (line) {
      onUpdateLine(lineId, {
        quantity,
        subtotal: quantity * line.unitCost,
      });
    }
  };

  const handleCostChange = (lineId: string, unitCost: number) => {
    const line = lines.find(l => l.id === lineId);
    if (line) {
      onUpdateLine(lineId, {
        unitCost,
        subtotal: line.quantity * unitCost,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[2fr,100px,120px,100px,40px] gap-2 text-sm font-medium text-muted-foreground px-1">
        <span>Producto</span>
        <span className="text-center">Cantidad</span>
        <span className="text-center">Costo Unit.</span>
        <span className="text-right">Subtotal</span>
        <span></span>
      </div>

      {/* Lines */}
      {lines.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <p className="mb-3">No hay productos agregados</p>
          <Button variant="outline" size="sm" onClick={onAddLine}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-1 sm:grid-cols-[2fr,100px,120px,100px,40px] gap-2 p-3 bg-secondary/30 rounded-lg items-center"
            >
              {/* Product Select */}
              <div className="w-full">
                <Select
                  value={line.productId || undefined}
                  onValueChange={(value) => handleProductSelect(line.id, value)}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Seleccionar producto..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            SKU: {product.sku} | Stock: {product.stock}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 sm:block">
                <span className="text-sm text-muted-foreground sm:hidden">Cant:</span>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => handleQuantityChange(line.id, parseInt(e.target.value) || 1)}
                  className="w-full text-center bg-background"
                />
              </div>

              {/* Unit Cost */}
              <div className="flex items-center gap-2 sm:block">
                <span className="text-sm text-muted-foreground sm:hidden">Costo:</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitCost}
                  onChange={(e) => handleCostChange(line.id, parseFloat(e.target.value) || 0)}
                  className="w-full text-center bg-background"
                />
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-sm text-muted-foreground sm:hidden">Subtotal:</span>
                <span className="font-semibold text-right">
                  ${line.subtotal.toLocaleString()}
                </span>
              </div>

              {/* Delete */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveLine(line.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Line Button */}
          <Button variant="outline" size="sm" onClick={onAddLine} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-end items-center gap-4 pt-4 border-t">
        <span className="text-lg font-medium">Total de la Compra:</span>
        <span className="text-2xl font-bold text-primary">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
