import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Cloud, CloudOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSupabase } from '../contexts/SupabaseContext';

interface SupabaseSyncIndicatorProps {
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  compact?: boolean;
}

export function SupabaseSyncIndicator({ 
  loading = false, 
  error = null, 
  onRefresh, 
  compact = false 
}: SupabaseSyncIndicatorProps) {
  const { isConnected, enableRealtime } = useSupabase();

  const getIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (error) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    if (isConnected && enableRealtime) return <Cloud className="w-4 h-4 text-green-600" />;
    if (isConnected) return <Cloud className="w-4 h-4 text-blue-600" />;
    return <CloudOff className="w-4 h-4 text-gray-500" />;
  };

  const getStatus = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (isConnected && enableRealtime) return 'realtime';
    if (isConnected) return 'connected';
    return 'offline';
  };

  const getStatusText = () => {
    switch (getStatus()) {
      case 'loading': return '同期中...';
      case 'error': return 'エラー';
      case 'realtime': return 'リアルタイム';
      case 'connected': return '接続済み';
      case 'offline': return 'ローカル';
      default: return 'ローカル';
    }
  };

  const getVariant = () => {
    switch (getStatus()) {
      case 'loading': return 'secondary';
      case 'error': return 'destructive';
      case 'realtime': return 'default';
      case 'connected': return 'secondary';
      case 'offline': return 'outline';
      default: return 'outline';
    }
  };

  const getTooltip = () => {
    switch (getStatus()) {
      case 'loading': 
        return 'Supabaseと同期しています...';
      case 'error': 
        return `同期エラー: ${error}`;
      case 'realtime': 
        return 'Supabaseとリアルタイム同期中\n他のユーザーの変更が即座に反映されます';
      case 'connected': 
        return 'Supabaseに接続済み\nリアルタイム同期は無効です';
      case 'offline': 
        return 'ローカルストレージのみ\nSupabaseに接続していません';
      default: 
        return 'データ同期状況';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {getIcon()}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="whitespace-pre-line">{getTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant={getVariant()} className="flex items-center gap-1">
              {getIcon()}
              <span>{getStatusText()}</span>
            </Badge>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 px-2"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="whitespace-pre-line">{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}