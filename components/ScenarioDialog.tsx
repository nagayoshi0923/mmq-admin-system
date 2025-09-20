import { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ItemEditHistory } from './ItemEditHistory';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { useStaff } from '../contexts/StaffContext';

interface Scenario {
  id: string;
  title: string;
  description: string;
  author: string;
  licenseAmount: number; // ライセンス料（円）
  duration: number;
  playerCount: { min: number; max: number };
  difficulty: number;
  availableGMs: string[]; // 対応可能GM
  rating: number;
  playCount: number;
  status: 'available' | 'maintenance' | 'retired';
  requiredProps: string[];
  genre: string[]; // 追加: ジャンル
  notes?: string;
}

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

const ScenarioDialog = memo(function ScenarioDialog({ scenario, onSave, onDelete, trigger, open: externalOpen, onOpenChange }: ScenarioDialogProps) {
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
    difficulty: 3,
    availableGMs: [],
    rating: 4.0,
    playCount: 0,
    status: 'available',
    requiredProps: [],
    genre: [],
    notes: ''
  });

  const [newProp, setNewProp] = useState('');
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
    if (scenario) {
      setFormData({
        ...scenario,
        availableGMs: scenario.availableGMs || [],
        notes: scenario.notes || '',
        licenseAmount: scenario.licenseAmount || 2500
      });
    } else {
      setFormData({
        id: Date.now().toString(),
        title: '',
        description: '',
        author: 'クインズワルツ',
        licenseAmount: 2500,
        duration: 240,
        playerCount: { min: 3, max: 6 },
        difficulty: 3,
        availableGMs: [],
        rating: 4.0,
        playCount: 0,
        status: 'available',
        requiredProps: [],
        genre: [],
        notes: ''
      });
    }
  }, [scenario, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    onSave(formData);
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
    if (newProp.trim() && !formData.requiredProps.includes(newProp.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredProps: [...prev.requiredProps, newProp.trim()]
      }));
      setNewProp('');
    }
  };

  const removeProp = (prop: string) => {
    setFormData(prev => ({
      ...prev,
      requiredProps: prev.requiredProps.filter(p => p !== prop)
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
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="history" disabled={!scenario}>編集履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3>基本情報</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title">作品名</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="タイトルを入力"
                  className="border border-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="author">作者名</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={handleAuthorChange}
                  className="border border-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="licenseAmount">ライセンス料（円）</Label>
                <Input
                  id="licenseAmount"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.licenseAmount}
                  onChange={handleLicenseAmountChange}
                  className="border border-slate-200"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="シナリオの説明、あらすじ、特徴などを入力してください"
                rows={3}
                className="border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">所要時間（分）</Label>
                <Input
                  id="duration"
                  type="number"
                  min="60"
                  max="720"
                  step="30"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 240 }))}
                  className="border border-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="difficulty">難易度（1-5）</Label>
                <Select 
                  value={formData.difficulty.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: parseInt(value) }))}
                >
                  <SelectTrigger className="border border-slate-200">
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
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="border border-slate-200">
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minPlayers">最小参加人数</Label>
                <Input
                  id="minPlayers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.playerCount.min}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    playerCount: { ...prev.playerCount, min: parseInt(e.target.value) || 1 }
                  }))}
                  className="border border-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxPlayers">最大参加人数</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.playerCount.max}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    playerCount: { ...prev.playerCount, max: parseInt(e.target.value) || 6 }
                  }))}
                  className="border border-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rating">評価（1-5）</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.0 }))}
                  className="border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 対応可能GM */}
          <div className="space-y-4">
            <h3>対応可能GM</h3>
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
              {formData.availableGMs.map(gm => (
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
            <h3>必要道具・準備物</h3>
            <div className="flex gap-2">
              <Input
                placeholder="必要な道具や準備物を追加"
                value={newProp}
                onChange={(e) => setNewProp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProp())}
                className="border border-slate-200"
              />
              <Button type="button" onClick={addProp}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requiredProps.map(prop => (
                <Badge key={prop} variant="outline" className="flex items-center gap-1">
                  {prop}
                  <button
                    type="button"
                    onClick={() => removeProp(prop)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* ジャンル */}
          <div className="space-y-4">
            <h3>ジャンル</h3>
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
              {formData.genre.map(genre => (
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
            <div>
              <Label htmlFor="notes">備考</Label>
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
});

export { ScenarioDialog };