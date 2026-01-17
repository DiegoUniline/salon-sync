import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

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

interface LineInputRefs {
  [lineId: string]: {
    product: HTMLInputElement | null;
    quantity: HTMLInputElement | null;
    cost: HTMLInputElement | null;
  };
}

export function SimplePurchaseLineEditor({
  lines,
  products,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  total,
}: SimplePurchaseLineEditorProps) {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<LineInputRefs>({});

  // Ensure there's always an empty line at the end
  useEffect(() => {
    const hasEmptyLine = lines.some(line => !line.productId);
    if (!hasEmptyLine && lines.length === 0) {
      onAddLine();
    } else if (!hasEmptyLine && lines.every(line => line.productId)) {
      onAddLine();
    }
  }, [lines, onAddLine]);

  const setInputRef = useCallback((lineId: string, field: 'product' | 'quantity' | 'cost', el: HTMLInputElement | null) => {
    if (!inputRefs.current[lineId]) {
      inputRefs.current[lineId] = { product: null, quantity: null, cost: null };
    }
    inputRefs.current[lineId][field] = el;
  }, []);

  const focusNextField = useCallback((lineId: string, currentField: 'product' | 'quantity' | 'cost') => {
    const lineIndex = lines.findIndex(l => l.id === lineId);
    const refs = inputRefs.current[lineId];
    
    if (currentField === 'product' && refs?.quantity) {
      refs.quantity.focus();
      refs.quantity.select();
    } else if (currentField === 'quantity' && refs?.cost) {
      refs.cost.focus();
      refs.cost.select();
    } else if (currentField === 'cost') {
      // Move to next line's product field or create new line
      const nextLine = lines[lineIndex + 1];
      if (nextLine && inputRefs.current[nextLine.id]?.product) {
        inputRefs.current[nextLine.id].product?.focus();
      }
    }
  }, [lines]);

  const handleProductSelect = (lineId: string, product: ProductOption) => {
    const quantity = lines.find(l => l.id === lineId)?.quantity || 1;
    const unitCost = product.cost || 0;
    onUpdateLine(lineId, {
      productId: product.id,
      productName: product.name,
      unitCost,
      subtotal: quantity * unitCost,
    });
    setSearchTerms(prev => ({ ...prev, [lineId]: product.name }));
    setOpenDropdowns(prev => ({ ...prev, [lineId]: false }));
    
    // Auto-focus quantity after selecting product
    setTimeout(() => {
      focusNextField(lineId, 'product');
    }, 50);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, lineId: string, field: 'product' | 'quantity' | 'cost') => {
    if (e.key === 'Tab' && !e.shiftKey) {
      if (field === 'cost') {
        // On last field, let natural tab behavior work to next line
        return;
      }
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      focusNextField(lineId, field);
    }
  };

  const handleSearchChange = (lineId: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [lineId]: value }));
    setOpenDropdowns(prev => ({ ...prev, [lineId]: true }));
    
    // If clearing the search, also clear the product selection
    if (!value) {
      onUpdateLine(lineId, {
        productId: '',
        productName: '',
        unitCost: 0,
        subtotal: 0,
      });
    }
  };

  const getFilteredProducts = (lineId: string) => {
    const searchTerm = (searchTerms[lineId] || '').toLowerCase();
    if (!searchTerm) return products;
    
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm)
    );
  };

  const handleRemoveLine = (lineId: string) => {
    // Don't remove if it's the only line and it's empty
    if (lines.length === 1) return;
    onRemoveLine(lineId);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[2fr,100px,120px,100px,40px] gap-2 text-sm font-medium text-muted-foreground px-1">
        <span>Producto (escribe para buscar)</span>
        <span className="text-center">Cantidad</span>
        <span className="text-center">Costo Unit.</span>
        <span className="text-right">Subtotal</span>
        <span></span>
      </div>

      {/* Lines */}
      <div className="space-y-2">
        {lines.map((line, index) => {
          const filteredProducts = getFilteredProducts(line.id);
          const isEmptyLine = !line.productId;
          
          return (
            <div
              key={line.id}
              className={`grid grid-cols-1 sm:grid-cols-[2fr,100px,120px,100px,40px] gap-2 p-3 rounded-lg items-center ${
                isEmptyLine ? 'bg-muted/20 border border-dashed' : 'bg-secondary/30'
              }`}
            >
              {/* Product Search */}
              <div className="w-full">
                <Popover 
                  open={openDropdowns[line.id] && filteredProducts.length > 0} 
                  onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [line.id]: open }))}
                >
                  <PopoverTrigger asChild>
                    <Input
                      ref={(el) => setInputRef(line.id, 'product', el)}
                      type="text"
                      placeholder={isEmptyLine ? "Escribe para agregar producto..." : "Buscar producto..."}
                      value={searchTerms[line.id] ?? line.productName ?? ''}
                      onChange={(e) => handleSearchChange(line.id, e.target.value)}
                      onFocus={() => {
                        if (!line.productId) {
                          setOpenDropdowns(prev => ({ ...prev, [line.id]: true }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' && openDropdowns[line.id]) {
                          e.preventDefault();
                          // Focus first item in dropdown
                        } else if (e.key === 'Escape') {
                          setOpenDropdowns(prev => ({ ...prev, [line.id]: false }));
                        } else {
                          handleKeyDown(e, line.id, 'product');
                        }
                      }}
                      className="w-full bg-background"
                    />
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border shadow-lg z-50" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0"
                          onClick={() => handleProductSelect(line.id, product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>SKU: {product.sku}</span>
                            <span>Stock: {product.stock}</span>
                            <span className="font-medium">${product.cost?.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="px-3 py-4 text-center text-muted-foreground">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 sm:block">
                <span className="text-sm text-muted-foreground sm:hidden">Cant:</span>
                <Input
                  ref={(el) => setInputRef(line.id, 'quantity', el)}
                  type="number"
                  min={1}
                  value={line.quantity || ''}
                  onChange={(e) => handleQuantityChange(line.id, parseInt(e.target.value) || 1)}
                  onKeyDown={(e) => handleKeyDown(e, line.id, 'quantity')}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-center bg-background"
                  disabled={!line.productId}
                  placeholder="1"
                />
              </div>

              {/* Unit Cost */}
              <div className="flex items-center gap-2 sm:block">
                <span className="text-sm text-muted-foreground sm:hidden">Costo:</span>
                <Input
                  ref={(el) => setInputRef(line.id, 'cost', el)}
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitCost || ''}
                  onChange={(e) => handleCostChange(line.id, parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => handleKeyDown(e, line.id, 'cost')}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-center bg-background"
                  disabled={!line.productId}
                  placeholder="0.00"
                />
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-sm text-muted-foreground sm:hidden">Subtotal:</span>
                <span className={`font-semibold text-right ${!line.productId ? 'text-muted-foreground' : ''}`}>
                  ${(line.subtotal || 0).toLocaleString()}
                </span>
              </div>

              {/* Delete */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={lines.length === 1 && !line.productId}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

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
