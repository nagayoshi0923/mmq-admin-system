import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

import { useSchedule, ScheduleEvent, EventCategory } from '../contexts/ScheduleContext';
import { useScenarios } from '../contexts/ScenarioContext';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { SupabaseSyncIndicator } from './SupabaseSyncIndicator';

const venues = ['馬場', '別館①', '別館②', '大久保', '大塚', '埼玉大宮'];
const availableGMs = ['りんな', 'マツケン', 'れいにー', 'ソラ', 'つばめ', '八継ジノ', 'りえぞー', 'キュウ', 'Remia', 'イワセモリシ', 'えりん', 'しらやま'];

interface FormData {
  date: string;
  venue: string;
  scenario: string;
  gms: string[];
  start_time: string;
  end_time: string;
  category: EventCategory;
  reservation_info: string;
  notes: string;
}

export function NewScheduleManager() {
  const { getAvailableScenarios } = useScenarios();
  const availableScenarios = getAvailableScenarios();
  const { addEditEntry } = useEditHistory();
  const { 
    events, 
    loading, 
    error,
    addEvent, 
    updateEvent, 
    deleteEvent,
    getEventsByMonth 
  } = useSchedule();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    date: '',
    venue: '',
    scenario: '',
    gms: [],
    start_time: '',
    end_time: '',
    category: 'オープン公演',
    reservation_info: '',
    notes: ''
  });

  // 月のイベントを取得
  const monthEvents = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return getEventsByMonth(year, month);
  }, [selectedMonth, getEventsByMonth]);

  // 新規イベント作成
  const handleCreateEvent = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    setFormData({
      date: dateStr,
      venue: venues[0],
      scenario: '',
      gms: [],
      start_time: '14:00',
      end_time: '18:00',
      category: 'オープン公演',
      reservation_info: '',
      notes: ''
    });
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  // イベント編集
  const handleEditEvent = (event: ScheduleEvent) => {
    setFormData({
      date: event.date,
      venue: event.venue,
      scenario: event.scenario,
      gms: event.gms,
      start_time: event.start_time,
      end_time: event.end_time,
      category: event.category,
      reservation_info: event.reservation_info || '',
      notes: event.notes || ''
    });
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  // イベント保存
  const handleSaveEvent = async () => {
    try {
      const eventData = {
        date: formData.date,
        venue: formData.venue,
        scenario: formData.scenario,
        gms: formData.gms,
        start_time: formData.start_time,
        end_time: formData.end_time,
        category: formData.category,
        reservation_info: formData.reservation_info || null,
        notes: formData.notes || null,
        is_cancelled: false
      };

      if (editingEvent) {
        // 更新
        await updateEvent(editingEvent.id, eventData);
        addEditEntry({
          user: 'システム',
          action: 'update',
          target: `${formData.date} ${formData.venue} - ${formData.scenario}`,
          summary: `公演情報を更新：${formData.scenario}`,
          category: 'schedule',
          changes: [
            { field: 'シナリオ', newValue: formData.scenario },
            { field: '開始時間', newValue: formData.start_time },
            { field: '担当GM', newValue: formData.gms.join(', ') }
          ]
        });
      } else {
        // 新規作成
        await addEvent(eventData);
        addEditEntry({
          user: 'システム',
          action: 'create',
          target: `${formData.date} ${formData.venue} - ${formData.scenario}`,
          summary: `新規公演を追加：${formData.scenario}（${formData.start_time}-${formData.end_time}）${formData.gms.join(', ')}`,
          category: 'schedule',
          changes: [
            { field: 'シナリオ', newValue: formData.scenario },
            { field: '開始時間', newValue: formData.start_time },
            { field: '担当GM', newValue: formData.gms.join(', ') }
          ]
        });
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('イベント保存エラー:', error);
    }
  };

  // イベント削除
  const handleDeleteEvent = async (event: ScheduleEvent) => {
    if (confirm(`${event.date} ${event.venue}の「${event.scenario}」を削除しますか？`)) {
      try {
        await deleteEvent(event.id);
        addEditEntry({
          user: 'システム',
          action: 'delete',
          target: `${event.date} ${event.venue} - ${event.scenario}`,
          summary: `公演を削除：${event.scenario}`,
          category: 'schedule',
          changes: []
        });
      } catch (error) {
        console.error('イベント削除エラー:', error);
      }
    }
  };

  // 月変更
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">スケジュールを読み込み中...</span>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-red-700 text-sm">エラー: {error}</p>
          </div>
        )}
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ページを再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          <h1 className="text-2xl font-bold">スケジュール管理</h1>
          <SupabaseSyncIndicator loading={loading} error={error} />
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="w-4 h-4 mr-2" />
          新規公演追加
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">エラー: {error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>{selectedMonth}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardTitle>
            <Badge variant="secondary">
              {monthEvents.length}件の公演
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>会場</TableHead>
                <TableHead>シナリオ</TableHead>
                <TableHead>GM</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    この月の公演はありません
                  </TableCell>
                </TableRow>
              ) : (
                monthEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell>{event.scenario}</TableCell>
                    <TableCell>{event.gms.join(', ')}</TableCell>
                    <TableCell>{event.start_time} - {event.end_time}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* イベント編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'イベント編集' : '新規イベント作成'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="venue">会場</Label>
              <Select value={formData.venue} onValueChange={(value) => setFormData(prev => ({ ...prev, venue: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(venue => (
                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scenario">シナリオ</Label>
              <Select value={formData.scenario} onValueChange={(value) => setFormData(prev => ({ ...prev, scenario: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="シナリオを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableScenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.title}>{scenario.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">カテゴリ</Label>
              <Select value={formData.category} onValueChange={(value: EventCategory) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="オープン公演">オープン公演</SelectItem>
                  <SelectItem value="貸切公演">貸切公演</SelectItem>
                  <SelectItem value="GMテスト">GMテスト</SelectItem>
                  <SelectItem value="テストプレイ">テストプレイ</SelectItem>
                  <SelectItem value="出張公演">出張公演</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_time">開始時間</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end_time">終了時間</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label>担当GM</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {availableGMs.map(gm => (
                  <label key={gm} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.gms.includes(gm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, gms: [...prev.gms, gm] }));
                        } else {
                          setFormData(prev => ({ ...prev, gms: prev.gms.filter(g => g !== gm) }));
                        }
                      }}
                    />
                    <span className="text-sm">{gm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="reservation_info">予約情報</Label>
              <Input
                id="reservation_info"
                value={formData.reservation_info}
                onChange={(e) => setFormData(prev => ({ ...prev, reservation_info: e.target.value }))}
                placeholder="予約に関する情報"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="備考・メモ"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEvent}>
              {editingEvent ? '更新' : '作成'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
