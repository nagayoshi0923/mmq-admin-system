import React from 'react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useStaff } from '../contexts/StaffContext';

interface GMSelectorProps {
  selectedGMs: string[];
  onGMChange: (gms: string[]) => void;
  className?: string;
}

export const GMSelector: React.FC<GMSelectorProps> = ({ 
  selectedGMs, 
  onGMChange, 
  className = "grid grid-cols-3 gap-2" 
}) => {
  const { staff } = useStaff();

  // GM可能なスタッフを取得（GMまたはマネージャーの役割を持つアクティブなスタッフ）
  const availableGMStaff = staff.filter(s => 
    s.status === 'active' && 
    (s.role.includes('GM') || s.role.includes('マネージャー'))
  );

  const handleGMChange = (gmName: string, checked: boolean) => {
    if (checked) {
      onGMChange([...selectedGMs, gmName]);
    } else {
      onGMChange(selectedGMs.filter(gm => gm !== gmName));
    }
  };

  return (
    <div className={className}>
      {availableGMStaff.map(staffMember => (
        <div key={staffMember.id} className="flex items-center space-x-2">
          <Checkbox
            id={`gm-${staffMember.id}`}
            checked={selectedGMs.includes(staffMember.name)}
            onCheckedChange={(checked) => handleGMChange(staffMember.name, checked as boolean)}
          />
          <Label htmlFor={`gm-${staffMember.id}`} className="text-sm">
            {staffMember.name}
          </Label>
        </div>
      ))}
    </div>
  );
};
