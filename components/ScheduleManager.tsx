import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Plus, Edit, AlertTriangle, X, Trash2, Users, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import { ItemEditHistory } from './ItemEditHistory';
import { useEditHistory, EditHistoryEntry } from '../contexts/EditHistoryContext';

import { useScenarios } from '../contexts/ScenarioContext';

type EventCategory = 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';

interface ScheduleEvent {
  id: string;
  date: string;
  venue: string;
  scenario: string;
  gms: string[];
  startTime: string;
  endTime: string;
  category: EventCategory;
  reservationInfo?: string;
  notes?: string;
  isCancelled?: boolean;
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  isHoliday: boolean;
  events: ScheduleEvent[];
}

interface Scenario {
  id: string;
  title: string;
  duration: number;
}

// 予約データの型定義
interface StoresReservation {
  '予約番号': string;
  'タイトル': string;
  '希望の予約日時': string;
  '人数': number;
  'ステータス': string;
  '予約者の氏名': string;
  'メールアドレス': string;
  '電話番号': string;
  '金額': number;
  '予約金額': number;
  'キャンセル日時': string;
}

// モックの予約データ
const mockReservations: StoresReservation[] = [
  {
    '予約番号': '50721258',
    'タイトル': '【高田馬場店】ゲームマスター殺人事件（GM：りんな）',
    '希望の予約日時': '2025-09-04T14:00:00Z',
    '人数': 1,
    'ステータス': 'confirmed',
    '予約者の氏名': '村上 統治',
    'メールアドレス': 'the_ghostaddress@yahoo.co.jp',
    '電話番号': '9076238027',
    '金額': 4000,
    '予約金額': 4000,
    'キャンセル日時': ''
  },
  {
    '予約番号': '50721259',
    'タイトル': '【高田馬場店】ゲームマスター殺人事件（GM：りんな）',
    '希望の予約日時': '2025-09-04T14:00:00Z',
    '人数': 2,
    'ステータス': 'confirmed',
    '予約者の氏名': '佐藤 美香',
    'メールアドレス': 'sato.mika@example.com',
    '電話番号': '9012345678',
    '金額': 8000,
    '予約金額': 8000,
    'キャンセル日時': ''
  }
];

