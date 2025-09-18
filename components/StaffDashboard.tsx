import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useStaff } from '../contexts/StaffContext';
import { useScenarios } from '../contexts/ScenarioContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import dayjs from 'dayjs';

interface DaySchedule {
  date: string;
  timeSlots: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

interface StaffScenario {
  id: string;
  title: string;
  difficulty: string;
  notes: string;
}

interface StaffDashboardProps {
  staffId: string;
  staffName: string;
}

const timeSlots = [
  { id: 'morning', label: '朝公演', time: '10:00-12:00' },
  { id: 'afternoon', label: '昼公演', time: '14:30-16:30' },
  { id: 'evening', label: '夜公演', time: '19:00-21:00' }
];

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ staffId, staffName }) => {
  const { staff, updateStaff } = useStaff();
  const { scenarios } = useScenarios();
  const { events } = useSchedule();
  
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  // 給与記録はSupabaseから取得（現在は使用していないためコメントアウト）
  // const {
  //   data: salaryRecords,
  //   loading: salaryLoading
  // } = useSupabaseData<any>({
  //   table: 'staff_attendance',
  //   realtime: true,
  //   orderBy: { column: 'date', ascending: false }
  // });
  
  // スタッフの出勤可能時間データをSupabaseから取得
  const {
    data: availabilityData,
    insert: insertAvailability,
    update: updateAvailability,
    delete: deleteAvailability,
    upsert: upsertAvailability,
    loading: availabilityLoading
  } = useSupabaseData<any>({
    table: 'staff_availability',
    realtime: true,
    orderBy: { column: 'date', ascending: true }
  });

  const [newScenario, setNewScenario] = useState<Omit<StaffScenario, 'id'>>({
    title: '',
    difficulty: '',
    notes: ''
  });
  const [editingScenario, setEditingScenario] = useState<StaffScenario | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 現在のスタッフ情報を取得
  const currentStaff = staff.find(s => s.id === staffId);

  // 今月の日付を生成
  const generateCurrentMonthDates = useCallback(() => {
    const today = dayjs();
    const startOfMonth = today.startOf('month');
    const endOfMonth = today.endOf('month');
    const dates: DaySchedule[] = [];

    for (let date = startOfMonth; date.isBefore(endOfMonth) || date.isSame(endOfMonth, 'day'); date = date.add(1, 'day')) {
      dates.push({
        date: date.format('YYYY-MM-DD'),
        timeSlots: {
          morning: false,
          afternoon: false,
          evening: false
        }
      });
    }

    return dates;
  }, []);

  // 初期化
  useEffect(() => {
    const monthDates = generateCurrentMonthDates();
    setSchedules(monthDates);
  }, [generateCurrentMonthDates]);

  // 既存の出勤可能時間データを読み込み
  useEffect(() => {
    if (availabilityData && availabilityData.length > 0) {
      const staffAvailability = availabilityData.filter((item: any) => item.staff_id === staffId);
      
      if (staffAvailability.length > 0) {
        setSchedules(prev => prev.map(schedule => {
          const existingData = staffAvailability.find((item: any) => item.date === schedule.date);
          if (existingData) {
            return {
              ...schedule,
              timeSlots: {
                morning: existingData.morning,
                afternoon: existingData.afternoon,
                evening: existingData.evening
              }
            };
          }
          return schedule;
        }));
      }
    }
  }, [availabilityData, staffId]);

  // 今月の公演スケジュールを取得
  const currentMonthEvents = useMemo(() => {
    const currentMonth = dayjs().format('YYYY-MM');
    return events.filter(event => 
      dayjs(event.date).format('YYYY-MM') === currentMonth &&
      event.gms.includes(staffName)
    );
  }, [events, staffName]);

  // スタッフの給与記録をフィルタリング（現在は使用していないため空配列を返す）
  const staffSalaryRecords = useMemo(() => {
    // if (!salaryRecords) return [];
    // return salaryRecords.filter((record: any) => record.staff_id === staffId);
    return [];
  }, [staffId]);

  // 時間帯変更ハンドラー
  const handleTimeSlotChange = (dateIndex: number, timeSlot: keyof DaySchedule['timeSlots'], checked: boolean) => {
    setSchedules(prev => prev.map((schedule, index) => 
      index === dateIndex 
        ? { ...schedule, timeSlots: { ...schedule.timeSlots, [timeSlot]: checked } }
        : schedule
    ));
  };


  // スケジュール提出（パフォーマンス改善版）
  const handleSubmitSchedule = async () => {
    try {
      const currentMonth = dayjs().format('YYYY-MM');
      const submittedAt = new Date().toISOString();
      
      // 出勤可能時間が設定されている日のみをフィルタリング
      const recordsToUpsert = schedules
        .filter(schedule => Object.values(schedule.timeSlots).some(Boolean))
        .map(schedule => ({
          staff_id: staffId,
          staff_name: staffName,
          date: schedule.date,
          morning: schedule.timeSlots.morning,
          afternoon: schedule.timeSlots.afternoon,
          evening: schedule.timeSlots.evening,
          submitted_at: submittedAt
        }));

      // 既存の今月のデータを取得
      const existingData = availabilityData?.filter((item: any) => 
        dayjs(item.date).format('YYYY-MM') === currentMonth && item.staff_id === staffId
      ) || [];

      // 並列処理でパフォーマンスを向上
      const operations = [];

      // 1. 既存データの削除（並列実行）
      if (existingData.length > 0) {
        const deletePromises = existingData.map(item => deleteAvailability(item.id));
        operations.push(Promise.all(deletePromises));
      }

      // 2. 新しいデータのupsert（並列実行）
      if (recordsToUpsert.length > 0) {
        const upsertPromises = recordsToUpsert.map(record => upsertAvailability(record));
        operations.push(Promise.all(upsertPromises));
      }

      // 3. スタッフ情報の更新（並列実行）
      if (currentStaff) {
        const staffUpdatePromise = updateStaff({
          ...currentStaff,
          availability: recordsToUpsert.map(s => s.date)
        });
        operations.push(staffUpdatePromise);
      }

      // すべての操作を並列実行
      await Promise.all(operations);
      
      alert('スケジュールを提出しました！');
    } catch (error) {
      console.error('スケジュール提出エラー:', error);
      alert('スケジュールの提出に失敗しました。');
    }
  };

  // シナリオ追加
  const handleAddScenario = () => {
    if (newScenario.title) {
      const scenario: StaffScenario = {
        id: Date.now().toString(),
        ...newScenario
      };

      if (currentStaff) {
        const updatedStaff = {
          ...currentStaff,
          availableScenarios: [...(currentStaff.availableScenarios || []), scenario.title]
        };
        updateStaff(updatedStaff);
      }

      setNewScenario({ title: '', difficulty: '', notes: '' });
    }
  };

  // シナリオ編集開始
  const handleEditScenario = (scenario: StaffScenario) => {
    setEditingScenario(scenario);
    setIsEditing(true);
  };

  // シナリオ編集保存
  const handleSaveScenario = () => {
    if (editingScenario && currentStaff) {
      const updatedStaff = {
        ...currentStaff,
        availableScenarios: currentStaff.availableScenarios?.map(scenario => 
          scenario === editingScenario.title ? editingScenario.title : scenario
        ) || []
      };
      updateStaff(updatedStaff);
      setEditingScenario(null);
      setIsEditing(false);
    }
  };

  // シナリオ削除
  const handleDeleteScenario = (scenarioTitle: string) => {
    if (currentStaff) {
      const updatedStaff = {
        ...currentStaff,
        availableScenarios: currentStaff.availableScenarios?.filter(s => s !== scenarioTitle) || []
      };
      updateStaff(updatedStaff);
    }
  };

  // 利用可能なシナリオを取得
  const availableScenarios = scenarios.filter(scenario => 
    currentStaff?.availableScenarios?.includes(scenario.title)
  );

  // 今月の出勤可能日数を計算
  const availableDaysCount = schedules.filter(schedule => 
    Object.values(schedule.timeSlots).some(Boolean)
  ).length;

  // 今月の公演数を計算
  const eventCount = currentMonthEvents.length;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{staffName}のダッシュボード</h1>
          <p className="text-muted-foreground">
            {dayjs().format('YYYY年MM月')}のスケジュール管理
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">出勤可能日数</p>
            <p className="text-2xl font-bold text-green-600">{availableDaysCount}日</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">今月の公演数</p>
            <p className="text-2xl font-bold text-blue-600">{eventCount}回</p>
          </div>
        </div>
      </div>

      {/* スケジュール管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            出勤可能時間スケジュール
          </CardTitle>
          <CardDescription>
            今月の出勤可能時間を設定してください。チェックを入れた時間帯に出勤可能です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 時間帯ヘッダー */}
            <div className="grid grid-cols-4 gap-4">
              <div className="font-medium">日付</div>
              {timeSlots.map(timeSlot => (
                <div key={timeSlot.id} className="text-center">
                  <div className="font-medium">{timeSlot.label}</div>
                  <div className="text-sm text-muted-foreground">{timeSlot.time}</div>
                </div>
              ))}
            </div>

            {/* スケジュールテーブル */}
            <div className="space-y-2">
              {schedules.map((schedule, index) => (
                <div key={schedule.date} className="grid grid-cols-4 gap-4 items-center p-3 border rounded-lg">
                  <div className="font-medium">
                    {dayjs(schedule.date).format('MM/DD (ddd)')}
                  </div>
                  {timeSlots.map(timeSlot => (
                    <div key={timeSlot.id} className="flex items-center justify-center">
                      <Checkbox
                        id={`${schedule.date}-${timeSlot.id}`}
                        checked={schedule.timeSlots[timeSlot.id as keyof typeof schedule.timeSlots]}
                        onCheckedChange={(checked) => 
                          handleTimeSlotChange(index, timeSlot.id as keyof DaySchedule['timeSlots'], checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`${schedule.date}-${timeSlot.id}`}
                        className="text-sm cursor-pointer flex flex-col"
                      >
                        <span className="ml-2">{timeSlot.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 提出ボタン */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSubmitSchedule}
                disabled={availabilityLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                スケジュールを提出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 今月の公演スケジュール */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            今月の公演スケジュール
          </CardTitle>
          <CardDescription>
            {staffName}が担当する今月の公演一覧です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentMonthEvents.length > 0 ? (
            <div className="space-y-2">
              {currentMonthEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{event.scenario}</div>
                    <div className="text-sm text-muted-foreground">
                      {dayjs(event.date).format('MM/DD (ddd)')} {event.startTime} - {event.endTime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.venue} | {event.category}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {event.is_cancelled ? (
                      <span className="text-red-600 text-sm">キャンセル</span>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              今月の公演はありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* 利用可能シナリオ管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            利用可能シナリオ
          </CardTitle>
          <CardDescription>
            {staffName}が担当可能なシナリオの一覧です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* シナリオ追加フォーム */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="シナリオタイトル"
                value={newScenario.title}
                onChange={(e) => setNewScenario(prev => ({ ...prev, title: e.target.value }))}
                className="flex-1"
              />
              <Select
                value={newScenario.difficulty}
                onValueChange={(value) => setNewScenario(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="難易度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">簡単</SelectItem>
                  <SelectItem value="medium">普通</SelectItem>
                  <SelectItem value="hard">難しい</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddScenario} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>

            {/* シナリオ一覧 */}
            <div className="space-y-2">
              {availableScenarios.map((scenario, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{scenario.title}</div>
                    <div className="text-sm text-muted-foreground">
                      難易度: {scenario.difficulty} | プレイ人数: {scenario.playerCount.min}-{scenario.playerCount.max}人 | 所要時間: {scenario.duration}分
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditScenario(scenario)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteScenario(scenario.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {availableScenarios.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                利用可能なシナリオがありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>シナリオ編集</DialogTitle>
          </DialogHeader>
          {editingScenario && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">シナリオタイトル</label>
                <Input
                  value={editingScenario.title}
                  onChange={(e) => setEditingScenario(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                />
              </div>
              <div>
                <label className="text-sm font-medium">難易度</label>
                <Select
                  value={editingScenario.difficulty}
                  onValueChange={(value) => setEditingScenario(prev => 
                    prev ? { ...prev, difficulty: value } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">簡単</SelectItem>
                    <SelectItem value="medium">普通</SelectItem>
                    <SelectItem value="hard">難しい</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">メモ</label>
                <Textarea
                  value={editingScenario.notes}
                  onChange={(e) => setEditingScenario(prev => 
                    prev ? { ...prev, notes: e.target.value } : null
                  )}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
            <Button onClick={handleSaveScenario}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};