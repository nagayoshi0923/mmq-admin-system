import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { ItemEditHistory } from './ItemEditHistory';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  preferredGenres: string[];
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  status: 'vip' | 'active' | 'inactive';
  participantType: 'individual' | 'group' | 'corporate';
  notes?: string;
  joinDate: string;
}

interface CustomerDialogProps {
  customer?: Customer;
  onSave: (customer: Customer) => void;
  trigger: React.ReactNode;
}

const genreOptions = ['ホラー', 'ミステリー', 'SF', 'ファンタジー', 'コメディ', 'シリアス', 'RP重視', '推理重視'];
const statusOptions = ['vip', 'active', 'inactive'] as const;
const typeOptions = ['individual', 'group', 'corporate'] as const;

export function CustomerDialog({ customer, onSave, trigger }: CustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    email: '',
    phone: '',
    birthday: '',
    preferredGenres: [],
    totalVisits: 0,
    totalSpent: 0,
    lastVisit: '',
    status: 'active',
    participantType: 'individual',
    notes: '',
    joinDate: ''
  });

  const [isContactVisible, setIsContactVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    if (open) {
      if (customer) {
        setFormData(customer);
      } else {
        setFormData({
          id: Date.now().toString(),
          name: '',
          email: '',
          phone: '',
          birthday: '',
          preferredGenres: [],
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: '',
          status: 'active',
          participantType: 'individual',
          notes: '',
          joinDate: new Date().toISOString().split('T')[0]
        });
      }
      // ダイアログが開くたびにパスワード状態をリセット
      setIsContactVisible(false);
      setPasswordInput('');
      setShowPasswordInput(false);
    }
  }, [customer, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
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

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      preferredGenres: prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter(g => g !== genre)
        : [...prev.preferredGenres, genre]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? '顧客情報編集' : '新しい顧客追加'}</DialogTitle>
          <DialogDescription>
            {customer ? '顧客の詳細情報を編集できます。' : '新しい顧客の情報を入力してください。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="history" disabled={!customer}>編集履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3>基本情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">顧客名</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="joinDate">登録日</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">ステータス</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="active">アクティブ</SelectItem>
                        <SelectItem value="inactive">非アクティブ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="participantType">顧客タイプ</Label>
                    <Select value={formData.participantType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, participantType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">個人</SelectItem>
                        <SelectItem value="group">グループ</SelectItem>
                        <SelectItem value="corporate">法人</SelectItem>
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
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">電話番号</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    連絡先を表示するにはパスワードが必要です
                  </div>
                )}
              </div>

              {/* 来店情報 */}
              <div className="space-y-4">
                <h3>来店情報</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="totalVisits">総来店回数</Label>
                    <Input
                      id="totalVisits"
                      type="number"
                      min="0"
                      value={formData.totalVisits}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalVisits: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalSpent">総支払額</Label>
                    <Input
                      id="totalSpent"
                      type="number"
                      min="0"
                      value={formData.totalSpent}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalSpent: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastVisit">最終来店日</Label>
                    <Input
                      id="lastVisit"
                      type="date"
                      value={formData.lastVisit}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastVisit: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 好みのジャンル */}
              <div className="space-y-4">
                <h3>好みのジャンル</h3>
                <div className="grid grid-cols-2 gap-2">
                  {genreOptions.map(genre => (
                    <label key={genre} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferredGenres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                        className="rounded"
                      />
                      <span className="text-sm">{genre}</span>
                    </label>
                  ))}
                </div>
                {formData.preferredGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.preferredGenres.map(genre => (
                      <Badge key={genre} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
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
                  {customer ? '更新' : '追加'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history">
            {customer && (
              <ItemEditHistory 
                itemId={customer.id}
                itemName={customer.name}
                category="customer"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}