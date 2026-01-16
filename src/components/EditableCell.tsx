import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  displayValue?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

export function EditableCell({
  value,
  onSave,
  type = 'text',
  options = [],
  className,
  displayValue,
  min,
  max,
  step,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | number>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when double-clicking to edit
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    setIsEditing(false);
    const finalValue = type === 'number' ? parseFloat(String(editValue)) || 0 : editValue;
    if (finalValue !== value) {
      onSave(finalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const handleSelectChange = (newValue: string) => {
    setEditValue(newValue);
    onSave(newValue);
    setIsEditing(false);
  };

  if (isEditing) {
    if (type === 'select') {
      return (
        <Select 
          value={String(editValue)} 
          onValueChange={handleSelectChange}
          open={true}
          onOpenChange={(open) => !open && setIsEditing(false)}
        >
          <SelectTrigger className="h-8 min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(type === 'number' ? e.target.value : e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        className="h-8 min-w-[60px] w-auto"
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors -mx-2",
        className
      )}
      title="Doble clic para editar"
    >
      {displayValue ?? value}
    </div>
  );
}
