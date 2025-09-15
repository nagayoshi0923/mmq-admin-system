import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface StaffScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
}

export function StaffScheduleDialog({ isOpen, onClose, staffId }: StaffScheduleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スタッフスケジュール</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>スケジュール管理機能は準備中です</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
