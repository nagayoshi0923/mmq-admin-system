import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowRightLeft, Package, Clock } from 'lucide-react';
import { Store as StoreType, PerformanceKit, KitTransferHistory } from '../contexts/StoreContext';
import { useStores } from '../contexts/StoreContext';

interface KitTransferDialogProps {
  fromStore?: StoreType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels = {
  'pending': '準備中',
  'in_transit': '移動中',
  'completed': '完了',
  'cancelled': 'キャンセル'
};

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'in_transit': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-gray-100 text-gray-800'
};

export function KitTransferDialog({ fromStore, open, onOpenChange }: KitTransferDialogProps) {
  const { stores, transferKit, kitTransferHistory, updateTransferStatus } = useStores();
  const [selectedFromStore, setSelectedFromStore] = useState<string>(fromStore?.id || '');
  const [selectedToStore, setSelectedToStore] = useState<string>('');
  const [selectedKit, setSelectedKit] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [transferredBy, setTransferredBy] = useState<string>('');

  const handleTransfer = () => {
    if (!selectedFromStore || !selectedToStore || !selectedKit || !reason || !transferredBy) {
      return;
    }

    transferKit({
      performanceKitId: selectedKit,
      fromStoreId: selectedFromStore,
      toStoreId: selectedToStore,
      transferDate: new Date().toISOString().split('T')[0],
      reason,
      status: 'pending',
      transferredBy
    });

    // フォームリセット
    if (!fromStore) {
      setSelectedFromStore('');
    }
    setSelectedToStore('');
    setSelectedKit('');
    setReason('');
    setTransferredBy('');
  };

  const handleStatusUpdate = (transferId: string, status: KitTransferHistory['status'], receivedBy?: string) => {
    updateTransferStatus(transferId, status, receivedBy);
  };

  const fromStoreData = stores.find(s => s.id === selectedFromStore);
  const availableKits = fromStoreData?.performanceKits || [];

  // 未完了の移動履歴を取得
  const pendingTransfers = kitTransferHistory.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            公演キット移動管理
          </DialogTitle>
          <DialogDescription>
            店舗間での公演キットの移動を管理します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 新規移動申請 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">新規移動申請</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>移動元店舗</Label>
                <Select 
                  value={selectedFromStore} 
                  onValueChange={setSelectedFromStore}
                  disabled={!!fromStore}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="移動元店舗を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>移動先店舗</Label>
                <Select value={selectedToStore} onValueChange={setSelectedToStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="移動先店舗を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.filter(s => s.id !== selectedFromStore).map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>移動するキット</Label>
                <Select value={selectedKit} onValueChange={setSelectedKit}>
                  <SelectTrigger>
                    <SelectValue placeholder="キットを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableKits.map(kit => (
                      <SelectItem key={kit.id} value={kit.id}>
                        {kit.scenarioTitle} #{kit.kitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>申請者</Label>
                <Input
                  value={transferredBy}
                  onChange={(e) => setTransferredBy(e.target.value)}
                  placeholder="申請者名を入力"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>移動理由</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="移動理由を入力してください"
                  className="min-h-20"
                />
              </div>

              <div className="col-span-2 flex justify-end">
                <Button 
                  onClick={handleTransfer}
                  disabled={!selectedFromStore || !selectedToStore || !selectedKit || !reason || !transferredBy}
                >
                  移動申請を作成
                </Button>
              </div>
            </div>
          </div>

          {/* 移動履歴・ステータス管理 */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">移動履歴・ステータス管理</h3>
            </div>

            {pendingTransfers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>キット</TableHead>
                    <TableHead>移動元</TableHead>
                    <TableHead>移動先</TableHead>
                    <TableHead>申請日</TableHead>
                    <TableHead>申請者</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((transfer) => {
                    const fromStore = stores.find(s => s.id === transfer.fromStoreId);
                    const toStore = stores.find(s => s.id === transfer.toStoreId);
                    const kit = fromStore?.performanceKits.find(k => k.id === transfer.performanceKitId);

                    return (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {kit?.scenarioTitle} #{kit?.kitNumber}
                          </div>
                        </TableCell>
                        <TableCell>{fromStore?.name}</TableCell>
                        <TableCell>{toStore?.name}</TableCell>
                        <TableCell>
                          {new Date(transfer.transferDate).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>{transfer.transferredBy}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[transfer.status]}>
                            {statusLabels[transfer.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {transfer.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(transfer.id, 'in_transit')}
                              >
                                発送
                              </Button>
                            )}
                            {transfer.status === 'in_transit' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const receivedBy = prompt('受取担当者名を入力してください：');
                                  if (receivedBy) {
                                    handleStatusUpdate(transfer.id, 'completed', receivedBy);
                                  }
                                }}
                              >
                                受取完了
                              </Button>
                            )}
                            {(transfer.status === 'pending' || transfer.status === 'in_transit') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(transfer.id, 'cancelled')}
                              >
                                キャンセル
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                現在進行中の移動はありません。
              </div>
            )}
          </div>

          {/* 完了済み移動履歴 */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="w-5 h-5" />
                完了済み移動履歴（直近10件）
              </h3>
            </div>

            {kitTransferHistory.filter(t => t.status === 'completed').length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>キット</TableHead>
                    <TableHead>移動元</TableHead>
                    <TableHead>移動先</TableHead>
                    <TableHead>完了日</TableHead>
                    <TableHead>申請者</TableHead>
                    <TableHead>受取者</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitTransferHistory
                    .filter(t => t.status === 'completed')
                    .slice(-10)
                    .reverse()
                    .map((transfer) => {
                      const fromStore = stores.find(s => s.id === transfer.fromStoreId);
                      const toStore = stores.find(s => s.id === transfer.toStoreId);
                      
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              移動済みキット
                            </div>
                          </TableCell>
                          <TableCell>{fromStore?.name}</TableCell>
                          <TableCell>{toStore?.name}</TableCell>
                          <TableCell>
                            {new Date(transfer.transferDate).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>{transfer.transferredBy}</TableCell>
                          <TableCell>{transfer.receivedBy}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                移動履歴がありません。
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}