import React, { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { X, Plus, Eye, EyeOff } from 'lucide-react';
import { useScenarios } from '../contexts/ScenarioContext';
import { Staff } from '../contexts/StaffContext';
import { ItemEditHistory } from './ItemEditHistory';

interface StaffDialogProps {
  staff?: Staff;
  onSave: (staff: Staff) => void;
  trigger: React.ReactNode;
}

const storeOptions = ['全店舗', '馬場', '別館①', '別館②', '大久保', '大塚', '埼玉大宮'];
const roleOptions = ['GM', 'サポート', 'マネージャー', '社長', '企画', '事務'] as const;
const statusOptions = ['active', 'inactive', 'on-leave'] as const;

const StaffDialog = memo(function StaffDialog({ staff, onSave, trigger }: StaffDialogProps) {
  const { scenarios } = useScenarios();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Staff>({
    id: '',
    name: '',
    lineName: '',
    xAccount: '',
    role: ['GM'],
    stores: [],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: [],
    notes: '',
    contact: {
      phone: '',
      email: ''
    },
    availability: [],
    experience: 0,
    specialScenarios: [],
    status: 'active'
  });

  const [isContactVisible, setIsContactVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // フォームデータ更新のハンドラーをメモ化
  const updateFormData = useCallback((field: keyof Staff, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 入力ハンドラーをメモ化
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData('name', e.target.value);
  }, [updateFormData]);

  const handleXAccountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData('xAccount', e.target.value);
  }, [updateFormData]);

  useEffect(() => {
    if (open) {
      if (staff) {
        setFormData({
          ...staff,
          availableScenarios: staff.availableScenarios || [] // 安全なデフォルト値
        });
      } else {
        setFormData({
          id: Date.now().toString(),
          name: '',
          lineName: '',
          xAccount: '',
          role: ['GM'],
          stores: [],
          ngDays: [],
          wantToLearn: [],
          availableScenarios: [],
          notes: '',
          contact: {
            phone: '',
            email: ''
          },
          availability: [],
          experience: 0,
          specialScenarios: [],
          status: 'active'
        });
      }
      // ダイアログが開くたびにパスワード状態をリセット
      setIsContactVisible(false);
      setPasswordInput('');
      setShowPasswordInput(false);
    }
  }, [staff, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handlePasswordCheck = () => {
    if (passwordInput === '0909') {
      setIsContactVisible(true);
      setShowPasswordInput(false);
      setPasswordInput('');
    } else {
      alert('パスワードが間違っています');
      setPasswordInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? 'スタッフ情報編集' : '新しいスタッフ追加'}</DialogTitle>
          <DialogDescription>
            {staff ? 'スタッフの詳細情報を編集できます。' : '新しいスタッフの情報を入力してください。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="history" disabled={!staff}>編集履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3>基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="xAccount">Xアカウント</Label>
                <Input
                  id="xAccount"
                  value={formData.xAccount}
                  onChange={handleXAccountChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">役割</Label>
                <div className="space-y-2">
                  {roleOptions.map((roleOption) => (
                    <div key={roleOption} className="flex items-center space-x-2">
                      <Checkbox
                        id={roleOption}
                        checked={formData.role.includes(roleOption)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({ ...prev, role: [...prev.role, roleOption] }));
                          } else {
                            setFormData(prev => ({ ...prev, role: prev.role.filter(r => r !== roleOption) }));
                          }
                        }}
                      />
                      <Label htmlFor={roleOption}>{roleOption}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">勤務中</SelectItem>
                    <SelectItem value="inactive">休止中</SelectItem>
                    <SelectItem value="on-leave">休暇中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 連絡先（パスワード保護） */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3>連絡先</h3>
              {!isContactVisible && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                >
                  {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPasswordInput ? '隠す' : '表示'}
                </Button>
              )}
            </div>
            
            {showPasswordInput && !isContactVisible && (
              <div className="flex gap-2 p-4 bg-muted rounded-lg">
                <Input
                  type="password"
                  placeholder="パスワードを入力"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="max-w-48"
                />
                <Button type="button" onClick={handlePasswordCheck}>
                  確認
                </Button>
              </div>
            )}

            {isContactVisible ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                連絡先を表示するにはパスワードが必要です
              </div>
            )}
          </div>

          {/* 勤務情報 */}
          <div className="space-y-4">
            <h3>勤務情報</h3>
            
            <div>
              <Label>出勤店舗</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {storeOptions.map(store => (
                  <label key={store} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={formData.stores.includes(store)}
                      onCheckedChange={() => 
                        setFormData(prev => ({ 
                          ...prev, 
                          stores: toggleArrayItem(prev.stores, store)
                        }))
                      }
                    />
                    <span className="text-sm">{store}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 公演可能シナリオ */}
          {(formData.role.includes('GM') || formData.role.includes('マネージャー') || formData.role.includes('企画')) && (
            <div className="space-y-4">
              <h3>公演可能シナリオ</h3>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {scenarios.map(scenario => (
                  <div key={scenario.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`scenario-${scenario.id}`}
                      checked={formData.availableScenarios?.includes(scenario.title) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            availableScenarios: [...(prev.availableScenarios || []), scenario.title]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            availableScenarios: (prev.availableScenarios || []).filter(s => s !== scenario.title)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`scenario-${scenario.id}`} className="text-sm cursor-pointer">
                      {scenario.title}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                選択済み: {formData.availableScenarios?.length || 0}件
              </div>
              {formData.availableScenarios && formData.availableScenarios.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.availableScenarios.map(scenario => (
                    <Badge key={scenario} variant="outline" className="text-xs">
                      {scenario}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 備考 */}
          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="備考・特記事項があれば入力してください"
            />
          </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit">
                  {staff ? '更新' : '追加'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history">
            {staff && (
              <ItemEditHistory 
                itemId={staff.id}
                itemName={staff.name}
                category="staff"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

export { StaffDialog };