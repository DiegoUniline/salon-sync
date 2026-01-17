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
  const [highlightedIndex, setHighlightedIndex] = useState<Record<string, number>>({});
  const inputRefs = useRef<LineInputRefs>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      // Move to next line's product field
      const nextLine = lines[lineIndex + 1];
      if (nextLine && inputRefs.current[nextLine.id]?.product) {
        setTimeout(() => {
          inputRefs.current[nextLine.id]?.product?.focus();
        }, 50);
      }
    }
  }, [lines]);

  const getFilteredProducts = useCallback((lineId: string) => {
    const searchTerm = (searchTerms[lineId] || '').toLowerCase();
    if (!searchTerm) return products;
    
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm)
    );
  }, [products, searchTerms]);

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
    setHighlightedIndex(prev => ({ ...prev, [lineId]: 0 }));
    
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

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, lineId: string) => {
    const filteredProducts = getFilteredProducts(lineId);
    const currentIndex = highlightedIndex[lineId] || 0;
    const isOpen = openDropdowns[lineId];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setOpenDropdowns(prev => ({ ...prev, [lineId]: true }));
      }
      const newIndex = Math.min(currentIndex + 1, filteredProducts.length - 1);
      setHighlightedIndex(prev => ({ ...prev, [lineId]: newIndex }));
      // Scroll highlighted item into view
      const dropdown = dropdownRefs.current[lineId];
      if (dropdown) {
        const items = dropdown.querySelectorAll('[data-product-item]');
        items[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.max(currentIndex - 1, 0);
      setHighlightedIndex(prev => ({ ...prev, [lineId]: newIndex }));
      const dropdown = dropdownRefs.current[lineId];
      if (dropdown) {
        const items = dropdown.querySelectorAll('[data-product-item]');
        items[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredProducts.length > 0) {
        const product = filteredProducts[currentIndex];
        if (product) {
          handleProductSelect(lineId, product);
        }
      }
    } else if (e.key === 'Tab') {
      // If dropdown is open and there's a highlighted product, select it
      if (isOpen && filteredProducts.length > 0) {
        const product = filteredProducts[currentIndex];
        if (product) {
          e.preventDefault();
          handleProductSelect(lineId, product);
        }
      }
    } else if (e.key === 'Escape') {
      setOpenDropdowns(prev => ({ ...prev, [lineId]: false }));
    }
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, lineId: string, field: 'quantity' | 'cost') => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      
      if (field === 'quantity') {
        // Move to cost field
        const refs = inputRefs.current[lineId];
        if (refs?.cost) {
          if (e.key === 'Enter') {
            refs.cost.focus();
            refs.cost.select();
          }
        }
      } else if (field === 'cost' && e.key === 'Enter') {
        // Move to next line's product field
        focusNextField(lineId, 'cost');
      }
    }
  };

  const handleSearchChange = (lineId: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [lineId]: value }));
    setOpenDropdowns(prev => ({ ...prev, [lineId]: true }));
    setHighlightedIndex(prev => ({ ...prev, [lineId]: 0 }));
    
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

  const handleRemoveLine = (lineId: string) => {
    // Don't remove if it's the only line and it's empty
    if (lines.length === 1) return;
    onRemoveLine(lineId);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[2fr,100px,120px,100px,40px] gap-2 text-sm font-medium text-muted-foreground px-1">
        <span>Producto (↑↓ navegar, Enter seleccionar)</span>
        <span className="text-center">Cantidad</span>
        <span className="text-center">Costo Unit.</span>
        <span className="text-right">Subtotal</span>
        <span></span>
      </div>

      {/* Lines */}
      <div className="space-y-2">
        {lines.map((line) => {
          const filteredProducts = getFilteredProducts(line.id);
          const isEmptyLine = !line.productId;
          const currentHighlight = highlightedIndex[line.id] || 0;
          
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
                  onOpenChange={(open) => {
                    setOpenDropdowns(prev => ({ ...prev, [line.id]: open }));
                    if (open) {
                      setHighlightedIndex(prev => ({ ...prev, [line.id]: 0 }));
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Input
                      ref={(el) => setInputRef(line.id, 'product', el)}
                      type="text"
                      placeholder={isEmptyLine ? "Escribe para agregar..." : "Buscar producto..."}
                      value={searchTerms[line.id] ?? line.productName ?? ''}
                      onChange={(e) => handleSearchChange(line.id, e.target.value)}
                      onFocus={() => {
                        if (!line.productId) {
                          setOpenDropdowns(prev => ({ ...prev, [line.id]: true }));
                          setHighlightedIndex(prev => ({ ...prev, [line.id]: 0 }));
                        }
                      }}
                      onKeyDown={(e) => handleProductKeyDown(e, line.id)}
                      className="w-full bg-background"
                      autoComplete="off"
                    />
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border shadow-lg z-50" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div 
                      ref={(el) => { dropdownRefs.current[line.id] = el; }}
                      className="max-h-[200px] overflow-y-auto"
                    >
                      {filteredProducts.map((product, idx) => (
                        <div
                          key={product.id}
                          data-product-item
                          className={`px-3 py-2 cursor-pointer transition-colors border-b last:border-b-0 ${
                            idx === currentHighlight 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => handleProductSelect(line.id, product)}
                          onMouseEnter={() => setHighlightedIndex(prev => ({ ...prev, [line.id]: idx }))}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className={`text-xs flex justify-between ${
                            idx === currentHighlight ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
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
                  onKeyDown={(e) => handleFieldKeyDown(e, line.id, 'quantity')}
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
                  onKeyDown={(e) => handleFieldKeyDown(e, line.id, 'cost')}
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
