import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LineItem {
  id: string;
  [key: string]: any;
}

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'search' | 'select';
  width?: string;
  placeholder?: string;
  searchItems?: { id: string; label: string; subLabel?: string; data?: any }[];
  onSelect?: (item: any, lineId: string) => void;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
  format?: (value: any) => string;
}

interface OdooLineEditorProps {
  lines: LineItem[];
  columns: ColumnConfig[];
  onUpdateLine: (lineId: string, key: string, value: any) => void;
  onRemoveLine: (lineId: string) => void;
  onAddLine: () => void;
  showTotal?: boolean;
  totalLabel?: string;
  totalValue?: number;
  emptyMessage?: string;
}

export function OdooLineEditor({
  lines,
  columns,
  onUpdateLine,
  onRemoveLine,
  onAddLine,
  showTotal = false,
  totalLabel = 'Total',
  totalValue = 0,
  emptyMessage = 'Presiona Tab o haz clic para agregar una línea',
}: OdooLineEditorProps) {
  const [activeCell, setActiveCell] = useState<{ lineId: string; colKey: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const getCellKey = (lineId: string, colKey: string) => `${lineId}-${colKey}`;

  const focusCell = (lineId: string, colKey: string) => {
    const key = getCellKey(lineId, colKey);
    setTimeout(() => {
      const input = inputRefs.current.get(key);
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    lineIndex: number,
    colIndex: number,
    line: LineItem
  ) => {
    const editableColumns = columns.filter(c => !c.readOnly);
    
    if (e.key === 'Tab') {
      e.preventDefault();
      setShowDropdown(false);
      setSearchQuery('');

      const isLastColumn = colIndex === columns.length - 1;
      const isLastLine = lineIndex === lines.length - 1;

      if (isLastColumn && isLastLine) {
        // Last cell of last line - add new line
        onAddLine();
        setTimeout(() => {
          const newLineId = lines.length > 0 ? `new-${Date.now()}` : '';
          if (columns[0]) {
            focusCell(newLineId, columns[0].key);
          }
        }, 50);
      } else if (isLastColumn) {
        // Move to first column of next line
        const nextLine = lines[lineIndex + 1];
        if (nextLine) {
          focusCell(nextLine.id, columns[0].key);
        }
      } else {
        // Move to next column
        const nextCol = columns[colIndex + 1];
        if (nextCol) {
          focusCell(line.id, nextCol.key);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setShowDropdown(false);
      setSearchQuery('');
      
      // Move to next line, same column
      const nextLine = lines[lineIndex + 1];
      if (nextLine) {
        focusCell(nextLine.id, columns[colIndex].key);
      } else {
        onAddLine();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown' && showDropdown) {
      e.preventDefault();
      // Handle dropdown navigation
    } else if (e.key === 'ArrowUp' && showDropdown) {
      e.preventDefault();
      // Handle dropdown navigation
    }
  };

  // Add first line automatically if empty and user focuses container
  const handleContainerClick = () => {
    if (lines.length === 0) {
      onAddLine();
    }
  };

  useEffect(() => {
    if (lines.length > 0 && activeCell === null) {
      const firstLine = lines[lines.length - 1];
      const firstCol = columns[0];
      if (firstLine && firstCol) {
        focusCell(firstLine.id, firstCol.key);
      }
    }
  }, [lines.length]);

  return (
    <div ref={containerRef} className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-muted/50 border-b border-border text-sm font-medium">
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn('px-3 py-2 text-muted-foreground', col.width || 'flex-1')}
          >
            {col.label}
          </div>
        ))}
        <div className="w-10" />
      </div>

      {/* Lines */}
      <div className="divide-y divide-border">
        {lines.length === 0 ? (
          <div
            className="px-4 py-8 text-center text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={handleContainerClick}
          >
            {emptyMessage}
          </div>
        ) : (
          lines.map((line, lineIndex) => (
            <div
              key={line.id}
              className="flex items-center hover:bg-muted/20 transition-colors group"
            >
              {columns.map((col, colIndex) => (
                <div key={col.key} className={cn('relative', col.width || 'flex-1')}>
                  {col.type === 'search' ? (
                    <SearchCell
                      line={line}
                      col={col}
                      lineIndex={lineIndex}
                      colIndex={colIndex}
                      columns={columns}
                      lines={lines}
                      inputRefs={inputRefs}
                      getCellKey={getCellKey}
                      onKeyDown={handleKeyDown}
                      onUpdateLine={onUpdateLine}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      showDropdown={showDropdown && activeCell?.lineId === line.id && activeCell?.colKey === col.key}
                      setShowDropdown={setShowDropdown}
                      setActiveCell={setActiveCell}
                    />
                  ) : col.readOnly ? (
                    <div className="h-10 px-3 flex items-center justify-end text-muted-foreground font-medium bg-muted/20">
                      {col.format ? col.format(line[col.key]) : (line[col.key] ?? '')}
                    </div>
                  ) : (
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current.set(getCellKey(line.id, col.key), el);
                      }}
                      type={col.type === 'number' ? 'number' : 'text'}
                      value={line[col.key] ?? ''}
                      onChange={(e) => {
                        const value = col.type === 'number' 
                          ? parseFloat(e.target.value) || 0 
                          : e.target.value;
                        onUpdateLine(line.id, col.key, value);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, lineIndex, colIndex, line)}
                      onFocus={() => setActiveCell({ lineId: line.id, colKey: col.key })}
                      placeholder={col.placeholder}
                      min={col.min}
                      max={col.max}
                      step={col.step}
                      className={cn(
                        'border-0 rounded-none bg-transparent h-10 focus:ring-1 focus:ring-primary focus:bg-primary/5',
                        col.type === 'number' && 'text-right'
                      )}
                    />
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => onRemoveLine(line.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add Line Button */}
      <div
        className="flex items-center px-3 py-2 border-t border-border cursor-pointer hover:bg-muted/30 transition-colors text-primary"
        onClick={onAddLine}
      >
        <Plus className="h-4 w-4 mr-2" />
        <span className="text-sm">Agregar línea</span>
      </div>

      {/* Total */}
      {showTotal && (
        <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-t border-primary/20">
          <span className="font-medium">{totalLabel}</span>
          <span className="text-xl font-bold">${totalValue.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// Search Cell Component
interface SearchCellProps {
  line: LineItem;
  col: ColumnConfig;
  lineIndex: number;
  colIndex: number;
  columns: ColumnConfig[];
  lines: LineItem[];
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  getCellKey: (lineId: string, colKey: string) => string;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, lineIndex: number, colIndex: number, line: LineItem) => void;
  onUpdateLine: (lineId: string, key: string, value: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  setActiveCell: (cell: { lineId: string; colKey: string } | null) => void;
}

function SearchCell({
  line,
  col,
  lineIndex,
  colIndex,
  columns,
  lines,
  inputRefs,
  getCellKey,
  onKeyDown,
  onUpdateLine,
  searchQuery,
  setSearchQuery,
  showDropdown,
  setShowDropdown,
  setActiveCell,
}: SearchCellProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayValue = line[col.key] || '';
  const isEditing = showDropdown || !displayValue;

  const filteredItems = (col.searchItems || []).filter(item =>
    item.label.toLowerCase().includes(localQuery.toLowerCase()) ||
    (item.subLabel && item.subLabel.toLowerCase().includes(localQuery.toLowerCase()))
  );

  const handleSelect = (item: any) => {
    onUpdateLine(line.id, col.key, item.label);
    if (col.onSelect) {
      col.onSelect(item, line.id);
    }
    setShowDropdown(false);
    setLocalQuery('');
    
    // Move to next column
    const nextCol = columns[colIndex + 1];
    if (nextCol) {
      const key = getCellKey(line.id, nextCol.key);
      setTimeout(() => {
        const input = inputRefs.current.get(key);
        if (input) {
          input.focus();
          input.select();
        }
      }, 10);
    }
  };

  const handleLocalKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && showDropdown) {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp' && showDropdown) {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && showDropdown && filteredItems[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[highlightedIndex]);
    } else {
      onKeyDown(e, lineIndex, colIndex, line);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={(el) => {
          if (el) inputRefs.current.set(getCellKey(line.id, col.key), el);
        }}
        value={isEditing ? localQuery : displayValue}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          setShowDropdown(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => {
          setActiveCell({ lineId: line.id, colKey: col.key });
          if (!displayValue) {
            setShowDropdown(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 150);
        }}
        onKeyDown={handleLocalKeyDown}
        placeholder={col.placeholder || 'Buscar...'}
        className="border-0 rounded-none bg-transparent h-10 focus:ring-1 focus:ring-primary focus:bg-primary/5"
      />
      
      {showDropdown && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                'px-3 py-2 cursor-pointer transition-colors',
                idx === highlightedIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
              )}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <p className="font-medium text-sm">{item.label}</p>
              {item.subLabel && (
                <p className="text-xs text-muted-foreground">{item.subLabel}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
