import React from 'react';
import { TableCell } from './table';
import { cn } from './utils';

interface EditableCellProps<T> {
  item: T;
  field: keyof T;
  onEdit?: (item: T, field: keyof T, value: any) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

export function EditableCell<T extends { id: string }>({
  item,
  field,
  onEdit,
  className,
  children,
  disabled = false,
  title = "クリックして編集"
}: EditableCellProps<T>) {
  const handleClick = () => {
    if (!disabled && onEdit) {
      onEdit(item, field, item[field]);
    }
  };

  return (
    <TableCell
      className={cn(
        disabled 
          ? "cursor-default" 
          : "cursor-pointer hover:bg-muted/50 p-1 rounded",
        className
      )}
      onClick={handleClick}
      title={disabled ? undefined : title}
    >
      {children}
    </TableCell>
  );
}
