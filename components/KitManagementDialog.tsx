import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Package, Plus, Pencil, Trash2, History } from 'lucide-react';
import { Store as StoreType, PerformanceKit } from '../contexts/StoreContext';
import { useStores } from '../contexts/StoreContext';
import { useScenarios } from '../contexts/ScenarioContext';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { ItemEditHistory } from './ItemEditHistory';

interface KitManagementDialogProps {
  store: StoreType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKitChange?: () => void; // キット変更時のコールバック
}

const conditionLabels = {
  'excellent': '優良',
  'good': '良好',
  'fair': '普通',
  'poor': '劣化',
  'damaged': '破損'
};

const conditionColors = {
  'excellent': 'bg-green-100 text-green-800',
  'good': 'bg-blue-100 text-blue-800',
  'fair': 'bg-yellow-100 text-yellow-800',
  'poor': 'bg-orange-100 text-orange-800',
  'damaged': 'bg-red-100 text-red-800'
};

export function KitManagementDialog({ store, open, onOpenChange, onKitChange }: KitManagementDialogProps) {
  const { stores, addPerformanceKit, updatePerformanceKit, removePerformanceKit } = useStores();
  const { scenarios } = useScenarios();
  const { addEditEntry } = useEditHistory();
  
  // 最新の店舗データを取得（リアルタイム反映のため）
  const currentStore = stores.find(s => s.id === store.id) || store;
  const [isAddingKit, setIsAddingKit] = useState(false);
  const [editingKit, setEditingKit] = useState<PerformanceKit | null>(null);
  const [historyKit, setHistoryKit] = useState<PerformanceKit | null>(null);

  const [newKit, setNewKit] = useState<Partial<PerformanceKit>>({
    scenarioId: '',
    kitNumber: 1,
    condition: 'excellent',
    notes: ''
  });

  const handleAddKit = () => {
    if (!newKit.scenarioId) return;

    const scenario = scenarios.find(s => s.id === newKit.scenarioId);
    if (!scenario) return;

    const kitData: Omit<PerformanceKit, 'id'> = {
      scenarioId: newKit.scenarioId,
      scenarioTitle: scenario.title,
      kitNumber: newKit.kitNumber || 1,
      condition: newKit.condition || 'excellent',
      notes: newKit.notes || ''
    };

    addPerformanceKit(currentStore.id, kitData);

    // キット変更を通知
    onKitChange?.();

    // フォームリセット
    setNewKit({
      scenarioId: '',
      kitNumber: 1,
      condition: 'excellent',
      notes: ''
    });
    setIsAddingKit(false);
  };

  const handleUpdateKit = (kit: PerformanceKit) => {
    updatePerformanceKit(currentStore.id, kit);
    setEditingKit(null);
    
    // キット変更を通知
    onKitChange?.();
  };

  const handleDeleteKit = (kitId: string) => {
    removePerformanceKit(currentStore.id, kitId);
    
    // キット変更を通知
    onKitChange?.();
  };

  const handleKitMove = async (kit: PerformanceKit, newStoreId: string) => {
    if (newStoreId === currentStore.id) return; // 同じ店舗の場合は何もしない

    try {
      const targetStore = stores.find(s => s.id === newStoreId);
      if (!targetStore) return;

      // 新しい店舗にキットを追加
      const kitData: Omit<PerformanceKit, 'id'> = {
        scenarioId: kit.scenarioId,
        scenarioTitle: kit.scenarioTitle,
        kitNumber: kit.kitNumber,
        condition: kit.condition,
        lastUsed: kit.lastUsed,
        notes: kit.notes
      };
      
      await addPerformanceKit(newStoreId, kitData);
      
      // 元の店舗からキットを削除
      await removePerformanceKit(currentStore.id, kit.id);
      
      // 編集履歴に記録
      await addEditEntry({
        user: 'システム',
        action: 'update',
        target: `${kit.scenarioTitle} キット#${kit.kitNumber}`,
        summary: `キットを${currentStore.name}から${targetStore.name}に移動`,
        category: 'inventory', // 'store'カテゴリがCHECK制約で許可されていないため'inventory'を使用
        changes: [
          {
            field: '所在店舗',
            oldValue: currentStore.name,
            newValue: targetStore.name
          }
        ]
      });
      
      // キット変更を通知
      onKitChange?.();
      
      console.log(`キット「${kit.scenarioTitle} #${kit.kitNumber}」を移動しました`);
    } catch (error) {
      console.error('キット移動エラー:', error);
    }
  };

  const availableScenarios = scenarios.filter(s => s.status === 'available');

  // 次のキット番号を自動計算
  const getNextKitNumber = (scenarioId: string) => {
    const existingKits = currentStore.performanceKits.filter(kit => kit.scenarioId === scenarioId);
    if (existingKits.length === 0) return 1;
    const maxNumber = Math.max(...existingKits.map(kit => kit.kitNumber));
    return maxNumber + 1;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {currentStore.name} - 公演キット管理
          </DialogTitle>
          <DialogDescription>
            この店舗の公演キットを管理します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 新規キット追加フォーム */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">新規キット追加</h3>
              <Button
                variant={isAddingKit ? "outline" : "default"}
                onClick={() => setIsAddingKit(!isAddingKit)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAddingKit ? 'キャンセル' : 'キットを追加'}
              </Button>
            </div>

            {isAddingKit && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>シナリオ</Label>
                  <Select 
                    value={newKit.scenarioId} 
                    onValueChange={(value) => {
                      setNewKit(prev => ({ 
                        ...prev, 
                        scenarioId: value,
                        kitNumber: getNextKitNumber(value)
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="シナリオを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableScenarios.map(scenario => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>キット番号</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newKit.kitNumber || ''}
                    onChange={(e) => setNewKit(prev => ({ ...prev, kitNumber: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>状態</Label>
                  <Select 
                    value={newKit.condition} 
                    onValueChange={(value: any) => setNewKit(prev => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(conditionLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>備考</Label>
                  <Textarea
                    value={newKit.notes || ''}
                    onChange={(e) => setNewKit(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="備考やメモ"
                    className="min-h-20"
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <Button onClick={handleAddKit} disabled={!newKit.scenarioId}>
                    キットを追加
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* キット一覧 */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">保有キット一覧 ({currentStore.performanceKits.length}件)</h3>
            </div>
            
            {currentStore.performanceKits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>シナリオ</TableHead>
                    <TableHead>キット番号</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>所在店舗</TableHead>
                    <TableHead>最終使用日</TableHead>
                    <TableHead>備考</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStore.performanceKits.map((kit) => (
                    <TableRow key={kit.id}>
                      <TableCell>
                        {editingKit?.id === kit.id ? (
                          <Select 
                            value={editingKit.scenarioId} 
                            onValueChange={(value) => {
                              const scenario = scenarios.find(s => s.id === value);
                              setEditingKit(prev => prev ? { 
                                ...prev, 
                                scenarioId: value,
                                scenarioTitle: scenario?.title || ''
                              } : null);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableScenarios.map(scenario => (
                                <SelectItem key={scenario.id} value={scenario.id}>
                                  {scenario.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          kit.scenarioTitle
                        )}
                      </TableCell>
                      <TableCell>
                        {editingKit?.id === kit.id ? (
                          <Input
                            type="number"
                            min="1"
                            value={editingKit.kitNumber}
                            onChange={(e) => setEditingKit(prev => prev ? { 
                              ...prev, 
                              kitNumber: parseInt(e.target.value) || 1 
                            } : null)}
                          />
                        ) : (
                          `#${kit.kitNumber}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingKit?.id === kit.id ? (
                          <Select 
                            value={editingKit.condition} 
                            onValueChange={(value: any) => setEditingKit(prev => prev ? { 
                              ...prev, 
                              condition: value 
                            } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(conditionLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={conditionColors[kit.condition]}>
                            {conditionLabels[kit.condition]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={currentStore.id} 
                          onValueChange={(newStoreId) => handleKitMove(kit, newStoreId)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map(store => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.shortName || store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {kit.lastUsed ? new Date(kit.lastUsed).toLocaleDateString('ja-JP') : '未使用'}
                      </TableCell>
                      <TableCell>
                        {editingKit?.id === kit.id ? (
                          <Textarea
                            value={editingKit.notes || ''}
                            onChange={(e) => setEditingKit(prev => prev ? { 
                              ...prev, 
                              notes: e.target.value 
                            } : null)}
                            className="min-h-12"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {kit.notes || '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingKit?.id === kit.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateKit(editingKit)}
                              >
                                保存
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingKit(null)}
                              >
                                キャンセル
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingKit(kit)}
                                title="編集"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHistoryKit(kit)}
                                title="編集履歴を表示"
                              >
                                <History className="w-4 h-4" />
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
                                    <AlertDialogTitle>キットを削除しますか？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      「{kit.scenarioTitle} #{kit.kitNumber}」を削除します。この操作は取り消せません。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteKit(kit.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      削除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                まだ公演キットが登録されていません。
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 編集履歴ダイアログ */}
    {historyKit && (
      <Dialog open={!!historyKit} onOpenChange={(open) => !open && setHistoryKit(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {historyKit.scenarioTitle} キット#{historyKit.kitNumber} - 編集履歴
            </DialogTitle>
            <DialogDescription>
              このキットの移動履歴と編集履歴を表示します
            </DialogDescription>
          </DialogHeader>
          <ItemEditHistory
            itemId={historyKit.id}
            itemName={`${historyKit.scenarioTitle} キット#${historyKit.kitNumber}`}
            category="inventory"
          />
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}