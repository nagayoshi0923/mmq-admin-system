import { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Cloud, 
  Download,
  Users,
  BookOpen,
  Store,
  FileText,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';

export function SupabaseStatus() {
  const { 
    isConnected, 
    isLoading, 
    error, 
    migrationStatus, 
    migrateToSupabase, 
    testConnection,
    enableRealtime,
    setEnableRealtime
  } = useSupabase();

  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isConnected) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if (isLoading) return 'yellow';
    if (isConnected) return 'green';
    return 'red';
  };

  const getStatusText = () => {
    if (isLoading) return '接続中...';
    if (isConnected) return 'Supabase接続済み';
    if (!isSupabaseConfigured()) return 'Supabase未設定';
    return 'Supabase未接続';
  };

  const getMigrationIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  const allMigrated = migrationStatus.staff && 
                      migrationStatus.scenarios && 
                      migrationStatus.stores && 
                      migrationStatus.editHistory;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      {/* コンパクトなステータス表示 */}
      <div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all duration-200 ${
          error ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
        } hover:shadow-xl`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span className="text-xs font-medium">{isConnected ? 'DB接続済み' : 'ローカル'}</span>
        <Badge 
          variant={getStatusColor() === 'green' ? 'default' : 'secondary'}
          className="text-xs px-1.5 py-0.5"
        >
          {enableRealtime && isConnected ? 'RT' : 'Local'}
        </Badge>
        
        {enableRealtime && isConnected ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEnableRealtime(false);
            }}
            title="リアルタイム同期を無効にする"
            className="h-6 w-6 p-0"
          >
            <Wifi className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEnableRealtime(true);
            }}
            title="リアルタイム同期を有効にする"
            className="h-6 w-6 p-0"
          >
            <WifiOff className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {error && (
        <div className="mt-1 px-3 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 詳細情報表示 */}
      {showDetails && (
        <Card className="mt-2 bg-white shadow-lg max-w-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Supabase統合状況
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 接続状況 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">データベース接続</h4>
              <div className="flex items-center justify-between text-sm">
                <span>接続状態</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span>{isConnected ? '接続済み' : '未接続'}</span>
                </div>
              </div>
              
              {!isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={isLoading}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再接続テスト
                </Button>
              )}
            </div>

            {/* 移行状況 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">データ移行状況</h4>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>スタッフ</span>
                  </div>
                  {getMigrationIcon(migrationStatus.staff)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>シナリオ</span>
                  </div>
                  {getMigrationIcon(migrationStatus.scenarios)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    <span>店舗</span>
                  </div>
                  {getMigrationIcon(migrationStatus.stores)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>編集履歴</span>
                  </div>
                  {getMigrationIcon(migrationStatus.editHistory)}
                </div>
              </div>

              {migrationStatus.lastMigration && (
                <div className="text-xs text-muted-foreground">
                  最終移行: {new Date(migrationStatus.lastMigration).toLocaleString('ja-JP')}
                </div>
              )}

              {!allMigrated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={migrateToSupabase}
                  disabled={isLoading || !isConnected}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  データを移行
                </Button>
              )}
            </div>

            {/* 機能状況 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">機能</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>リアルタイム同期</span>
                  <Badge variant={enableRealtime && isConnected ? 'default' : 'secondary'}>
                    {enableRealtime && isConnected ? '有効' : '無効'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>自動バックアップ</span>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? '有効' : '無効'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>データ同期</span>
                  <Badge variant={isConnected && allMigrated ? 'default' : 'secondary'}>
                    {isConnected && allMigrated ? '完了' : '未完了'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Supabase未設定の説明 */}
            {!isSupabaseConfigured() && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-sm text-blue-800 mb-1">
                  🚀 Supabaseを設定しませんか？
                </h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 複数スタッフでのリアルタイム同期</li>
                  <li>• 自動バックアップとデータ保護</li>
                  <li>• 高速検索とデータ分析</li>
                  <li>• 災害時の業務継続性確保</li>
                </ul>
                <div className="mt-2 text-xs text-blue-600">
                  SUPABASE_SETUP.mdを参照してセットアップしてください
                </div>
              </div>
            )}

            {/* 利点の説明 */}
            {isConnected && allMigrated && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-sm text-green-800 mb-1">
                  🎉 Supabase統合完了！
                </h5>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• 複数スタッフでのリアルタイム同期</li>
                  <li>• 自動バックアップとデータ保護</li>
                  <li>• 高速検索とデータ分析</li>
                  <li>• 災害時の業務継続性確保</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}