// 予約人数を計算するユーティリティ関数
const getReservationCount = (event: ScheduleEvent): number => {
  const [month, day] = event.date.split('/');
  const eventDate = `2025-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  const venueMapping: { [key: string]: string[] } = {
    '馬場': ['高田馬場店', '馬場'],
    '別館①': ['別館①', '別館1'],
    '別館②': ['別館②', '別館2'],
    '大久保': ['大久保店', '大久保'],
    '大塚': ['大塚店', '大塚'],
    '埼玉大宮': ['埼玉大宮店', '大宮店', '埼玉大宮']
  };
  
  const relatedReservations = mockReservations.filter(reservation => {
    if (reservation.ステータス === 'cancelled') return false;
    if (!reservation['希望の予約日時'].startsWith(eventDate)) return false;
    
    const reservationHour = new Date(reservation['希望の予約���時']).getHours();
    const eventHour = parseInt(event.startTime.split(':')[0]);
    
    if (Math.abs(reservationHour - eventHour) > 2) return false;
    
    const reservationTitle = reservation.タイトル.toLowerCase();
    const eventVenueMappings = venueMapping[event.venue] || [event.venue];
    const venueMatches = eventVenueMappings.some(venueName => 
      reservationTitle.includes(venueName.toLowerCase())
    );
    
    return venueMatches;
  });
  
  return relatedReservations.reduce((total, reservation) => total + reservation.人数, 0);
};

// 公演カテゴリ一覧
const eventCategories: EventCategory[] = ['オープン公演', '貸切公演', 'GMテスト', 'テストプレイ', '出張公演'];

// カテゴリごとの色設定
const categoryColors = {
  'オープン公演': 'bg-blue-50 border-blue-200 text-blue-800',
  '貸切公演': 'bg-purple-50 border-purple-200 text-purple-800',
  'GMテスト': 'bg-orange-50 border-orange-200 text-orange-800',
  'テストプレイ': 'bg-yellow-50 border-yellow-200 text-yellow-800',
  '出張公演': 'bg-green-50 border-green-200 text-green-800'
};

// カテゴリごとのバッジ色
const categoryBadgeColors = {
  'オープン公演': 'bg-blue-100 text-blue-800',
  '貸切公演': 'bg-purple-100 text-purple-800',
  'GMテスト': 'bg-orange-100 text-orange-800',
  'テストプレイ': 'bg-yellow-100 text-yellow-800',
  '出張公演': 'bg-green-100 text-green-800'
};

// 時間を分に変換
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 分を時間に変換
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// 開始時間にシナリオの時間を足した終了時間を計算
const calculateEndTime = (startTime: string, scenarioId: string, scenarios: any[]): string => {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario || !startTime) return startTime;
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + scenario.duration;
  return minutesToTime(endMinutes);
};

// 標準終了時間と異なるかチェック
const isEndTimeModified = (startTime: string, endTime: string, scenarioTitle: string, scenarios: any[]): boolean => {
  if (!startTime || !endTime || !scenarioTitle || scenarioTitle === '未定') return false;
  
  const scenario = scenarios.find(s => s.title === scenarioTitle);
  if (!scenario) return false;
  
  const expectedEndTime = calculateEndTime(startTime, scenario.id, scenarios);
  return expectedEndTime !== endTime;
};

// カレンダー生成のユーティリティ関数
const generateCalendarData = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 2019;
  const endYear = currentYear >= 2026 ? currentYear + 4 : 2030;
  
  const calendarData: { [key: string]: DaySchedule[] } = {};
  
  // 日本の祝日判定（簡易版）
  const isHoliday = (date: Date): boolean => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    
    // 固定祝日
    const fixedHolidays = [
      { month: 1, day: 1 }, // 元日
      { month: 2, day: 11 }, // 建国記念の日
      { month: 2, day: 23 }, // 天皇誕生日
      { month: 4, day: 29 }, // 昭和の日
      { month: 5, day: 3 }, // 憲法記念日
      { month: 5, day: 4 }, // みどりの日
      { month: 5, day: 5 }, // こどもの日
      { month: 8, day: 11 }, // 山の日
      { month: 11, day: 3 }, // 文化の日
      { month: 11, day: 23 }, // 勤労感謝の日
      { month: 12, day: 23 } // 天皇誕生日（2019年以降）
    ];
    
    // 固定祝日チェック
    if (fixedHolidays.some(h => h.month === month && h.day === day)) {
      return true;
    }
    
    // 移動祝日（簡易版）
    if (month === 1 && dayOfWeek === 1 && day >= 8 && day <= 14) return true; // 成人の日
    if (month === 3 && dayOfWeek === 1 && day >= 15 && day <= 21) return true; // 春分の日（近似）
    if (month === 7 && dayOfWeek === 1 && day >= 15 && day <= 21) return true; // 海の日
    if (month === 9 && dayOfWeek === 1 && day >= 15 && day <= 21) return true; // 敬老の日
    if (month === 9 && day >= 22 && day <= 24 && dayOfWeek === 1) return true; // 秋分の日（近似）
    if (month === 10 && dayOfWeek === 1 && day >= 8 && day <= 14) return true; // スポーツの日
    
    return false;
  };
  
  // 曜日名を取得
  const getDayOfWeekName = (date: Date): string => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };
  
  // 各年の各月のデータを生成
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      calendarData[monthKey] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const daySchedule: DaySchedule = {
          date: `${month}/${day}`,
          dayOfWeek: getDayOfWeekName(date),
          isHoliday: isHoliday(date),
          events: []
        };
        
        calendarData[monthKey].push(daySchedule);
      }
    }
  }
  
  return calendarData;
};

// 初期データとイベントをマージする関数
const mergeInitialEvents = (calendarData: { [key: string]: DaySchedule[] }, initialEvents: DaySchedule[]): { [key: string]: DaySchedule[] } => {
  const merged = { ...calendarData };
  
  // 初期イベントデータを2025-09に統合
  const targetMonth = '2025-09';
  if (merged[targetMonth]) {
    initialEvents.forEach(dayWithEvents => {
      const dayIndex = merged[targetMonth].findIndex(day => day.date === dayWithEvents.date);
      if (dayIndex !== -1) {
        merged[targetMonth][dayIndex] = {
          ...merged[targetMonth][dayIndex],
          events: dayWithEvents.events
        };
      }
    });
  }
  
  return merged;
};

// 初期イベントデータ（既存のモックデータ）
const initialMockSchedule: DaySchedule[] = [
  {
    date: '9/4', dayOfWeek: '木', isHoliday: false,
    events: [
      { id: '1', date: '9/4', venue: '馬場', scenario: 'ゲームマスター殺人事件', gms: ['りんな'], startTime: '14:00', endTime: '18:00', category: 'オープン公演', notes: '初心者向け' },
      { id: '2', date: '9/4', venue: '馬場', scenario: '漣の向こう側', gms: ['つばめ'], startTime: '19:00', endTime: '23:30', category: 'オープン公演' },
      { id: '3', date: '9/4', venue: '別館①', scenario: '妖怪たちと月夜の刀', gms: ['マツケン'], startTime: '19:00', endTime: '22:00', category: 'オープン公演' }
    ]
  },
  {
    date: '9/5', dayOfWeek: '金', isHoliday: false,
    events: [
      { id: '4', date: '9/5', venue: '馬場', scenario: '黒い森の『獣』?汝が人殺しなりや？ Part1.', gms: ['マツケン', 'れいにー'], startTime: '19:00', endTime: '22:30', category: 'オープン公演', notes: '中級者向け' },
      { id: '5', date: '9/5', venue: '別館②', scenario: 'ツグミドリ', gms: ['りえぞー', 'マツケン', 'りんな', 'ソラ'], startTime: '19:30', endTime: '24:00', category: 'GMテスト', notes: '新GM研修' },
      { id: '6', date: '9/5', venue: '大久保', scenario: '赤鬼が泣いた夜', gms: ['つばめ'], startTime: '20:00', endTime: '24:30', category: 'オープン公演' }
    ]
  },
  {
    date: '9/6', dayOfWeek: '土', isHoliday: false,
    events: [
      { id: '7', date: '9/6', venue: '馬場', scenario: '超特急の呪いの館で撮れ高足りて��す��？', gms: ['ソラ', 'キュウ'], startTime: '10:00', endTime: '15:00', category: 'オープン公演', notes: 'コメディ系' },
      { id: '8', date: '9/6', venue: '馬場', scenario: '燔祭のジェミニ', gms: ['八継ジノ'], startTime: '16:00', endTime: '20:30', category: 'テストプレイ', notes: '新シナリオ検証' },
      { id: '9', date: '9/6', venue: '馬場', scenario: '漣の向こう側', gms: ['つばめ'], startTime: '21:00', endTime: '01:30', category: 'オープン公演' },
      { id: '10', date: '9/6', venue: '別館①', scenario: '流年', gms: ['えりん', 'れいにー', 'イワセモリシ'], startTime: '14:00', endTime: '20:00', category: 'オープン公演' },
      { id: '11', date: '9/6', venue: '別館①', scenario: '妖怪たちと月夜の刀', gms: ['マツケン'], startTime: '21:00', endTime: '00:00', category: 'オープン公演' }
    ]
  },
  {
    date: '9/7', dayOfWeek: '日', isHoliday: false,
    events: [
      { id: '12', date: '9/7', venue: '馬場', scenario: 'ツグミドリ', gms: ['りえぞー', 'マツケン', 'りんな', 'ソラ'], startTime: '10:00', endTime: '14:30', category: 'オープン公演', notes: '上級者向け・要説明' },
      { id: '13', date: '9/7', venue: '馬場', scenario: '月光の偽桜', gms: ['ソラ', 'つばめ'], startTime: '16:00', endTime: '20:30', category: 'オープン公演' },
      { id: '14', date: '9/7', venue: '別館①', scenario: '妖怪たちと月夜の刀', gms: ['マツケン'], startTime: '14:00', endTime: '17:00', category: 'オープン公演' },
      { id: '15', date: '9/7', venue: '大久保', scenario: '漣の向こう側', gms: ['つばめ'], startTime: '15:00', endTime: '19:30', category: 'オープン公演' }
    ]
  }
];

// 店舗一覧
const venues = ['馬場', '別館①', '別館②', '大久保', '大塚', '埼玉大宮'];

// GM一覧
const availableGMs = ['りんな', 'マツケン', 'れいにー', 'ソラ', 'つばめ', '八継ジノ', 'りえぞー', 'キュウ', 'Remia', 'イワセモリシ', 'えりん', 'しらやま'];

export function ScheduleManager() {
  const { getAvailableScenarios } = useScenarios();
  const availableScenarios = getAvailableScenarios();
  const { addEditEntry } = useEditHistory();
  
  // カレンダーデータの初期化
  const [calendarData] = useState(() => {
    const generated = generateCalendarData();
    return mergeInitialEvents(generated, initialMockSchedule);
  });
  
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<{ open: boolean; conflicts: ScheduleEvent[] }>({ 
    open: false, 
    conflicts: [] 
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; event: ScheduleEvent | null }>({ 
    open: false, 
    event: null 
  });
  const [incompleteDialog, setIncompleteDialog] = useState<{ open: boolean; warnings: string[] }>({ 
    open: false, 
    warnings: [] 
  });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; event: ScheduleEvent | null }>({ 
    open: false, 
    event: null 
  });
  
  // イベントデータの状態管理（LocalStorage対応）
  const [scheduleEvents, setScheduleEvents] = useState<{ [key: string]: DaySchedule[] }>(() => {
    const savedScheduleEvents = localStorage.getItem('murder-mystery-schedule-events');
    if (savedScheduleEvents) {
      try {
        const parsed = JSON.parse(savedScheduleEvents);
        // 保存されたデータと新しいカレンダーデータをマージ
        const merged = { ...calendarData };
        
        // 保存されたイベントデータを統合
        Object.keys(parsed).forEach(monthKey => {
          if (parsed[monthKey] && Array.isArray(parsed[monthKey])) {
            // 保存されたイベントがある月のデータを復元
            merged[monthKey] = parsed[monthKey];
          }
        });
        
        // console.log('スケジュールデータを復元しました:', Object.keys(parsed).length, '月分');
        return merged;
      } catch (error) {
        console.error('スケジュールデータの読み込みに失敗しました:', error);
        return calendarData;
      }
    }
    // console.log('新しいスケジュールデータで初期化します');
    return calendarData;
  });

  // スケジュールデータが変更されるたびにLocalStorageに保存
  useEffect(() => {
    // イベントデータがある月のみを保存してデータサイズを削減
    const eventsToSave: { [key: string]: DaySchedule[] } = {};
    
    Object.keys(scheduleEvents).forEach(monthKey => {
      const monthData = scheduleEvents[monthKey];
      if (monthData && monthData.some(day => day.events && day.events.length > 0)) {
        eventsToSave[monthKey] = monthData;
      }
    });
    
    if (Object.keys(eventsToSave).length > 0) {
      localStorage.setItem('murder-mystery-schedule-events', JSON.stringify(eventsToSave));
      // console.log('スケジュールデータを保存しました:', Object.keys(eventsToSave).length, '月分');
    }
  }, [scheduleEvents]);
  


  // フォーム用の状態
  const [formData, setFormData] = useState({
    scenario: '',
    gms: [] as string[],
    startTime: '',
    endTime: '',
    category: 'オープン公演' as EventCategory,
    reservationInfo: '',
    notes: ''
  });

  // 月選択用のユーティリティ関数
  const getMonthOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2019;
    const endYear = currentYear >= 2026 ? currentYear + 4 : 2030;
    
    const options = [];
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        options.push({
          value: `${year}-${month.toString().padStart(2, '0')}`,
          label: `${year}年${monthNames[month - 1]}`
        });
      }
    }
    
    return options;
  };

  // 前月・次月移動
  const navigateMonth = (direction: 'prev' | 'next') => {
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
    
    const newMonthKey = `${newYear}-${newMonth.toString().padStart(2, '0')}`;
    
    // 必要に応じて新しい年を動的に追加
    if (!scheduleEvents[newMonthKey] && newYear > 2030) {
      const newYearData: { [key: string]: DaySchedule[] } = {};
      for (let m = 1; m <= 12; m++) {
        const monthKey = `${newYear}-${m.toString().padStart(2, '0')}`;
        const daysInMonth = new Date(newYear, m, 0).getDate();
        
        newYearData[monthKey] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(newYear, m - 1, day);
          const days = ['日', '月', '火', '水', '木', '金', '土'];
          
          newYearData[monthKey].push({
            date: `${m}/${day}`,
            dayOfWeek: days[date.getDay()],
            isHoliday: false, // 簡易版
            events: []
          });
        }
      }
      
      setScheduleEvents(prev => ({ ...prev, ...newYearData }));
    }
    
    setSelectedMonth(newMonthKey);
  };

  // 選択された月のスケジュールを取得
  const currentMonthSchedule = useMemo(() => {
    return scheduleEvents[selectedMonth] || [];
  }, [scheduleEvents, selectedMonth]);

  // 日付でスケジュールを取得
  const getEventsForDate = (date: string): ScheduleEvent[] => {
    const daySchedule = currentMonthSchedule.find(day => day.date === date);
    return daySchedule?.events || [];
  };

  // 会場と時間帯でイベントを取得
  const getEventsForVenueAndTimeSlot = (date: string, venue: string, timeSlot: string) => {
    const events = getEventsForDate(date);
    return events.filter(event => {
      if (event.venue !== venue) return false;
      
      const startHour = parseInt(event.startTime.split(':')[0]);
      switch (timeSlot) {
        case 'morning': return startHour < 12;
        case 'afternoon': return startHour >= 12 && startHour < 17;
        case 'evening': return startHour >= 17;
        default: return false;
      }
    });
  };

  // セッション追加・編集ダイアログを開く
  const openEventDialog = (date: string, venue: string, timeSlot?: string) => {
    // 時間帯に応じたデフォルト開始時間を設定
    let defaultStartTime = '19:00'; // デフォルトは夜公演
    if (timeSlot === 'morning') {
      defaultStartTime = '10:00'; // 朝公演
    } else if (timeSlot === 'afternoon') {
      defaultStartTime = '14:30'; // 昼公演
    } else if (timeSlot === 'evening') {
      defaultStartTime = '19:00'; // 夜公演
    }

    setEditingEvent({
      id: `new-${date}-${venue}-${Date.now()}`,
      date,
      venue,
      scenario: '',
      gms: [],
      startTime: defaultStartTime,
      endTime: defaultStartTime,
      category: 'オープン公演'
    });
    setFormData({
      scenario: '',
      gms: [],
      startTime: defaultStartTime,
      endTime: defaultStartTime,
      category: 'オープン公演',
      reservationInfo: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  // 既存イベントの編集
  const openEditDialog = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setFormData({
      scenario: event.scenario || '',
      gms: event.gms || [],
      startTime: event.startTime || '19:00',
      endTime: event.endTime || '21:00',
      category: event.category || 'オープン公演',
      reservationInfo: event.reservationInfo || '',
      notes: event.notes || ''
    });
    setIsDialogOpen(true);
  };

  // 終了時間を計算
  const calculateEndTimeLocal = (startTime: string, scenarioTitle: string): string => {
    const scenario = availableScenarios.find(s => s.title === scenarioTitle);
    if (!scenario) return startTime;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + scenario.duration;
    return minutesToTime(endMinutes);
  };

  // シナリオ変更時の処理
  const handleScenarioChange = (scenarioTitle: string) => {
    const actualScenarioTitle = scenarioTitle === 'unspecified' ? '' : scenarioTitle;
    setFormData(prev => ({ ...prev, scenario: actualScenarioTitle }));
    
    // シナリオが選択され、開始時間が設定されている場合は終了時間を自動計算
    if (actualScenarioTitle && formData.startTime) {
      const endTime = calculateEndTimeLocal(formData.startTime, actualScenarioTitle);
      setFormData(prev => ({ ...prev, endTime }));
    }
  };

  // イベントを保存
  const saveEvent = () => {
    if (!editingEvent) return;

    const updatedEvent: ScheduleEvent = {
      ...editingEvent,
      scenario: formData.scenario,
      gms: formData.gms,
      startTime: formData.startTime,
      endTime: formData.endTime,
      category: formData.category,
      reservationInfo: formData.reservationInfo,
      notes: formData.notes
    };

    // スケジュールデータを更新
    setScheduleEvents(prev => {
      const updated = { ...prev };
      const monthData = [...(updated[selectedMonth] || [])];
      
      const dayIndex = monthData.findIndex(day => day.date === updatedEvent.date);
      if (dayIndex !== -1) {
        const existingEventIndex = monthData[dayIndex].events.findIndex(e => e.id === updatedEvent.id);
        
        if (existingEventIndex >= 0) {
          // 既存イベントを更新
          monthData[dayIndex].events[existingEventIndex] = updatedEvent;
        } else {
          // 新しいイベント��追加
          monthData[dayIndex].events.push(updatedEvent);
        }
        
        updated[selectedMonth] = monthData;
      }
      
      return updated;
    });

    // 編集履歴に追加
    const isNewEvent = updatedEvent.id.startsWith('new-');
    addEditEntry({
      user: 'ま sui',
      action: isNewEvent ? 'create' : 'update',
      target: `${updatedEvent.date} ${updatedEvent.venue} - ${updatedEvent.scenario}`,
      summary: isNewEvent 
        ? `新規公演を追加：${updatedEvent.scenario}（${updatedEvent.startTime}-${updatedEvent.endTime}）${updatedEvent.gms.join(', ')}` 
        : `公演情報を更新：${updatedEvent.scenario}`,
      category: 'schedule',
      changes: [
        { field: 'シナリオ', newValue: updatedEvent.scenario },
        { field: '開始時間', newValue: updatedEvent.startTime },
        { field: '担当GM', newValue: updatedEvent.gms.join(', ') }
      ]
    });
    closeDialog();
  };

  // 削除確認ダイアログを開く
  const openDeleteDialog = (event: ScheduleEvent) => {
    setDeleteDialog({ open: true, event });
  };

  // イベントを削除
  const deleteEvent = () => {
    if (!deleteDialog.event) return;

    const eventToDelete = deleteDialog.event;
    
    setScheduleEvents(prev => {
      const updated = { ...prev };
      const monthData = [...(updated[selectedMonth] || [])];
      
      const dayIndex = monthData.findIndex(day => day.date === eventToDelete.date);
      if (dayIndex !== -1) {
        monthData[dayIndex].events = monthData[dayIndex].events.filter(e => e.id !== eventToDelete.id);
        updated[selectedMonth] = monthData;
      }
      
      return updated;
    });

    // 編集履歴に削除を追加
    addEditEntry({
      user: 'ま sui',
      action: 'delete',
      target: `${eventToDelete.date} ${eventToDelete.venue} - ${eventToDelete.scenario}`,
      summary: `公演を削除：${eventToDelete.scenario}（${eventToDelete.startTime}-${eventToDelete.endTime}）`,
      category: 'schedule',
      changes: [
        { field: 'シナリオ', oldValue: eventToDelete.scenario, newValue: '' },
        { field: '開始時間', oldValue: eventToDelete.startTime, newValue: '' },
        { field: '担当GM', oldValue: eventToDelete.gms.join(', '), newValue: '' }
      ]
    });

    setDeleteDialog({ open: false, event: null });
  };

  // ダイアログを閉じる
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setFormData({
      scenario: '',
      gms: [],
      startTime: '19:00',
      endTime: '21:00',
      category: 'オープン公演',
      reservationInfo: '',
      notes: ''
    });
  };

  // イベントが未完成かどうかをチェック
  const isIncompleteEvent = (event: ScheduleEvent): boolean => {
    return !event.scenario || !event.gms || event.scenario.trim() === '' || event.gms.length === 0;
  };

  // 中止確認ダイアログを開く
  const openCancelDialog = (event: ScheduleEvent) => {
    setCancelDialog({ open: true, event });
  };

  // 公演を中止
  const cancelEvent = () => {
    if (!cancelDialog.event) return;

    const eventToCancel = cancelDialog.event;
    
    setScheduleEvents(prev => {
      const updated = { ...prev };
      const monthData = [...(updated[selectedMonth] || [])];
      
      const dayIndex = monthData.findIndex(day => day.date === eventToCancel.date);
      if (dayIndex !== -1) {
        const eventIndex = monthData[dayIndex].events.findIndex(e => e.id === eventToCancel.id);
        if (eventIndex !== -1) {
          monthData[dayIndex].events[eventIndex] = {
            ...monthData[dayIndex].events[eventIndex],
            isCancelled: true
          };
          updated[selectedMonth] = monthData;
        }
      }
      
      return updated;
    });

    // 編集履歴に中止を追加
    addEditEntry({
      user: 'ま sui',
      action: 'update',
      target: `${eventToCancel.date} ${eventToCancel.venue} - ${eventToCancel.scenario}`,
      summary: `公演を中止：${eventToCancel.scenario}（${eventToCancel.startTime}-${eventToCancel.endTime}）`,
      category: 'schedule',
      changes: [
        { field: 'ステータス', oldValue: '開催', newValue: '中止' }
      ]
    });

    setCancelDialog({ open: false, event: null });
  };

  // 公演の中止を解除
  const uncancelEvent = (event: ScheduleEvent) => {
    setScheduleEvents(prev => {
      const updated = { ...prev };
      const monthData = [...(updated[selectedMonth] || [])];
      
      const dayIndex = monthData.findIndex(day => day.date === event.date);
      if (dayIndex !== -1) {
        const eventIndex = monthData[dayIndex].events.findIndex(e => e.id === event.id);
        if (eventIndex !== -1) {
          monthData[dayIndex].events[eventIndex] = {
            ...monthData[dayIndex].events[eventIndex],
            isCancelled: false
          };
          updated[selectedMonth] = monthData;
        }
      }
      
      return updated;
    });

    // 編集履歴に中止解除を追加
    addEditEntry({
      user: 'ま sui',
      action: 'update',
      target: `${event.date} ${event.venue} - ${event.scenario}`,
      summary: `公演の中止を解除：${event.scenario}（${event.startTime}-${event.endTime}）`,
      category: 'schedule',
      changes: [
        { field: 'ステータス', oldValue: '中止', newValue: '開催' }
      ]
    });
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>月間スケジュール管理</h2>
        <div className="flex gap-4 items-center">
          {/* 月選択コントロール */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 border-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {getMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => {
              const firstDay = currentMonthSchedule[0]?.date || '1/1';
              openEventDialog(firstDay, '馬場');
            }}>
              <Plus className="w-4 h-4 mr-2" />
              新しい公演を追加
            </Button>
          </div>
        </div>
      </div>

      {/* カテゴリ凡例 */}
      <Card>
        <CardHeader>
          <CardTitle>公演カテゴリ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {eventCategories.map(category => (
              <Badge key={category} className={categoryBadgeColors[category]}>
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>



      <Card>
        <CardHeader>
          <CardTitle>リストカレンダー - {selectedMonth.replace('-', '年').replace(/^(\d{4})年(\d{2})$/, '$1年$2月')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            ※公演間インターバルが1.5時間未満の場合は赤い枠で警告表示されます<br/>
            ※シナリオやGMが未定の場合は黄色い枠で警告表示されます
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">日付</TableHead>
                  <TableHead className="w-12">曜日</TableHead>
                  <TableHead className="w-[100px]">会場</TableHead>
                  <TableHead className="min-w-[200px]">午前（~12:00）</TableHead>
                  <TableHead className="min-w-[200px]">午後（12:00~17:00）</TableHead>
                  <TableHead className="min-w-[200px]">夜間（17:00~）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthSchedule.map((day) => 
                  venues.map((venue, venueIndex) => (
                    <TableRow key={`${day.date}-${venue}`}>
                      {venueIndex === 0 && (
                        <>
                          <TableCell rowSpan={venues.length} className="border-r">
                            <div className="text-center">
                              <div className={`font-medium ${day.isHoliday ? 'text-red-600' : ''}`}>
                                {day.date}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell rowSpan={venues.length} className="border-r">
                            <div className="text-center">
                              <div className={`font-medium ${day.dayOfWeek === '日' || day.isHoliday ? 'text-red-600' : day.dayOfWeek === '土' ? 'text-blue-600' : ''}`}>
                                {day.dayOfWeek}
                              </div>
                            </div>
                          </TableCell>
                        </>
                      )}

                      <TableCell className="border-r">
                        <div className="font-medium text-center">{venue}</div>
                      </TableCell>

                      {/* 各時間帯のイベント表示 */}
                      {['morning', 'afternoon', 'evening'].map(timeSlot => {
                        const events = getEventsForVenueAndTimeSlot(day.date, venue, timeSlot);

                        return (
                          <TableCell key={timeSlot} className="p-1 align-top">
                            <div className="min-h-[60px] relative">
                              {events.length > 0 ? (
                                <div className="space-y-1">
                                  {events.map(event => {
                                    const isIncomplete = isIncompleteEvent(event);
                                    const reservationCount = getReservationCount(event);
                                    
                                    return (
                                      <div
                                        key={event.id}
                                        className={`p-2 border rounded-md hover:shadow-sm transition-shadow text-xs relative ${
                                          event.isCancelled 
                                            ? 'bg-gray-100 border-gray-300 opacity-75' 
                                            : categoryColors[event.category] || 'bg-gray-50 border-gray-200'
                                        } ${
                                          isIncomplete ? 'border-yellow-400 border-2' : ''
                                        }`}
                                      >
                                        <div 
                                          className="cursor-pointer"
                                          onClick={() => openEditDialog(event)}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className={`font-mono text-xs ${event.isCancelled ? 'line-through text-gray-500' : ''}`}>
                                              {event.startTime}-{event.endTime}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              {event.isCancelled && (
                                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                                  中止
                                                </Badge>
                                              )}
                                              {reservationCount > 0 && !event.isCancelled && (
                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                  <Users className="w-3 h-3 mr-1" />
                                                  {reservationCount}
                                                </Badge>
                                              )}
                                              <Badge className={`text-xs px-1 py-0 ${categoryBadgeColors[event.category]} ${event.isCancelled ? 'opacity-60' : ''}`}>
                                                {event.category}
                                              </Badge>
                                            </div>
                                          </div>
                                          
                                          <div className={`font-medium line-clamp-2 mb-1 ${event.isCancelled ? 'line-through text-gray-500' : ''}`}>
                                            {event.scenario || '未定'}
                                          </div>
                                          
                                          <div className={`text-xs text-muted-foreground mb-1 ${event.isCancelled ? 'line-through' : ''}`}>
                                            GM: {event.gms.length > 0 ? event.gms.join(', ') : '未定'}
                                          </div>
                                          
                                          {event.notes && (
                                            <div className={`text-xs text-muted-foreground truncate ${event.isCancelled ? 'line-through' : ''}`}>
                                              {event.notes}
                                            </div>
                                          )}
                                        </div>

                                        {/* 中止ボタン */}
                                        {!event.isCancelled && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute bottom-1 right-1 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openCancelDialog(event);
                                            }}
                                          >
                                            <Ban className="w-3 h-3" />
                                          </Button>
                                        )}

                                        {/* 中止解除ボタン */}
                                        {event.isCancelled && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute bottom-1 right-1 h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              uncancelEvent(event);
                                            }}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                        )}

                                        {(isIncomplete || (event.scenario && event.startTime && event.endTime && 
                                          isEndTimeModified(event.startTime, event.endTime, event.scenario, availableScenarios))) && (
                                          <div className="absolute top-1 right-1 flex gap-1">
                                            {isIncomplete && (
                                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                            )}
                                            {event.scenario && event.startTime && event.endTime && 
                                             isEndTimeModified(event.startTime, event.endTime, event.scenario, availableScenarios) && (
                                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  onClick={() => openEventDialog(day.date, venue, timeSlot)}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  <span className="text-xs">公演追加</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* イベント編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent?.id.startsWith('new-') ? '公演追加' : '公演編集'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent?.date} {editingEvent?.venue}での公演情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="history">編集履歴</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
            {/* シナリオ選択 */}
            <div className="space-y-2">
              <Label htmlFor="scenario">シナリオ</Label>
              <Select value={formData.scenario || 'unspecified'} onValueChange={handleScenarioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="シナリオを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">未定</SelectItem>
                  {availableScenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.title}>
                      {scenario.title} ({scenario.duration / 60}時間)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* GM選択 */}
            <div className="space-y-2">
              <Label>担当GM</Label>
              <div className="grid grid-cols-3 gap-2">
                {availableGMs.map(gm => (
                  <div key={gm} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gm-${gm}`}
                      checked={formData.gms.includes(gm)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, gms: [...prev.gms, gm] }));
                        } else {
                          setFormData(prev => ({ ...prev, gms: prev.gms.filter(g => g !== gm) }));
                        }
                      }}
                    />
                    <Label htmlFor={`gm-${gm}`} className="text-sm">{gm}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 開始時間 */}
            <div className="space-y-2">
              <Label htmlFor="startTime">開始時間</Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, startTime: value }));
                  // シナリオが選択されている場合、自動で終了時間を計算
                  if (formData.scenario) {
                    const endTime = calculateEndTimeLocal(value, formData.scenario);
                    setFormData(prev => ({ ...prev, endTime }));
                  }
                }}
              >
                <SelectTrigger id="startTime">
                  <SelectValue placeholder="開始時間を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="09:30">09:30</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="10:30">10:30</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="11:30">11:30</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="12:30">12:30</SelectItem>
                  <SelectItem value="13:00">13:00</SelectItem>
                  <SelectItem value="13:30">13:30</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="14:30">14:30</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="15:30">15:30</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="16:30">16:30</SelectItem>
                  <SelectItem value="17:00">17:00</SelectItem>
                  <SelectItem value="17:30">17:30</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="18:30">18:30</SelectItem>
                  <SelectItem value="19:00">19:00</SelectItem>
                  <SelectItem value="19:30">19:30</SelectItem>
                  <SelectItem value="20:00">20:00</SelectItem>
                  <SelectItem value="20:30">20:30</SelectItem>
                  <SelectItem value="21:00">21:00</SelectItem>
                  <SelectItem value="21:30">21:30</SelectItem>
                  <SelectItem value="22:00">22:00</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 終了時間 */}
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時間</Label>
              <Select
                value={formData.endTime}
                onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
              >
                <SelectTrigger id="endTime">
                  <SelectValue placeholder="終了時間を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="10:30">10:30</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="11:30">11:30</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="12:30">12:30</SelectItem>
                  <SelectItem value="13:00">13:00</SelectItem>
                  <SelectItem value="13:30">13:30</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="14:30">14:30</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="15:30">15:30</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="16:30">16:30</SelectItem>
                  <SelectItem value="17:00">17:00</SelectItem>
                  <SelectItem value="17:30">17:30</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="18:30">18:30</SelectItem>
                  <SelectItem value="19:00">19:00</SelectItem>
                  <SelectItem value="19:30">19:30</SelectItem>
                  <SelectItem value="20:00">20:00</SelectItem>
                  <SelectItem value="20:30">20:30</SelectItem>
                  <SelectItem value="21:00">21:00</SelectItem>
                  <SelectItem value="21:30">21:30</SelectItem>
                  <SelectItem value="22:00">22:00</SelectItem>
                  <SelectItem value="22:30">22:30</SelectItem>
                  <SelectItem value="23:00">23:00</SelectItem>
                  <SelectItem value="23:30">23:30</SelectItem>
                  <SelectItem value="00:00">00:00</SelectItem>
                  <SelectItem value="00:30">00:30</SelectItem>
                  <SelectItem value="01:00">01:00</SelectItem>
                  <SelectItem value="01:30">01:30</SelectItem>
                  <SelectItem value="02:00">02:00</SelectItem>
                </SelectContent>
              </Select>
              {formData.scenario && formData.startTime && formData.endTime && 
               isEndTimeModified(formData.startTime, formData.endTime, formData.scenario, availableScenarios) && (
                <div className="flex items-center gap-1 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>標準公演時間と異なります</span>
                </div>
              )}
            </div>

            {/* カテゴリ */}
            <div className="space-y-2">
              <Label htmlFor="category">公演カテゴリ</Label>
              <Select value={formData.category} onValueChange={(value: EventCategory) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 予約情報 */}
            {formData.category === '貸切公演' && (
              <div className="space-y-2">
                <Label htmlFor="reservationInfo">予約情報</Label>
                <Input
                  id="reservationInfo"
                  value={formData.reservationInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, reservationInfo: e.target.value }))}
                  placeholder="予約者名や企業名など"
                />
              </div>
            )}

            {/* 備考 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="特記事項や注意点など"
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {editingEvent && !editingEvent.id.startsWith('new-') && (
                  <Button variant="destructive" onClick={() => openDeleteDialog(editingEvent)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  キャンセル
                </Button>
                <Button onClick={saveEvent}>
                  保存
                </Button>
              </div>
            </div>
            </TabsContent>
            
            <TabsContent value="history">
              {editingEvent && (
                <ItemEditHistory 
                  itemId={editingEvent.id}
                  itemName={`${editingEvent.date} ${editingEvent.venue} - ${editingEvent.scenario}`}
                  category="schedule"
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              公演の削除確認
            </AlertDialogTitle>
            <AlertDialogDescription>
              以下の公演を削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteDialog.event && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono">
                  {deleteDialog.event.startTime}-{deleteDialog.event.endTime}
                </span>
                <Badge className={categoryBadgeColors[deleteDialog.event.category]}>
                  {deleteDialog.event.category}
                </Badge>
              </div>
              <div className="text-sm font-medium mb-1">{deleteDialog.event.scenario}</div>
              <div className="text-xs text-muted-foreground">
                {deleteDialog.event.date} {deleteDialog.event.venue}
              </div>
              {deleteDialog.event.gms && (
                <div className="text-xs text-muted-foreground">GM: {deleteDialog.event.gms.join(', ')}</div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, event: null })}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteEvent} className="bg-red-600 hover:bg-red-700">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    {/* 中止確認ダイアログ */}
    <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>公演の中止確認</AlertDialogTitle>
          <AlertDialogDescription>
            以下の公演を中止しますか？この操作は後から取り消すことができます。
            <br />
            <br />
            <strong>日時:</strong> {cancelDialog.event?.date} {cancelDialog.event?.startTime}-{cancelDialog.event?.endTime}
            <br />
            <strong>会場:</strong> {cancelDialog.event?.venue}
            <br />
            <strong>シナリオ:</strong> {cancelDialog.event?.scenario}
            <br />
            <strong>GM:</strong> {cancelDialog.event?.gms.join(', ')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={cancelEvent} className="bg-red-600 hover:bg-red-700">
            中止する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}