import React from 'react';
import { Badge } from './badge';
import { cn } from './utils';

export interface StatusConfig {
  [key: string]: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  };
}

interface StatusBadgeProps {
  status: string;
  config: StatusConfig;
  className?: string;
}

export function StatusBadge({ status, config, className }: StatusBadgeProps) {
  const statusInfo = config[status] || { label: status, variant: 'outline' as const };
  
  return (
    <Badge
      variant={statusInfo.variant || 'outline'}
      className={cn(statusInfo.className, className)}
    >
      {statusInfo.label}
    </Badge>
  );
}

// 事前定義されたステータス設定
export const staffStatusConfig: StatusConfig = {
  active: { label: '在籍', variant: 'default', className: 'bg-green-100 text-green-800' },
  inactive: { label: '退職', variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
  'on-leave': { label: '休職', variant: 'outline', className: 'bg-yellow-100 text-yellow-800' }
};

export const scenarioStatusConfig: StatusConfig = {
  available: { label: '利用可能', variant: 'default', className: 'bg-green-100 text-green-800' },
  maintenance: { label: 'メンテナンス', variant: 'outline', className: 'bg-yellow-100 text-yellow-800' },
  discontinued: { label: '廃止', variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
};

export const difficultyConfig: StatusConfig = {
  1: { label: '初心者', variant: 'default', className: 'bg-green-100 text-green-800' },
  2: { label: '簡単', variant: 'default', className: 'bg-blue-100 text-blue-800' },
  3: { label: '普通', variant: 'outline', className: 'bg-yellow-100 text-yellow-800' },
  4: { label: '難しい', variant: 'outline', className: 'bg-orange-100 text-orange-800' },
  5: { label: '上級者', variant: 'destructive', className: 'bg-red-100 text-red-800' }
};

export const reservationStatusConfig: StatusConfig = {
  confirmed: { label: '確定', variant: 'default', className: 'bg-green-100 text-green-800' },
  pending: { label: '保留中', variant: 'outline', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'キャンセル', variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
};
