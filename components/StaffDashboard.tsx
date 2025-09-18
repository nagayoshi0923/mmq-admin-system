import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2,
  User,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useStaff } from '../contexts/StaffContext';
import { useScenarios } from '../contexts/ScenarioContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';

dayjs.locale('ja');

interface StaffDashboardProps {
  staffId: string;
  staffName: string;
}

interface TimeSlot {
  id: string;
  label: string;
  time: string;
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  timeSlots: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

interface SalaryRecord {
  id: string;
  date: string;
  scenario: string;
  venue: string;
  hours: number;
  rate: number;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
}

interface StaffScenario {
  id: string;
  title: string;
  difficulty: number;
  learnedDate: string;
  status: 'learning' | 'mastered' | 'teaching';
  notes: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', label: '朝', time: '10:00-14:00' },
  { id: 'afternoon', label: '昼', time: '14:00-18:00' },
  { id: 'evening', label: '夜', time: '18:00-22:00' }
];


export function StaffDashboard({ staffId, staffName }: StaffDashboardProps) {
  const { staff, updateStaff } = useStaff();
  const { scenarios } = useScenarios();
  const { events } = useSchedule();
  
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  // 給与記録はSupabaseから取得
  const {
    data: salaryRecords,
    loading: salaryLoading
  } = useSupabaseData<any>({
    table: 'staff_attendance',
    realtime: true,
    orderBy: { column: 'date', ascending: false }
  });
  const [staffScenarios, setStaffScenarios] = useState<StaffScenario[]>([]);
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<StaffScenario | null>(null);
  const [newScenario, setNewScenario] = useState<StaffScenario>({
    id: '',
    title: '',
    difficulty: 1,
    learnedDate: dayjs().format('YYYY-MM-DD'),
    status: 'learning',
    notes: ''
  });

  // 現在のスタッフ情報を取得
  const currentStaff = useMemo(() => 
    staff.find(s => s.id === staffId) || staff.find(s => s.name === staffName),
    [staff, staffId, staffName]
  );

  // 今月のスケジュールを生成
  useEffect(() => {
    const generateMonthlySchedule = () => {
      const today = new Date();
      const startOfMonth = dayjs(today).startOf('month');
      const endOfMonth = dayjs(today).endOf('month');
      
      const monthlySchedule: DaySchedule[] = [];
      let currentDate = startOfMonth;
      
      while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth, 'day')) {
        monthlySchedule.push({
          date: currentDate.format('YYYY-MM-DD'),
          dayOfWeek: currentDate.format('ddd'),
          timeSlots: {
            morning: false,
            afternoon: false,
            evening: false
          }
        });
        currentDate = currentDate.add(1, 'day');
      }
      
      setSchedules(monthlySchedule);
    };

    generateMonthlySchedule();
    
    // 既存のスケジュールデータを読み込み
    const savedSchedule = localStorage.getItem(`staff-schedule-${staffId}`);
    if (savedSchedule) {
      try {
        const parsed = JSON.parse(savedSchedule);
        setSchedules(parsed.schedules || []);
      } catch (error) {
        console.error('スケジュールデータの読み込みに失敗:', error);
      }
    }

    // 給与記録はSupabaseから自動取得される

    // スタッフシナリオを読み込み
    const savedScenarios = localStorage.getItem(`staff-scenarios-${staffId}`);
    if (savedScenarios) {
      try {
        setStaffScenarios(JSON.parse(savedScenarios));
      } catch (error) {
        console.error('シナリオデータの読み込みに失敗:', error);
      }
    }
  }, [staffId]);

  // 今月のスケジュールイベントを取得
  const monthlyEvents = useMemo(() => {
    const currentMonth = dayjs().format('YYYY-MM');
    return events.filter(event => 
      dayjs(event.date).format('YYYY-MM') === currentMonth &&
      event.gms.includes(staffName)
    );
  }, [events, staffName]);

  // スタッフの給与記録をフィルタリング
  const staffSalaryRecords = useMemo(() => {
    if (!salaryRecords) return [];
    return salaryRecords.filter((record: any) => record.staff_id === staffId);
  }, [salaryRecords, staffId]);

  // 時間帯変更ハンドラー
  const handleTimeSlotChange = (dateIndex: number, timeSlot: keyof DaySchedule['timeSlots'], checked: boolean) => {
    setSchedules(prev => prev.map((schedule, index) => 
      index === dateIndex 
        ? { ...schedule, timeSlots: { ...schedule.timeSlots, [timeSlot]: checked } }
        : schedule
    ));
  };


  // スケジュール保存
  const handleSaveSchedule = () => {
    const scheduleData = {
      staffId,
      staffName,
      schedules,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`staff-schedule-${staffId}`, JSON.stringify(scheduleData));
    
    // スタッフ情報も更新
    if (currentStaff) {
      updateStaff({
        ...currentStaff,
        availability: schedules
          .filter(s => Object.values(s.timeSlots).some(Boolean))
          .map(s => s.date)
      });
    }
  };

  // シナリオ追加
  const handleAddScenario = () => {
    if (newScenario.title) {
      const scenario: StaffScenario = {
        id: Date.now().toString(),
        ...newScenario
      };
      setStaffScenarios(prev => [...prev, scenario]);
      localStorage.setItem(`staff-scenarios-${staffId}`, JSON.stringify([...staffScenarios, scenario]));
      setNewScenario({
        id: '',
        title: '',
        difficulty: 1,
        learnedDate: dayjs().format('YYYY-MM-DD'),
        status: 'learning',
        notes: ''
      });
      setIsScenarioDialogOpen(false);
    }
  };

  // シナリオ編集
  const handleEditScenario = (scenario: StaffScenario) => {
    setEditingScenario(scenario);
    setNewScenario({
      id: scenario.id,
      title: scenario.title,
      difficulty: scenario.difficulty,
      learnedDate: scenario.learnedDate,
      status: scenario.status,
      notes: scenario.notes
    });
    setIsScenarioDialogOpen(true);
  };

  // シナリオ更新
  const handleUpdateScenario = () => {
    if (editingScenario && newScenario.title) {
      const updatedScenarios = staffScenarios.map(s => 
        s.id === editingScenario.id ? { ...s, ...newScenario } : s
      );
      setStaffScenarios(updatedScenarios);
      localStorage.setItem(`staff-scenarios-${staffId}`, JSON.stringify(updatedScenarios));
      setEditingScenario(null);
      setNewScenario({
        id: '',
        title: '',
        difficulty: 1,
        learnedDate: dayjs().format('YYYY-MM-DD'),
        status: 'learning',
        notes: ''
      });
      setIsScenarioDialogOpen(false);
    }
  };

  // シナリオ削除
  const handleDeleteScenario = (scenarioId: string) => {
    const updatedScenarios = staffScenarios.filter(s => s.id !== scenarioId);
    setStaffScenarios(updatedScenarios);
    localStorage.setItem(`staff-scenarios-${staffId}`, JSON.stringify(updatedScenarios));
  };

  // 給与計算
  const totalEarnings = useMemo(() => {
    return staffSalaryRecords.reduce((total, record) => total + record.salary_amount, 0);
  }, [staffSalaryRecords]);

  const pendingEarnings = useMemo(() => {
    return staffSalaryRecords
      .filter(record => record.status === 'pending')
      .reduce((total, record) => total + record.salary_amount, 0);
  }, [staffSalaryRecords]);

  const paidEarnings = useMemo(() => {
    return staffSalaryRecords
      .filter(record => record.status === 'paid')
      .reduce((total, record) => total + record.salary_amount, 0);
  }, [staffSalaryRecords]);

  // 難易度ラベル
  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', '初心者', '簡単', '普通', '難しい', '上級者'];
    return labels[difficulty] || '不明';
  };

  // 難易度カラー
  const getDifficultyColor = (difficulty: number) => {
    const colors = ['', 'bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'];
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  // ステータスラベル
  const getStatusLabel = (status: string) => {
    const labels = {
      'learning': '学習中',
      'mastered': '習得済み',
      'teaching': '指導可能'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // ステータスカラー
  const getStatusColor = (status: string) => {
    const colors = {
      'learning': 'bg-yellow-100 text-yellow-800',
      'mastered': 'bg-green-100 text-green-800',
      'teaching': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!currentStaff) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            スタッフ情報が見つかりません
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <User className="w-6 h-6" />
          {staffName} のダッシュボード
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              スケジュール
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              給与管理
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              シナリオ管理
            </TabsTrigger>
          </TabsList>

          {/* スケジュールタブ */}
          <TabsContent value="schedule" className="space-y-6">
            {/* 今月のスケジュール一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  今月のスケジュール ({dayjs().format('YYYY年M月')})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthlyEvents.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 flex items-center gap-4">
                      <div className="min-w-[100px]">
                        <div className="text-sm font-medium">
                          {dayjs(event.date).format('M/D (ddd)')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.start_time} - {event.end_time}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.scenario}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.venue} | {event.category}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {event.gms.join(', ')}
                      </Badge>
                    </div>
                  ))}
                  {monthlyEvents.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      今月のスケジュールはありません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 出勤可能時間設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  出勤可能時間設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 時間帯設定 */}
                <div>
                  <h4 className="font-medium mb-3">出勤可能時間帯</h4>
                  <div className="space-y-2">
                    {schedules.map((schedule, index) => {
                      const isToday = schedule.date === dayjs().format('YYYY-MM-DD');
                      const isWeekend = schedule.dayOfWeek === '土' || schedule.dayOfWeek === '日';
                      
                      return (
                        <div 
                          key={schedule.date} 
                          className={`border rounded-lg p-3 flex items-center gap-4 ${
                            isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="min-w-[120px]">
                            <div className={`text-sm font-medium ${
                              isWeekend ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {dayjs(schedule.date).format('M/D (ddd)')}
                            </div>
                          </div>
                          
                          <div className="flex gap-6 flex-1">
                            {TIME_SLOTS.map(timeSlot => (
                              <div key={timeSlot.id} className="flex items-center space-x-2">
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
                                  <span className="font-medium">{timeSlot.label}</span>
                                  <span className="text-xs text-muted-foreground">{timeSlot.time}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={handleSaveSchedule} className="w-full">
                  スケジュールを保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 給与管理タブ */}
          <TabsContent value="salary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">総収入</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ¥{totalEarnings.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">支払済み</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{paidEarnings.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">未払い</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    ¥{pendingEarnings.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">今月の件数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monthlyEvents.length}件
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>給与記録</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>シナリオ</TableHead>
                    <TableHead>会場</TableHead>
                    <TableHead>役割</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffSalaryRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{dayjs(record.date).format('M/D')}</TableCell>
                        <TableCell>{record.scenario_title}</TableCell>
                        <TableCell>{record.venue}</TableCell>
                        <TableCell>{record.role}</TableCell>
                        <TableCell>¥{record.salary_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'paid' ? 'default' : 'secondary'}
                            className={record.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                     record.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                          >
                            {record.status === 'paid' ? '支払済み' : 
                             record.status === 'approved' ? '承認済み' : '未承認'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {staffSalaryRecords.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    給与記録がありません
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* シナリオ管理タブ */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="flex justify-between items-center">
              <CardTitle>習得シナリオ管理</CardTitle>
              <Button onClick={() => setIsScenarioDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                シナリオを追加
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffScenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditScenario(scenario)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScenario(scenario.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(scenario.difficulty)}>
                        {getDifficultyLabel(scenario.difficulty)}
                      </Badge>
                      <Badge className={getStatusColor(scenario.status)}>
                        {getStatusLabel(scenario.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      習得日: {dayjs(scenario.learnedDate).format('YYYY/M/D')}
                    </div>
                    {scenario.notes && (
                      <div className="text-sm">
                        {scenario.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {staffScenarios.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                習得シナリオがありません
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* シナリオ追加/編集ダイアログ */}
        <Dialog open={isScenarioDialogOpen} onOpenChange={setIsScenarioDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingScenario ? 'シナリオを編集' : 'シナリオを追加'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">シナリオ名</label>
                <Input
                  value={newScenario.title}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="シナリオ名を入力"
                />
              </div>
              <div>
                <label className="text-sm font-medium">難易度</label>
                <Select
                  value={newScenario.difficulty.toString()}
                  onValueChange={(value) => setNewScenario(prev => ({ ...prev, difficulty: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">初心者</SelectItem>
                    <SelectItem value="2">簡単</SelectItem>
                    <SelectItem value="3">普通</SelectItem>
                    <SelectItem value="4">難しい</SelectItem>
                    <SelectItem value="5">上級者</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">習得日</label>
                <Input
                  type="date"
                  value={newScenario.learnedDate}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, learnedDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ステータス</label>
                <Select
                  value={newScenario.status}
                  onValueChange={(value) => setNewScenario(prev => ({ ...prev, status: value as 'learning' | 'mastered' | 'teaching' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learning">学習中</SelectItem>
                    <SelectItem value="mastered">習得済み</SelectItem>
                    <SelectItem value="teaching">指導可能</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">メモ</label>
                <Textarea
                  value={newScenario.notes}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="メモを入力"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScenarioDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={editingScenario ? handleUpdateScenario : handleAddScenario}>
                {editingScenario ? '更新' : '追加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
