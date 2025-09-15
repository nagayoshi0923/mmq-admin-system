import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarIcon } from 'lucide-react';
import { ItemEditHistory } from './ItemEditHistory';

interface SalesRecord {
  id: string;
  date: string;
  venue: string;
  scenario: string;
  gm: string;
  participants: number;
  revenue: number;
  type: 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';
  notes?: string;
}

interface SalesDialogProps {
  salesRecord?: SalesRecord;
  onSave: (salesRecord: SalesRecord) => void;
  trigger: React.ReactNode;
}

const storeOptions = ['馬場', '別館①', '別館②', '大久保', '大塚', '埼玉大宮'];
const typeOptions = ['オープン公演', '貸切公演', 'GMテスト', 'テストプレイ', '出張公演'] as const;

export function SalesDialog({ salesRecord, onSave, trigger }: SalesDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<SalesRecord>({
    id: '',
    date: '',
    venue: '',
    scenario: '',
    gm: '',
    participants: 0,
    revenue: 0,
    type: 'オープン公演',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      if (salesRecord) {
        setFormData(salesRecord);
      } else {
        setFormData({
          id: Date.now().toString(),
          date: '',
          venue: '',
          scenario: '',
          gm: '',
          participants: 0,
          revenue: 0,
          type: 'オープン公演',
          notes: ''
        });
      }
    }
  }, [salesRecord, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{salesRecord ? '売上記録編集' : '新しい売上記録追加'}</DialogTitle>
          <DialogDescription>
            {salesRecord ? '売上記録の詳細情報を編集できます。' : '新しい売上記録の情報を入力してください。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="history" disabled={!salesRecord}>編集履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3>基本情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">開催日</Label>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                      <CalendarIcon className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="venue">店舗</Label>
                    <Select value={formData.venue} onValueChange={(value) => setFormData(prev => ({ ...prev, venue: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="店舗を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {storeOptions.map(store => (
                          <SelectItem key={store} value={store}>{store}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scenario">シナリオ</Label>
                    <Input
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => setFormData(prev => ({ ...prev, scenario: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gm">GM</Label>
                    <Input
                      id="gm"
                      value={formData.gm}
                      onChange={(e) => setFormData(prev => ({ ...prev, gm: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="participants">参加者数</Label>
                    <Input
                      id="participants"
                      type="number"
                      min="0"
                      value={formData.participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, participants: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue">売上金額</Label>
                    <Input
                      id="revenue"
                      type="number"
                      min="0"
                      value={formData.revenue}
                      onChange={(e) => setFormData(prev => ({ ...prev, revenue: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">公演タイプ</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  {salesRecord ? '更新' : '追加'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history">
            {salesRecord && (
              <ItemEditHistory 
                itemId={salesRecord.id}
                itemName={`${salesRecord.date} ${salesRecord.venue} ${salesRecord.scenario}`}
                category="sales"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}