import { useEffect, useState } from 'react';
import { dataStorage, performStartupHealthCheck } from '../utils/dataStorage';
import { useScenarios } from '../contexts/ScenarioContext';
import { useStaff } from '../contexts/StaffContext';
import { useStores } from '../contexts/StoreContext';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DataStatus {
  key: string;
  name: string;
  hasData: boolean;
  lastSaved: Date | null;
  dataCount: number;
  status: 'healthy' | 'warning' | 'error';
}

export function DataIntegrityMonitor() {
  const { scenarios } = useScenarios();
  const { staff } = useStaff();
  const { stores } = useStores();
  const { editHistory } = useEditHistory();
  
  const [dataStatuses, setDataStatuses] = useState<DataStatus[]>([]);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [showDetails, setShowDetails] = useState(false);

  // データ状況をチェック
  const checkDataIntegrity = () => {
    const statuses: DataStatus[] = [
      {
        key: 'murder-mystery-scenarios',
        name: 'シナリオデータ',
        hasData: dataStorage.hasData('murder-mystery-scenarios'),
        lastSaved: dataStorage.getLastSavedTime('murder-mystery-scenarios'),
        dataCount: scenarios.length,
        status: scenarios.length > 0 ? 'healthy' : 'warning'
      },
      {
        key: 'murder-mystery-staff',
        name: 'スタッフデータ',
        hasData: dataStorage.hasData('murder-mystery-staff'),
        lastSaved: dataStorage.getLastSavedTime('murder-mystery-staff'),
        dataCount: staff.length,
        status: staff.length > 0 ? 'healthy' : 'warning'
      },
      {
        key: 'murderMystery_stores',
        name: '店舗データ',
        hasData: dataStorage.hasData('murderMystery_stores'),
        lastSaved: dataStorage.getLastSavedTime('murderMystery_stores'),
        dataCount: stores.length,
        status: stores.length > 0 ? 'healthy' : 'warning'
      },
      {
        key: 'murder-mystery-edit-history',
        name: '編集履歴',
        hasData: dataStorage.hasData('murder-mystery-edit-history'),
        lastSaved: dataStorage.getLastSavedTime('murder-mystery-edit-history'),
        dataCount: editHistory.length,
        status: 'healthy'
      }
    ];

    setDataStatuses(statuses);

    // システム全体の健全性を判定
    const hasErrors = statuses.some(s => s.status === 'error');
    const hasWarnings = statuses.some(s => s.status === 'warning');
    
    setSystemHealth(hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy');
  };

  // 起動時の健全性チェック
  useEffect(() => {
    const isHealthy = performStartupHealthCheck();
    if (!isHealthy) {
      setSystemHealth('error');
    }
    checkDataIntegrity();
  }, [scenarios, staff, stores, editHistory]);

  // 定期的な健全性チェック（5分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      checkDataIntegrity();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '未保存';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getAlertVariant = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // 健全な状態では表示しない
  if (systemHealth === 'healthy' && !showDetails) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={getAlertVariant(systemHealth)} className="mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(systemHealth)}
          <div className="flex-1">
            <AlertDescription>
              {systemHealth === 'healthy' && 'すべてのデータが正常に保存されています'}
              {systemHealth === 'warning' && 'データの一部に注意が必要です'}
              {systemHealth === 'error' && 'データの保存に問題があります'}
            </AlertDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="w-4 h-4" />
            </Button>
            {systemHealth !== 'healthy' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Alert>

      {showDetails && (
        <Alert variant="default" className="bg-white border shadow-lg">
          <Info className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">データ状況</div>
              {dataStatuses.map((status) => (
                <div key={status.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span>{status.name}</span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{status.dataCount}件</div>
                    <div>{formatDate(status.lastSaved)}</div>
                  </div>
                </div>
              ))}
              
              <div className="mt-3 pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  ストレージ使用量: {dataStorage.getStorageUsage().percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}