import React from 'react';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Badge } from './badge';

interface MultiSelectGridItem {
  id: string;
  title: string;
}

interface MultiSelectGridProps {
  items: MultiSelectGridItem[];
  selectedItems: string[];
  onToggle: (itemTitle: string) => void;
  className?: string;
  gridCols?: number;
  maxHeight?: string;
  showCount?: boolean;
  showBadges?: boolean;
  emptyMessage?: string;
}

export const MultiSelectGrid = ({
  items,
  selectedItems,
  onToggle,
  className = '',
  gridCols = 2,
  maxHeight = 'max-h-60',
  showCount = true,
  showBadges = true,
  emptyMessage = '選択可能な項目がありません'
}: MultiSelectGridProps) => {
  const gridColsClass = `grid-cols-${gridCols}`;

  if (items.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground p-4 bg-muted rounded-lg ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-2 ${maxHeight} overflow-y-auto border rounded-lg p-3 ${gridColsClass} ${className}`}>
        {items.map(item => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`item-${item.id}`}
              checked={selectedItems.includes(item.title)}
              onCheckedChange={() => onToggle(item.title)}
            />
            <Label htmlFor={`item-${item.id}`} className="text-sm cursor-pointer">
              {item.title}
            </Label>
          </div>
        ))}
      </div>
      
      {showCount && (
        <div className="text-sm text-muted-foreground">
          選択済み: {selectedItems.length}件
        </div>
      )}
      
      {showBadges && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map(item => (
            <Badge key={item} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectGrid;
