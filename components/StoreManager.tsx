import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Store, MapPin, Plus, Eye, Pencil, Trash2, Package, ArrowRightLeft, Building } from 'lucide-react';
import { useStores, Store as StoreType } from '../contexts/StoreContext';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { useScenarios } from '../contexts/ScenarioContext';
import { StoreDialog } from './StoreDialog';
import { KitManagementDialog } from './KitManagementDialog';
import { KitTransferDialog } from './KitTransferDialog';

const statusLabels = {
  'active': '営業中',
  'temporarily_closed': '一時休業',
  'closed': '閉店'
};

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'temporarily_closed': 'bg-yellow-100 text-yellow-800',
  'closed': 'bg-gray-100 text-gray-800'
};

export function StoreManager() {
  const { stores, removeStore } = useStores();
  const { scenarios } = useScenarios();
  const { addEditEntry } = useEditHistory();
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const handleDeleteStore = (store: StoreType) => {
    removeStore(store.id);
    
    // 編集履歴に追加
    addEditEntry({
      user: 'ユーザー',
      action: 'delete',
      target: `${store.name} - 店舗削除`,
      summary: `店舗を削除：${store.name}（${store.address}）`,
      category: 'store',
      changes: [
        { field: '店舗名', oldValue: store.name, newValue: '削除済み' },
        { field: 'ステータス', oldValue: store.status, newValue: '削除済み' }
      ]
    });
  };

  const handleEditStore = (store: StoreType) => {
    setSelectedStore(store);
    setIsEditDialogOpen(true);
  };

  const handleManageKits = (store: StoreType) => {
    setSelectedStore(store);
    setIsKitDialogOpen(true);
  };

  const handleTransferKit = (store: StoreType) => {
    setSelectedStore(store);
    setIsTransferDialogOpen(true);
  };

  // 総キット数の計算
  const totalKits = stores.reduce((sum, store) => sum + store.performanceKits.length, 0);

  // アクティブな店舗数
  const activeStores = stores.filter(store => store.status === 'active').length;

  // シナリオ名を取得するヘルパー関数
  const getScenarioName = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    return scenario?.title || '不明なシナリオ';
  };

  // キット番号による色分けを取得するヘルパー関数
  const getKitColor = (kitNumber: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',      // 1個目：青
      'bg-yellow-100 text-yellow-800 border-yellow-200', // 2個目：黄色
      'bg-green-100 text-green-800 border-green-200',    // 3個目：緑
      'bg-purple-100 text-purple-800 border-purple-200', // 4個目：紫
      'bg-orange-100 text-orange-800 border-orange-200', // 5個目：オレンジ
      'bg-red-100 text-red-800 border-red-200'           // 6個目：赤
    ];
    return colors[(kitNumber - 1) % colors.length];
  };

  // 同一シナリオのキット番号を取得するヘルパー関数
  const getKitNumber = (kits: any[], currentIndex: number, scenarioId: string) => {
    let count = 0;
    for (let i = 0; i <= currentIndex; i++) {
      if (kits[i].scenarioId === scenarioId) {
        count++;
      }
    }
    return count;
  };

  // 店舗ごとの個別色を取得するヘルパー関数
  const getStoreUniqueColor = (storeId: string) => {
    const storeColors: { [key: string]: string } = {
      'store_takadanobaba': 'bg-blue-100 text-blue-800 border-blue-200',
      'store_bekkan1': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'store_bekkan2': 'bg-purple-100 text-purple-800 border-purple-200',
      'store_okubo': 'bg-orange-100 text-orange-800 border-orange-200',  
      'store_otsuka': 'bg-red-100 text-red-800 border-red-200',
      'store_omiya': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    return storeColors[storeId] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>店舗管理</h2>
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            onClick={() => setIsTransferDialogOpen(true)}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            キット移動
          </Button>
          <StoreDialog
            onSave={() => {}}
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新しい店舗を追加
              </Button>
            }
          />
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">総店舗数</p>
                <p className="text-lg">{stores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">営業中店舗</p>
                <p className="text-lg">{activeStores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">総キット数</p>
                <p className="text-lg">{totalKits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">平均キット数</p>
                <p className="text-lg">{stores.length > 0 ? Math.round(totalKits / stores.length) : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 店舗一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>店舗一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>店舗名</TableHead>
                <TableHead>住所</TableHead>
                <TableHead>開始時期</TableHead>
                <TableHead>管理者</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>収容人数</TableHead>
                <TableHead className="max-w-[400px]" rowSpan={4}>キット所在状況</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <Badge className={`${getStoreUniqueColor(store.id)} text-sm border font-medium`}>
                      {store.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={store.address}>
                    {store.address}
                  </TableCell>
                  <TableCell>
                    {new Date(store.openingDate).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>{store.managerName}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[store.status]}>
                      {statusLabels[store.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{store.capacity}名</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">計{store.performanceKits.length}個</span>
                      </div>
                      {store.performanceKits.length > 0 ? (
                        <div 
                          className="flex flex-wrap gap-1 max-w-[400px] max-h-[120px] overflow-hidden cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                          onClick={() => handleManageKits(store)}
                          title="クリックして全キットを表示"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleManageKits(store);
                            }
                          }}
                        >
                          {store.performanceKits.map((kit, index) => {
                            const kitNumber = getKitNumber(store.performanceKits, index, kit.scenarioId);
                            return (
                              <Badge key={index} className={`${getKitColor(kitNumber)} text-xs border`}>
                                {getScenarioName(kit.scenarioId)} #{kitNumber}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">キットなし</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageKits(store)}
                        title="キット管理"
                      >
                        <Package className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTransferKit(store)}
                        title="キット移動"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStore(store)}
                        title="編集"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>店舗を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              「{store.name}」を削除します。この操作は取り消せません。
                              保有している公演キットも同時に削除されます。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStore(store)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {stores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              まだ店舗が登録されていません。「新しい店舗を追加」ボタンから店舗を追加してください。
            </div>
          )}
        </CardContent>
      </Card>

      {/* ダイアログ */}
      {selectedStore && (
        <>
          <StoreDialog
            store={selectedStore}
            onSave={() => {
              setIsEditDialogOpen(false);
              setSelectedStore(null);
            }}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
          <KitManagementDialog
            store={selectedStore}
            open={isKitDialogOpen}
            onOpenChange={setIsKitDialogOpen}
          />
          <KitTransferDialog
            fromStore={selectedStore}
            open={isTransferDialogOpen}
            onOpenChange={setIsTransferDialogOpen}
          />
        </>
      )}

      {/* 全店舗対象のキット移動ダイ���ログ */}
      <KitTransferDialog
        open={isTransferDialogOpen && !selectedStore}
        onOpenChange={setIsTransferDialogOpen}
      />
    </div>
  );
}