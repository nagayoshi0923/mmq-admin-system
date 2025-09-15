import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Check, AlertTriangle, Download, Upload, Database, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DataStatus {
  key: string;
  name: string;
  exists: boolean;
  size: string;
  lastUpdated: string;
}

export function DataPersistenceStatus() {
  const [dataStatus, setDataStatus] = useState<DataStatus[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const checkDataStatus = () => {
    const keys = [
      { key: 'murder-mystery-scenarios', name: 'シナリオデータ' },
      { key: 'murder-mystery-staff', name: 'スタッフデータ' },
      { key: 'murderMystery_stores', name: '店舗データ' },
      { key: 'murder-mystery-schedule-events', name: '公演スケジュール' },
      { key: 'murder-mystery-edit-history', name: '編集履歴' },
    ];

    const status: DataStatus[] = keys.map(({ key, name }) => {
      const data = localStorage.getItem(key);
      return {
        key,
        name,
        exists: !!data,
        size: data ? `${(data.length / 1024).toFixed(1)}KB` : '0KB',
        lastUpdated: data ? new Date().toLocaleString('ja-JP') : '未保存'
      };
    });

    setDataStatus(status);
  };

  useEffect(() => {
    checkDataStatus();
    // 定期的にデータ状況をチェック
    const interval = setInterval(checkDataStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const exportAllData = () => {
    setIsExporting(true);
    try {
      const allData: { [key: string]: any } = {};
      
      dataStatus.forEach(({ key }) => {
        const data = localStorage.getItem(key);
        if (data) {
          allData[key] = JSON.parse(data);
        }
      });

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: allData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `murder-mystery-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('データをエクスポートしました', {
        description: 'バックアップファイルがダウンロードされました'
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.data) {
          Object.keys(importedData.data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(importedData.data[key]));
          });
          
          toast.success('データをインポートしました', {
            description: 'ページをリロードして変更を反映してください'
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast.error('インポートに失敗しました', {
          description: 'ファイル形式が正しくありません'
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    dataStatus.forEach(({ key }) => {
      localStorage.removeItem(key);
    });
    
    toast.success('全データを削除しました', {
      description: 'ページをリロードして初期状態に戻ります'
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const totalSize = dataStatus.reduce((total, item) => {
    const size = parseFloat(item.size.replace('KB', ''));
    return total + size;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          データ永続化状況
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          入力したデータは自動的にブラウザのローカルストレージに保存されます
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* データ状況一覧 */}
          <div className="space-y-2">
            {dataStatus.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {item.exists ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.exists ? "default" : "secondary"}>
                    {item.size}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.lastUpdated}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 統計情報 */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">総容量</span>
              <span className="text-lg font-semibold">{totalSize.toFixed(1)}KB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">保存済みデータ</span>
              <span className="text-sm">{dataStatus.filter(item => item.exists).length}/{dataStatus.length} 種類</span>
            </div>
          </div>

          {/* アクション */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkDataStatus}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              更新
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportAllData}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'エクスポート中...' : 'データ出力'}
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  データ取込
                </span>
              </Button>
            </label>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  全削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>全データを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作により、保存されているすべてのデータ（公演スケジュール、スタッフ情報、シナリオデータなど）が完全に削除されます。
                    この操作は取り消すことができません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* 注意事項 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">重要な注意事項</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• データはブラウザのローカルストレージに保存されます</li>
              <li>• ブラウザデータを削除すると全て失われます</li>
              <li>• 定期的にデータ出力でバックアップを取ることを推奨します</li>
              <li>• 異なるブラウザ・デバイス間でデータは共有されません</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}