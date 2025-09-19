import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Store as StoreType } from '../contexts/StoreContext';
import { useStores } from '../contexts/StoreContext';
import { useEditHistory } from '../contexts/EditHistoryContext';

interface StoreDialogProps {
  store?: StoreType;
  onSave: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StoreDialog({ store, onSave, trigger, open, onOpenChange }: StoreDialogProps) {
  const { addStore, updateStore } = useStores();
  const { addEditEntry } = useEditHistory();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<StoreType>>({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    openingDate: '',
    managerName: '',
    status: 'active',
    capacity: 10,
    rooms: 1,
    notes: '',
    performanceKits: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 編集モードの場合、既存データで初期化
  useEffect(() => {
    if (store) {
      setFormData(store);
    } else {
      setFormData({
        name: '',
        address: '',
        phoneNumber: '',
        email: '',
        openingDate: '',
        managerName: '',
        status: 'active',
        capacity: 10,
        rooms: 1,
        notes: '',
        performanceKits: []
      });
    }
  }, [store]);

  // 外部からの open 制御
  useEffect(() => {
    if (typeof open !== 'undefined') {
      setIsOpen(open);
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '店舗名は必須です';
    }

    if (!formData.address?.trim()) {
      newErrors.address = '住所は必須です';
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = '電話番号は必須です';
    } else if (!/^[\d\-\(\)\+\s]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '有効な電話番号を入力してください';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.openingDate?.trim()) {
      newErrors.openingDate = '開始時期は必須です';
    }

    if (!formData.managerName?.trim()) {
      newErrors.managerName = '管理者名は必須です';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = '収容人数は1以上で入力してください';
    }

    if (!formData.rooms || formData.rooms < 1) {
      newErrors.rooms = '部屋数は1以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const storeData: StoreType = {
      id: store?.id || `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name!,
      address: formData.address!,
      phoneNumber: formData.phoneNumber!,
      email: formData.email!,
      openingDate: formData.openingDate!,
      managerName: formData.managerName!,
      status: formData.status!,
      capacity: formData.capacity!,
      rooms: formData.rooms!,
      notes: formData.notes || '',
      performanceKits: formData.performanceKits || [],
      color: '#3B82F6', // デフォルト色
      shortName: formData.name!.substring(0, 2) // 名前の最初の2文字
    };

    if (store) {
      // 更新
      updateStore(storeData);
      addEditEntry({
        user: 'ユーザー',
        action: 'update',
        target: `${storeData.name} - 店舗情報更新`,
        summary: `店舗情報を更新：${storeData.name}`,
        category: 'store',
        changes: [
          { field: '店舗名', newValue: storeData.name },
          { field: '住所', newValue: storeData.address },
          { field: '管理者', newValue: storeData.managerName }
        ]
      });
    } else {
      // 新規追加
      addStore(storeData);
      addEditEntry({
        user: 'ユーザー',
        action: 'create',
        target: `${storeData.name} - 新規店舗`,
        summary: `新規店舗を追加：${storeData.name}（${storeData.address}）`,
        category: 'store',
        changes: [
          { field: '店舗名', newValue: storeData.name },
          { field: '住所', newValue: storeData.address },
          { field: '開始時期', newValue: storeData.openingDate },
          { field: '管理者', newValue: storeData.managerName }
        ]
      });
    }

    // フォームをリセット
    setFormData({
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      openingDate: '',
      managerName: '',
      status: 'active',
      capacity: 10,
      rooms: 1,
      notes: '',
      performanceKits: []
    });
    setErrors({});

    // ダイアログを閉じる
    setIsOpen(false);
    onOpenChange?.(false);
    onSave();
  };

  const handleCancel = () => {
    setErrors({});
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const content = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {store ? '店舗情報を編集' : '新しい店舗を追加'}
        </DialogTitle>
        <DialogDescription>
          店舗の基本情報を入力してください。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">店舗名 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="店舗名を入力"
              className="border border-slate-200"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="managerName">管理者名 *</Label>
            <Input
              id="managerName"
              value={formData.managerName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
              placeholder="管理者名を入力"
              className="border border-slate-200"
            />
            {errors.managerName && <p className="text-sm text-destructive">{errors.managerName}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">住所 *</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="住所を入力"
            className="border border-slate-200"
          />
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">電話番号 *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="電話番号を入力"
              className="border border-slate-200"
            />
            {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="メールアドレスを入力"
              className="border border-slate-200"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openingDate">開始時期 *</Label>
            <Input
              id="openingDate"
              type="date"
              value={formData.openingDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, openingDate: e.target.value }))}
              className="border border-slate-200"
            />
            {errors.openingDate && <p className="text-sm text-destructive">{errors.openingDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="border border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">営業中</SelectItem>
                <SelectItem value="temporarily_closed">一時休業</SelectItem>
                <SelectItem value="closed">閉店</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">収容人数 *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
              placeholder="収容人数"
              className="border border-slate-200"
            />
            {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rooms">部屋数 *</Label>
          <Input
            id="rooms"
            type="number"
            min="1"
            value={formData.rooms || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 0 }))}
            placeholder="部屋数"
            className="border border-slate-200"
          />
          {errors.rooms && <p className="text-sm text-destructive">{errors.rooms}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">備考</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="備考やメモを入力"
            className="min-h-20 border border-slate-200"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            {store ? '更新' : '追加'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    }}>
      {content}
    </Dialog>
  );
}