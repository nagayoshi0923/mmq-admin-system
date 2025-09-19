import React from 'react';
import { Button } from './button';
import { ChevronDown } from 'lucide-react';

interface MultiSelectDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLButtonElement>;
  placeholder?: string;
  selectedItems: string[];
  className?: string;
}

const MultiSelectDropdown = ({ 
  isOpen, 
  onClose, 
  children, 
  triggerRef,
  placeholder = '選択してください',
  selectedItems = [],
  className = ''
}: MultiSelectDropdownProps) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
};

interface MultiSelectTriggerProps {
  onClick: () => void;
  selectedItems: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelectTrigger = React.forwardRef<HTMLButtonElement, MultiSelectTriggerProps>(
  ({ onClick, selectedItems, placeholder = '選択してください', className = '', disabled = false }, ref) => {
    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        className={`w-full justify-between border border-slate-200 ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span>
          {selectedItems.length === 0 
            ? placeholder 
            : selectedItems.join(', ')
          }
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }
);

MultiSelectTrigger.displayName = 'MultiSelectTrigger';

interface MultiSelectItemProps {
  value: string;
  checked: boolean;
  onToggle: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const MultiSelectItem = ({ 
  value, 
  checked, 
  onToggle, 
  children, 
  className = '' 
}: MultiSelectItemProps) => {
  return (
    <div
      className={`flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer ${className}`}
      onClick={() => onToggle(value)}
    >
      <div className={`w-4 h-4 border rounded flex items-center justify-center ${
        checked 
          ? 'bg-blue-500 border-blue-500' 
          : 'border-gray-300'
      }`}>
        {checked && (
          <div className="w-2 h-2 bg-white rounded-sm" />
        )}
      </div>
      <span className="text-sm">{children}</span>
    </div>
  );
};

export default MultiSelectDropdown;
