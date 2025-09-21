import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { X, Plus, Trash2, Edit2, Check, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ItemEditHistory } from './ItemEditHistory';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { useStaff } from '../contexts/StaffContext';
import { Scenario } from '../contexts/ScenarioContext';

interface ScenarioDialogProps {
  scenario?: Scenario;
  onSave: (scenario: Scenario) => void;
  onDelete?: (scenarioId: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// GMリストはスタッフコンテキストから取得

const statusOptions = [
  { value: 'available', label: '公演中' },
  { value: 'maintenance', label: 'メンテナンス' },
  { value: 'retired', label: '公演終了' }
];

// 数値フォーマット用のヘルパー関数
const formatNumber = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  return Number(value).toLocaleString('ja-JP');
};

const parseNumber = (value: string): number => {
  return parseInt(value.replace(/,/g, '')) || 0;
};

// 道具の型定義
interface Prop {
  name: string;
  cost: number;
  costType: 'per_play' | 'one_time';
}

const ScenarioDialog = function ScenarioDialog({ scenario, onSave, onDelete, trigger, open: externalOpen, onOpenChange }: ScenarioDialogProps) {
  const { addEditEntry } = useEditHistory();
  const { staff } = useStaff();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [formData, setFormData] = useState<Scenario>({
    id: '',
    title: '',
    description: '',
    author: '',
    licenseAmount: 2500,
    duration: 240,
    playerCount: { min: 3, max: 6 },
    difficulty: 3 as 1 | 2 | 3 | 4 | 5,
    availableGMs: [],
    rating: 4.0,
    playCount: 0,
    status: 'available',
    requiredProps: [],
    props: [] as Prop[],
    genre: [],
    productionCost: 0,
    revenue: 0,
    gmFee: 0,
    miscellaneousExpenses: 0,
    licenseRateOverride: 0,
    hasPreReading: false,
    releaseDate: '',
    notes: '',
    participationFee: 0
  });

  const [newProp, setNewProp] = useState('');
  const [newPropCost, setNewPropCost] = useState('');
  const [newPropCostType, setNewPropCostType] = useState<'per_play' | 'one_time'>('per_play');
  const [newProductionCost, setNewProductionCost] = useState('');
  const [newProductionCostAmount, setNewProductionCostAmount] = useState('');
  const [newRevenue, setNewRevenue] = useState('');
  const [newRevenueAmount, setNewRevenueAmount] = useState('');
  const [productionCostItems, setProductionCostItems] = useState<{ name: string; cost: number }[]>([]);
  const [revenueItems, setRevenueItems] = useState<{ name: string; cost: number }[]>([]);
  const [editingProductionCostIndex, setEditingProductionCostIndex] = useState<number | null>(null);
  const [editingPropIndex, setEditingPropIndex] = useState<number | null>(null);
  const [editProductionCostName, setEditProductionCostName] = useState('');
  const [editProductionCostAmount, setEditProductionCostAmount] = useState('');
  const [editPropName, setEditPropName] = useState('');
  const [editPropCost, setEditPropCost] = useState('');
  const [editPropCostType, setEditPropCostType] = useState<'per_play' | 'one_time'>('per_play');
  const [newGenre, setNewGenre] = useState('');

  // GM可能なスタッフを取得（GMまたはマネージャーの役割を持つアクティブなスタッフ）
  const availableGMStaff = staff.filter(s => 
    s.status === 'active' && 
    (s.role.includes('GM') || s.role.includes('マネージャー'))
  );

  // フォームデータ更新のハンドラーをメモ化
  const updateFormData = useCallback((field: keyof Scenario, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 入力ハンドラーをメモ化
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData('title', e.target.value);
  }, [updateFormData]);

  const handleAuthorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData('author', e.target.value);
  }, [updateFormData]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData('description', e.target.value);
  }, [updateFormData]);

  const handleLicenseAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData('licenseAmount', parseInt(e.target.value) || 0);
  }, [updateFormData]);

  useEffect(() => {
    if (open) {
      if (scenario) {
        setFormData({
          ...scenario,
          availableGMs: scenario.availableGMs || [],
          notes: scenario.notes || '',
          licenseAmount: scenario.licenseAmount || 2500,
          playerCount: scenario.playerCount || { min: 3, max: 6 },
          requiredProps: scenario.requiredProps || [],
          props: scenario.props || [],
          genre: scenario.genre || [],
          productionCost: scenario.productionCost || 0,
          revenue: scenario.revenue || 0,
          gmFee: scenario.gmFee || 0,
          miscellaneousExpenses: scenario.miscellaneousExpenses || 0,
          licenseRateOverride: scenario.licenseRateOverride || 0,
          hasPreReading: scenario.hasPreReading || false,
          releaseDate: scenario.releaseDate || '',
          participationFee: scenario.participationFee || 0
        });
        // 制作費項目を復元（既存のシナリオの場合）
        const items = scenario.productionCostItems || [];
        setProductionCostItems(items);
        // 制作費を動的に計算
        const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
        setFormData(prev => ({
          ...prev,
          productionCost: totalCost
        }));
      } else {
        setFormData({
          id: Date.now().toString(),
          title: '',
          description: '',
          author: 'クインズワルツ',
          licenseAmount: 2500,
          duration: 240,
          playerCount: { min: 3, max: 6 },
          difficulty: 3 as 1 | 2 | 3 | 4 | 5,
          availableGMs: [],
          rating: 4.0,
          playCount: 0,
          status: 'available',
          requiredProps: [],
          props: [],
          genre: [],
          productionCost: 0,
          revenue: 0,
          gmFee: 0,
          miscellaneousExpenses: 0,
          licenseRateOverride: 0,
          hasPreReading: false,
          releaseDate: '',
          notes: '',
          participationFee: 0
        });
        // 制作費項目を初期化（新規シナリオの場合）
        setProductionCostItems([]);
        // 制作費を0に初期化
        setFormData(prev => ({
          ...prev,
          productionCost: 0
        }));
      }
    }
  }, [scenario, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 重要な変更がある場合は確認ダイアログを表示
    if (scenario) {
      const hasImportantChanges = 
        formData.title !== scenario.title ||
        formData.author !== scenario.author ||
        formData.licenseAmount !== scenario.licenseAmount ||
        formData.participationFee !== scenario.participationFee;
      
      if (hasImportantChanges && !window.confirm('重要な情報が変更されています。保存しますか？')) {
        return;
      }
    }
    
    console.log('シナリオ保存開始:', formData);
    
    // 編集履歴に追加
    const isNewScenario = !scenario;
    addEditEntry({
      user: 'ユーザー',
      action: isNewScenario ? 'create' : 'update',
      target: formData.title,
      summary: isNewScenario 
        ? `新規シナリオを追加：${formData.title}（${formData.duration}分・${formData.difficulty}段階）`
        : `シナリオを更新：${formData.title}`,
      category: 'scenario',
      changes: [
        { field: 'タイトル', newValue: formData.title },
        { field: '所要時間', newValue: `${formData.duration}分` },
        { field: '難易度', newValue: formData.difficulty.toString() },
        { field: 'ステータス', newValue: formData.status }
      ]
    });
    
    console.log('onSave呼び出し前:', formData);
    onSave({
      ...formData,
      productionCostItems: productionCostItems
    });
    console.log('onSave呼び出し後');
    setOpen(false);
  };

  const toggleGM = (gmName: string) => {
    setFormData(prev => ({
      ...prev,
      availableGMs: prev.availableGMs.includes(gmName)
        ? prev.availableGMs.filter(gm => gm !== gmName)
        : [...prev.availableGMs, gmName]
    }));
  };

  const addProp = () => {
    if (newProp.trim() && !formData.props.some(p => p.name === newProp.trim())) {
      setFormData(prev => ({
        ...prev,
        props: [...prev.props, { 
          name: newProp.trim(), 
          cost: parseNumber(newPropCost),
          costType: newPropCostType
        }]
      }));
      setNewProp('');
      setNewPropCost('');
      setNewPropCostType('per_play');
    }
  };

  const addProductionCost = () => {
    if (newProductionCost.trim() && newProductionCostAmount.trim()) {
      const cost = parseNumber(newProductionCostAmount);
      if (cost > 0) {
        const newItem = { name: newProductionCost.trim(), cost };
        setProductionCostItems(prev => {
          const updated = [...prev, newItem];
          // 制作費を動的に計算
          const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
          setFormData(prevForm => ({
            ...prevForm,
            productionCost: totalCost
          }));
          return updated;
        });
        setNewProductionCost('');
        setNewProductionCostAmount('');
      }
    }
  };

  const addRevenue = () => {
    if (newRevenue.trim() && newRevenueAmount.trim()) {
      const revenue = parseNumber(newRevenueAmount);
      if (revenue > 0) {
        const newItem = { name: newRevenue.trim(), cost: revenue };
        setRevenueItems(prev => [...prev, newItem]);
        setFormData(prev => ({
          ...prev,
          revenue: (prev.revenue || 0) + revenue
        }));
        setNewRevenue('');
        setNewRevenueAmount('');
      }
    }
  };

  const removeProductionCostItem = (index: number) => {
    setProductionCostItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // 制作費を動的に計算
      const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
      setFormData(prevForm => ({
        ...prevForm,
        productionCost: totalCost
      }));
      return updated;
    });
  };

  const removeRevenueItem = (index: number) => {
    const item = revenueItems[index];
    setRevenueItems(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      revenue: (prev.revenue || 0) - item.cost
    }));
  };

  const startEditProductionCost = (index: number) => {
    const item = productionCostItems[index];
    setEditingProductionCostIndex(index);
    setEditProductionCostName(item.name);
    setEditProductionCostAmount(item.cost.toString());
  };

  const saveEditProductionCost = () => {
    if (editingProductionCostIndex !== null && editProductionCostName.trim() && editProductionCostAmount.trim()) {
      const newCost = parseNumber(editProductionCostAmount);
      if (newCost > 0) {
        setProductionCostItems(prev => {
          const updated = prev.map((item, index) => 
            index === editingProductionCostIndex 
              ? { name: editProductionCostName.trim(), cost: newCost }
              : item
          );
          // 制作費を動的に計算
          const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
          setFormData(prevForm => ({
            ...prevForm,
            productionCost: totalCost
          }));
          return updated;
        });
        setEditingProductionCostIndex(null);
        setEditProductionCostName('');
        setEditProductionCostAmount('');
      }
    }
  };

  const cancelEditProductionCost = () => {
    setEditingProductionCostIndex(null);
    setEditProductionCostName('');
    setEditProductionCostAmount('');
  };

  const startEditProp = (index: number) => {
    const prop = formData.props[index];
    setEditingPropIndex(index);
    setEditPropName(prop.name);
    setEditPropCost(prop.cost.toString());
    setEditPropCostType(prop.costType);
  };

  const saveEditProp = () => {
    if (editingPropIndex !== null && editPropName.trim() && editPropCost.trim()) {
      const oldProp = formData.props[editingPropIndex];
      const newCost = parseNumber(editPropCost);
      if (newCost > 0) {
        setFormData(prev => ({
          ...prev,
          props: prev.props.map((prop, index) => 
            index === editingPropIndex 
              ? { name: editPropName.trim(), cost: newCost, costType: editPropCostType }
              : prop
          )
        }));
        setEditingPropIndex(null);
        setEditPropName('');
        setEditPropCost('');
        setEditPropCostType('per_play');
      }
    }
  };

  const cancelEditProp = () => {
    setEditingPropIndex(null);
    setEditPropName('');
    setEditPropCost('');
    setEditPropCostType('per_play');
  };

  const removeProp = (propName: string) => {
    setFormData(prev => ({
      ...prev,
      props: prev.props.filter(p => p.name !== propName)
    }));
  };

  const addGenre = () => {
    if (newGenre.trim() && !formData.genre.includes(newGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genre: [...prev.genre, newGenre.trim()]
      }));
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.filter(g => g !== genre)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario ? 'シナリオ編集' : '新しいシナリオ追加'}</DialogTitle>
          <DialogDescription>
            {scenario ? 'シナリオの詳細情報を編集できます。' : '新しいシナリオの情報を入力してください。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="preview">プレビュー</TabsTrigger>
            <TabsTrigger value="history" disabled={!scenario}>編集履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  作品名
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="例: 呪いの館の謎"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="author" className="text-sm font-medium">
                  作者名
                </Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={handleAuthorChange}
                  placeholder="例: 田中太郎"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="licenseAmount" className="text-sm font-medium">
                  ライセンス料
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.licenseRateOverride > 0 ? 'percentage' : 'fixed'}
                    onValueChange={(value) => {
                      if (value === 'percentage') {
                        updateFormData('licenseRateOverride', 10);
                        updateFormData('licenseAmount', 0);
                      } else {
                        updateFormData('licenseRateOverride', 0);
                        updateFormData('licenseAmount', 2500);
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">固定額</SelectItem>
                      <SelectItem value="percentage">％</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.licenseRateOverride > 0 ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.licenseRateOverride}
                      onChange={(e) => updateFormData('licenseRateOverride', parseFloat(e.target.value) || 0)}
                      placeholder="例: 10.0"
                      className="flex-1 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <Input
                      type="text"
                      value={formatNumber(formData.licenseAmount)}
                      onChange={(e) => {
                        const value = parseNumber(e.target.value);
                        updateFormData('licenseAmount', value);
                      }}
                      placeholder="例: 2,500"
                      className="flex-1 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  <span className="flex items-center text-sm text-gray-500">
                    {formData.licenseRateOverride > 0 ? '%' : '円'}
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="participationFee" className="text-sm font-medium">
                  参加費（円）
                </Label>
                <Input
                  id="participationFee"
                  type="text"
                  value={formatNumber(formData.participationFee || 0)}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    setFormData(prev => ({ ...prev, participationFee: value }));
                  }}
                  placeholder="例: 3,000"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="releaseDate" className="text-sm font-medium">
                  リリース日
                </Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    releaseDate: e.target.value 
                  }))}
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="duration" className="text-sm font-medium">
                  所要時間
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={formData.duration / 60}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) * 60 || 240 }))}
                    placeholder="例: 4"
                    className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="flex items-center text-sm text-gray-500">時間</span>
                </div>
              </div>
              <div>
                <Label htmlFor="minPlayers" className="text-sm font-medium">
                  最小参加人数
                </Label>
                <Input
                  id="minPlayers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.playerCount?.min || 3}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    playerCount: { 
                      min: parseInt(e.target.value) || 1, 
                      max: prev.playerCount?.max || 6 
                    }
                  }))}
                  placeholder="例: 3"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="maxPlayers" className="text-sm font-medium">
                  最大参加人数
                </Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.playerCount?.max || 6}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    playerCount: { 
                      min: prev.playerCount?.min || 3, 
                      max: parseInt(e.target.value) || 6 
                    }
                  }))}
                  placeholder="例: 6"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="gmFee" className="text-sm font-medium">
                  GM代
                </Label>
                <Input
                  id="gmFee"
                  type="text"
                  value={formatNumber(formData.gmFee || 0)}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    setFormData(prev => ({ ...prev, gmFee: value }));
                  }}
                  placeholder="例: 2,000"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                説明
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="シナリオの説明、あらすじ、特徴などを入力してください"
                rows={3}
                className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 収益情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">収益情報</h3>
            
            {/* 制作費 */}
            <div className="space-y-2">
              <h4 className="text-md font-medium text-gray-700">制作費</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="制作費項目名を入力"
                  value={newProductionCost}
                  onChange={(e) => setNewProductionCost(e.target.value)}
                  className="border border-slate-200"
                />
                <Input
                  placeholder="金額"
                  value={newProductionCostAmount}
                  onChange={(e) => setNewProductionCostAmount(e.target.value)}
                  className="border border-slate-200 w-40"
                />
                <Button type="button" onClick={addProductionCost}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {productionCostItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    {editingProductionCostIndex === index ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editProductionCostName}
                          onChange={(e) => setEditProductionCostName(e.target.value)}
                          className="border border-slate-200 text-xs h-6"
                          placeholder="項目名"
                        />
                        <Input
                          value={editProductionCostAmount}
                          onChange={(e) => setEditProductionCostAmount(e.target.value)}
                          className="border border-slate-200 text-xs h-6 w-36"
                          placeholder="金額"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveEditProductionCost}
                          className="h-6 px-2"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEditProductionCost}
                          className="h-6 px-2"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.name}
                          </Badge>
                          <span className="text-sm text-gray-600">{formatNumber(item.cost)}円</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditProductionCost(index)}
                            className="hover:bg-blue-100 rounded-full p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProductionCostItem(index)}
                            className="hover:bg-destructive/20 rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                現在の制作費: {formatNumber(formData.productionCost || 0)}円
              </div>
            </div>
          </div>

          {/* 運営情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">運営情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty" className="text-sm font-medium">
                  難易度
                </Label>
                <Select 
                  value={formData.difficulty.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))}
                >
                  <SelectTrigger className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - 初心者向け</SelectItem>
                    <SelectItem value="2">2 - 簡単</SelectItem>
                    <SelectItem value="3">3 - 普通</SelectItem>
                    <SelectItem value="4">4 - 難しい</SelectItem>
                    <SelectItem value="5">5 - 上級者向け</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  ステータス
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rating" className="text-sm font-medium">評価（1-5）</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.0 }))}
                  placeholder="例: 4.0"
                  className="border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 対応可能GM */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">対応可能GM</h3>
            <div className="grid grid-cols-3 gap-2">
              {availableGMStaff.map(staffMember => (
                <label key={staffMember.id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={formData.availableGMs.includes(staffMember.name)}
                    onCheckedChange={() => toggleGM(staffMember.name)}
                  />
                  <span className="text-sm">{staffMember.name}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(formData.availableGMs || []).map(gm => (
                <Badge key={gm} variant="secondary" className="flex items-center gap-1">
                  {gm}
                  <button
                    type="button"
                    onClick={() => toggleGM(gm)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              選択済み: {formData.availableGMs.length}名
            </p>
          </div>

          {/* 必要道具・準備物 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">必要道具・準備物</h3>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="道具名を入力"
                  value={newProp}
                  onChange={(e) => setNewProp(e.target.value)}
                  className="border border-slate-200 flex-1"
                />
                <Input
                  placeholder="金額"
                  value={newPropCost}
                  onChange={(e) => setNewPropCost(e.target.value)}
                  className="border border-slate-200 w-32"
                />
                <Select 
                  value={newPropCostType} 
                  onValueChange={(value: 'per_play' | 'one_time') => setNewPropCostType(value)}
                >
                  <SelectTrigger className="w-24 border border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_play">毎回</SelectItem>
                    <SelectItem value="one_time">1度きり</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addProp}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {(formData.props || []).map((prop, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  {editingPropIndex === index ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editPropName}
                        onChange={(e) => setEditPropName(e.target.value)}
                        className="border border-slate-200 text-xs h-6 flex-1"
                        placeholder="道具名"
                      />
                      <Input
                        value={editPropCost}
                        onChange={(e) => setEditPropCost(e.target.value)}
                        className="border border-slate-200 text-xs h-6 w-28"
                        placeholder="金額"
                      />
                      <Select value={editPropCostType} onValueChange={(value: 'per_play' | 'one_time') => setEditPropCostType(value)}>
                        <SelectTrigger className="w-20 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_play">毎回</SelectItem>
                          <SelectItem value="one_time">1度きり</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveEditProp}
                        className="h-6 px-2"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelEditProp}
                        className="h-6 px-2"
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{prop.name}</span>
                        <span className="text-sm text-gray-600">{formatNumber(prop.cost)}円</span>
                        <Badge variant={prop.costType === 'per_play' ? 'default' : 'secondary'} className="text-xs">
                          {prop.costType === 'per_play' ? '毎回' : '1度きり'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditProp(index)}
                          className="hover:bg-blue-100 rounded-full p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProp(prop.name)}
                          className="hover:bg-destructive/20 rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {formData.props.length > 0 && (
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  毎回コスト合計: {formatNumber(formData.props.filter(p => p.costType === 'per_play').reduce((sum, prop) => sum + prop.cost, 0))}円
                </div>
                <div>
                  1度きりコスト合計: {formatNumber(formData.props.filter(p => p.costType === 'one_time').reduce((sum, prop) => sum + prop.cost, 0))}円
                </div>
                <div className="font-medium">
                  総合計: {formatNumber(formData.props.reduce((sum, prop) => sum + prop.cost, 0))}円
                </div>
              </div>
            )}
          </div>

          {/* ジャンル */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">ジャンル</h3>
            <div className="flex gap-2">
              <Input
                placeholder="ジャンルを追加"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                className="border border-slate-200"
              />
              <Button type="button" onClick={addGenre}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.genre || []).map(genre => (
                <Badge key={genre} variant="outline" className="flex items-center gap-1">
                  {genre}
                  <button
                    type="button"
                    onClick={() => removeGenre(genre)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">備考</h3>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="GM向けの注意事項、特記事項などを入力してください"
                rows={3}
                className="border border-slate-200"
              />
            </div>
          </div>

              <div className="flex justify-between">
                <div>
                  {scenario && onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>シナリオを削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{scenario.title}」を削除します。この操作は元に戻せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              if (onDelete) {
                                await onDelete(scenario.id);
                              }
                              if (onOpenChange) {
                                onOpenChange(false);
                              } else {
                                setOpen(false);
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">
                    {scenario ? '更新' : '追加'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preview">
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">シナリオ情報プレビュー</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">基本情報</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">タイトル:</span> {formData.title || '未入力'}</p>
                      <p><span className="font-medium">作者:</span> {formData.author || '未入力'}</p>
                      <p><span className="font-medium">所要時間:</span> {formData.duration / 60}時間</p>
                      <p><span className="font-medium">難易度:</span> {formData.difficulty}/5</p>
                      <p><span className="font-medium">参加人数:</span> {formData.playerCount?.min}-{formData.playerCount?.max}人</p>
                      <p><span className="font-medium">ステータス:</span> {statusOptions.find(opt => opt.value === formData.status)?.label || '未設定'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">収益情報</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">ライセンス料:</span> {formatNumber(formData.licenseAmount)}円</p>
                      <p><span className="font-medium">参加費:</span> {formatNumber(formData.participationFee || 0)}円</p>
                      <p><span className="font-medium">制作費:</span> {formatNumber(formData.productionCost || 0)}円</p>
                      <p><span className="font-medium">GM代:</span> {formatNumber(formData.gmFee || 0)}円</p>
                      <p><span className="font-medium">雑費:</span> {formatNumber(formData.miscellaneousExpenses || 0)}円</p>
                    </div>
                  </div>
                </div>
                
                {formData.description && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">説明</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.description}</p>
                  </div>
                )}
                
                {formData.availableGMs.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">対応可能GM</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.availableGMs.map(gm => (
                        <Badge key={gm} variant="secondary">{gm}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.props.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">必要道具・準備物</h4>
                    <div className="space-y-1">
                      {formData.props.map((prop, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span>{prop.name}</span>
                            <Badge variant={prop.costType === 'per_play' ? 'default' : 'secondary'} className="text-xs">
                              {prop.costType === 'per_play' ? '毎回' : '1度きり'}
                            </Badge>
                          </div>
                          <span className="text-gray-600">{formatNumber(prop.cost)}円</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 space-y-1">
                        <div className="text-sm">
                          毎回コスト: {formatNumber(formData.props.filter(p => p.costType === 'per_play').reduce((sum, prop) => sum + prop.cost, 0))}円
                        </div>
                        <div className="text-sm">
                          1度きりコスト: {formatNumber(formData.props.filter(p => p.costType === 'one_time').reduce((sum, prop) => sum + prop.cost, 0))}円
                        </div>
                        <div className="font-medium">
                          総合計: {formatNumber(formData.props.reduce((sum, prop) => sum + prop.cost, 0))}円
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.genre.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">ジャンル</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.genre.map(genre => (
                        <Badge key={genre} variant="outline">{genre}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            {scenario && (
              <ItemEditHistory 
                itemId={scenario.id}
                itemName={scenario.title}
                category="scenario"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export { ScenarioDialog };