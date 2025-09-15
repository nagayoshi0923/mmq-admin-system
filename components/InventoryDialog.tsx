import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ItemEditHistory } from './ItemEditHistory';

interface InventoryItem {
  id: string;
  name: string;
  category: '小道具' | '衣装' | '装飾' | '電子機器' | '文書・カード' | '消耗品' | 'その他';
  quantity: number;
  minStock: number;
  currentLocation: string;
  status: 'available' | 'in-use' | 'maintenance' | 'lost' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  lastUsed?: string;
  usedInScenarios: string[];
  notes?: string;
}

interface InventoryDialogProps {
  inventoryItem?: InventoryItem;
  onSave: (inventoryItem: InventoryItem) => void;
  trigger: React.ReactNode;
}

const categoryOptions = ['小道具', '衣装', '装飾', '電子機器', '文書・カード', '消耗品', 'その他'] as const;
const statusOptions = ['available', 'in-use', 'maintenance', 'lost', 'retired'] as const;
const conditionOptions = ['excellent', 'good', 'fair', 'poor'] as const;
const locationOptions = ['馬場', '別館①', '別館②', '大久保', '大塚', '埼玉大宮', '倉庫', 'その他'];

export function InventoryDialog({ inventoryItem, onSave, trigger }: InventoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<InventoryItem>({
    id: '',
    name: '',
    category: '小道具',
    quantity: 1,
    minStock: 1,
    currentLocation: '',
    status: 'available',
    condition: 'excellent',
    purchaseDate: '',
    purchasePrice: 0,
    supplier: '',
    lastUsed: '',
    usedInScenarios: [],
    notes: ''
  });

  const [newScenario, setNewScenario] = useState('');

  useEffect(() => {
    if (open) {
      if (inventoryItem) {
        setFormData({
          ...inventoryItem,
          usedInScenarios: inventoryItem.usedInScenarios || []
        });
      } else {
        setFormData({
          id: Date.now().toString(),
          name: '',
          category: '小道具',
          quantity: 1,
          minStock: 1,
          currentLocation: '',
          status: 'available',
          condition: 'excellent',
          purchaseDate: '',
          purchasePrice: 0,
          supplier: '',
          lastUsed: '',
          usedInScenarios: [],
          notes: ''
        });
      }
    }
  }, [inventoryItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  const addScenario = () => {
    if (newScenario.trim() && !formData.usedInScenarios.includes(newScenario.trim())) {
      setFormData(prev => ({
        ...prev,
        usedInScenarios: [...prev.usedInScenarios, newScenario.trim()]
      }));
      setNewScenario('');
    }
  };

  const removeScenario = (scenario: string) => {
    setFormData(prev => ({
      ...prev,
      usedInScenarios: prev.usedInScenarios.filter(s => s !== scenario)
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return '利用可能';
      case 'in-use': return '使用中';
      case 'maintenance': return 'メンテナンス';
      case 'lost': return '紛失';
      case 'retired': return '退役';
      default: return status;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'excellent': return '極上';
      case 'good': return '良好';
      case 'fair': return '普通';
      case 'poor': return '悪い';
      default: return condition;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inventoryItem ? '在庫アイテム編集' : '新しいアイテム追加'}</DialogTitle>
          <DialogDescription>
            {inventoryItem ? 'アイテムの詳細情報を編集できます。' : '新しいアイテムの情報を入力してください。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="history" disabled={!inventoryItem}>編集履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3>基本情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">アイテム名</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">カテゴリ</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">現在数量</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">最小在庫数</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentLocation">現在の場所</Label>
                    <Select value={formData.currentLocation} onValueChange={(value) => setFormData(prev => ({ ...prev, currentLocation: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="場所を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">状態</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="condition">コンディション</Label>
                    <Select value={formData.condition} onValueChange={(value: any) => setFormData(prev => ({ ...prev, condition: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map(condition => (
                          <SelectItem key={condition} value={condition}>{getConditionLabel(condition)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 購入情報 */}
              <div className="space-y-4">
                <h3>購入情報</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">購入日</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchasePrice">購入価格</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      min="0"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">購入先</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 使用履歴 */}
              <div className="space-y-4">
                <h3>使用履歴</h3>
                <div>
                  <Label htmlFor="lastUsed">最終使用日</Label>
                  <Input
                    id="lastUsed"
                    type="date"
                    value={formData.lastUsed}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastUsed: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>使用シナリオ</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="シナリオ名を入力"
                      value={newScenario}
                      onChange={(e) => setNewScenario(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addScenario())}
                    />
                    <Button type="button" onClick={addScenario} variant="outline">
                      追加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.usedInScenarios.map(scenario => (
                      <Badge key={scenario} variant="outline" className="flex items-center gap-1">
                        {scenario}
                        <button
                          type="button"
                          onClick={() => removeScenario(scenario)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 備考 */}
              <div>
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="特記事項があれば入力してください"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit">
                  {inventoryItem ? '更新' : '追加'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history">
            {inventoryItem && (
              <ItemEditHistory 
                itemId={inventoryItem.id}
                itemName={inventoryItem.name}
                category="inventory"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}