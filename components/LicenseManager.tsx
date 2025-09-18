import React, { useState, useMemo, useEffect } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// 最適化されたアイコンインポート
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Calculator from 'lucide-react/dist/esm/icons/calculator';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import { useScenarios } from '../contexts/ScenarioContext';
import { useEditHistory } from '../contexts/EditHistoryContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { toast } from 'sonner';

interface ScheduleEvent {
  id: string;
  date: string;
  venue: string;
  scenario: string;
  gms: string[];
  startTime: string;
  endTime: string;
  category: string;
  isCancelled?: boolean;
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  isHoliday: boolean;
  events: ScheduleEvent[];
}

interface LicenseCalculation {
  id: string;
  month: string;
  year: number;
  scenarioUsage: { [scenario: string]: number };
  status: 'draft' | 'calculated' | 'sent';
  calculatedAt?: Date;
  sentAt?: Date;
  totalEvents: number;
  notes?: string;
}

interface ScenarioAuthor {
  scenario: string;
  author: string;
  email?: string;
  discordChannel?: string;
  licenseRate: number; // ライセンス料（1回あたり）
  contactMethod: 'email' | 'discord';
}

interface ScenarioUsage {
  scenario: string;
  count: number;
  licenseRate: number;
  totalAmount: number;
}

interface AuthorSummary {
  authorName: string;
  scenarioCount: number;
  scenarios: ScenarioAuthor[];
  monthlyUsage: number;
  scenarioUsage: ScenarioUsage[];
}

// 月名配列
const monthNames = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

// 模擬データ - シナリオ作者情報
const mockScenarioAuthors: ScenarioAuthor[] = [
  {
    scenario: 'ゲームマスター殺人事件',
    author: '田中太郎',
    email: 'tanaka@example.com',
    licenseRate: 500,
    contactMethod: 'email'
  },
  {
    scenario: '漣の向こう側',
    author: '佐藤花子',
    discordChannel: '#scenario-authors',
    licenseRate: 800,
    contactMethod: 'discord'
  },
  {
    scenario: '妖怪たちと月夜の刀',
    author: '山田次郎',
    email: 'yamada@example.com',
    licenseRate: 600,
    contactMethod: 'email'
  },
  {
    scenario: '黒い森の『獣』?汝が人殺しなりや？ Part1.',
    author: '鈴木美咲',
    email: 'suzuki@example.com',
    discordChannel: '#mystery-authors',
    licenseRate: 750,
    contactMethod: 'email'
  },
  {
    scenario: 'ツグミドリ',
    author: '高橋健一',
    discordChannel: '#premium-scenarios',
    licenseRate: 1000,
    contactMethod: 'discord'
  }
];

export function LicenseManager() {
  const { getAvailableScenarios } = useScenarios();
  const { addEditEntry } = useEditHistory();
  const { isConnected } = useSupabase();
  
  // Safely get available scenarios with fallback
  const availableScenarios = useMemo(() => {
    try {
      const scenarios = getAvailableScenarios();
      return Array.isArray(scenarios) ? scenarios : [];
    } catch (error) {
      console.error('Error getting available scenarios:', error);
      return [];
    }
  }, [getAvailableScenarios]);

  // Filter available scenarios to prevent duplicate keys and ensure valid data
  const filteredScenarios = useMemo(() => {
    if (!availableScenarios || !Array.isArray(availableScenarios)) {
      return [];
    }
    return availableScenarios
      .map(scenario => typeof scenario === 'string' ? scenario : scenario.title)
      .filter((title): title is string => title && title.trim() !== '')
      .filter((title, index, self) => self.indexOf(title) === index);
  }, [availableScenarios]);

  // 状態管理
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<ScenarioAuthor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; calculation: LicenseCalculation | null }>({
    open: false,
    calculation: null
  });

  // 作者編集フォームの状態（シナリオ管理から参照するため、編集機能は無効化）
  const [authorForm, setAuthorForm] = useState({
    scenario: '',
    author: '',
    email: '',
    discordChannel: '',
    licenseRate: 0,
    contactMethod: 'email' as 'email' | 'discord'
  });

  // 計算メモの状態
  const [calculationNotes, setCalculationNotes] = useState('');

  // Supabaseからライセンス計算データを取得
  const {
    data: calculations,
    loading: calculationsLoading,
    error: calculationsError,
    insert: insertCalculation,
    update: updateCalculation,
    delete: deleteCalculation,
    refetch: refetchCalculations
  } = useSupabaseData<any>({
    table: 'license_calculations',
    realtime: true,
    orderBy: { column: 'calculated_at', ascending: false }
  });

  // シナリオ管理から作者データを取得（シナリオテーブルから）
  const {
    data: scenariosData,
    loading: scenariosLoading,
    error: scenariosError
  } = useSupabaseData<any>({
    table: 'scenarios',
    realtime: true,
    orderBy: { column: 'author', ascending: true }
  });

  // 作者データを取得（scenario_authorsテーブルから）
  const {
    data: authorData,
    loading: authorLoading,
    error: authorError,
    insert: insertAuthor,
    update: updateAuthor,
    delete: deleteAuthor
  } = useSupabaseData<any>({
    table: 'scenario_authors',
    realtime: true,
    orderBy: { column: 'scenario_title', ascending: true }
  });

  // データをアプリケーション形式に変換
  const convertedCalculations = useMemo(() => {
    if (!Array.isArray(calculations)) return [];
    
    return calculations.map((calc: any) => ({
      id: calc.id,
      month: new Date(calc.calculated_at).getMonth() + 1,
      year: new Date(calc.calculated_at).getFullYear(),
      scenarioUsage: { [calc.scenario_title]: 1 }, // 簡略化
      status: calc.sent_at ? 'sent' : 'calculated',
      calculatedAt: calc.calculated_at ? new Date(calc.calculated_at) : undefined,
      sentAt: calc.sent_at ? new Date(calc.sent_at) : undefined,
      totalEvents: 1,
      notes: calc.notes
    }));
  }, [calculations]);

  // シナリオデータから作者情報を抽出
  const convertedAuthors = useMemo(() => {
    if (!Array.isArray(scenariosData)) return mockScenarioAuthors;
    
    // 作者ごとにシナリオをグループ化
    const authorMap = new Map();
    
    scenariosData.forEach((scenario: any) => {
      const author = scenario.author;
      if (!author) return;
      
      if (!authorMap.has(author)) {
        authorMap.set(author, {
          author: author,
          scenarios: [],
          totalLicenseRate: 0
        });
      }
      
      authorMap.get(author).scenarios.push({
        scenario: scenario.title,
        author: author,
        email: '', // シナリオテーブルにはメール情報がない
        discordChannel: '', // シナリオテーブルにはDiscord情報がない
        licenseRate: scenario.license_amount || 0,
        contactMethod: 'email' as const // デフォルト値
      });
      
      authorMap.get(author).totalLicenseRate += scenario.license_amount || 0;
    });
    
    // 作者ごとのシナリオリストに変換（すべてのシナリオを含める）
    const authors = Array.from(authorMap.values()).flatMap(authorData => 
      authorData.scenarios // すべてのシナリオを含める
    );
    
    return authors.length > 0 ? authors : mockScenarioAuthors;
  }, [scenariosData]);

  // Supabaseからスケジュールデータを取得
  const {
    data: scheduleEvents,
    loading: scheduleLoading,
    error: scheduleError
  } = useSupabaseData<any>({
    table: 'schedule_events',
    realtime: true,
    orderBy: { column: 'date', ascending: true }
  });

  // スケジュールデータを取得
  const getScheduleData = (): { [key: string]: DaySchedule[] } => {
    if (!Array.isArray(scheduleEvents)) return {};
    
    // スケジュールイベントを日付ごとにグループ化
    const groupedEvents: { [key: string]: DaySchedule[] } = {};
    
    scheduleEvents.forEach((event: any) => {
      const date = event.date;
      if (!groupedEvents[date]) {
        groupedEvents[date] = [];
      }
      
      groupedEvents[date].push({
        date: event.date,
        dayOfWeek: new Date(event.date).toLocaleDateString('ja-JP', { weekday: 'long' }),
        isHoliday: false, // 簡略化
        events: [{
          id: event.id,
          date: event.date,
          venue: event.venue,
          scenario: event.scenario,
          gms: event.gms || [],
          startTime: event.start_time,
          endTime: event.end_time,
          category: event.category,
          isCancelled: event.is_cancelled || false
        }]
      });
    });
    
    return groupedEvents;
  };

  // 指定月のシナリオ使用回数を計算
  const calculateMonthlyUsage = (year: number, month: number) => {
    const scheduleData = getScheduleData();
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const monthData = scheduleData[monthKey] || [];

    const scenarioUsage: { [scenario: string]: number } = {};
    let totalEvents = 0;

    monthData.forEach(day => {
      day.events.forEach(event => {
        if (!event.isCancelled && event.scenario && event.scenario !== '未定') {
          scenarioUsage[event.scenario] = (scenarioUsage[event.scenario] || 0) + 1;
          totalEvents++;
        }
      });
    });

    return { scenarioUsage, totalEvents };
  };

  // 月別計算の実行
  const performCalculation = async () => {
    const { scenarioUsage, totalEvents } = calculateMonthlyUsage(selectedYear, selectedMonth);
    
    const calculationId = crypto.randomUUID();
    const existingCalculation = convertedCalculations.find(calc => calc.id === calculationId);

    const newCalculation = {
      id: calculationId,
      scenario_title: Object.keys(scenarioUsage)[0] || '', // 簡略化
      author: convertedAuthors.find(a => a.scenario === Object.keys(scenarioUsage)[0])?.author || '',
      email: convertedAuthors.find(a => a.scenario === Object.keys(scenarioUsage)[0])?.email || '',
      discord_channel: convertedAuthors.find(a => a.scenario === Object.keys(scenarioUsage)[0])?.discordChannel || null,
      license_rate: convertedAuthors.find(a => a.scenario === Object.keys(scenarioUsage)[0])?.licenseRate || 0,
      contact_method: convertedAuthors.find(a => a.scenario === Object.keys(scenarioUsage)[0])?.contactMethod || 'email',
      calculated_at: new Date().toISOString(),
      sent_at: null,
      notes: calculationNotes.trim() || null
    };

    try {
      if (existingCalculation) {
        await updateCalculation(calculationId, newCalculation);
      } else {
        await insertCalculation(newCalculation);
      }

      // 編集履歴に追加
      addEditEntry({
        user: 'ま sui',
        action: existingCalculation ? 'update' : 'create',
        target: `${selectedYear}年${monthNames[selectedMonth - 1]}のライセンス計算`,
        summary: `ライセンス計算を実行：合計${totalEvents}件の公演`,
        category: 'license',
        changes: Object.entries(scenarioUsage).map(([scenario, count]) => ({
          field: scenario,
          newValue: `${count}回`
        }))
      });

      setCalculationNotes(''); // メモをクリア
      toast.success(`${selectedYear}年${monthNames[selectedMonth - 1]}のライセンス計算が完了しました`);
    } catch (error) {
      console.error('ライセンス計算の保存に失敗:', error);
      toast.error('ライセンス計算の保存に失敗しました');
    }
  };

  // 確定と送信
  const confirmAndSend = (calculation: LicenseCalculation) => {
    setConfirmDialog({ open: true, calculation });
  };

  const executeSend = () => {
    if (!confirmDialog.calculation) return;

    const updatedCalculations = calculations.map(calc => 
      calc.id === confirmDialog.calculation!.id
        ? { ...calc, status: 'sent' as const, sentAt: new Date() }
        : calc
    );
    
    setCalculations(updatedCalculations);

    // 各シナリオ作者への送信をシミュレート
    const sentMessages: string[] = [];
    Object.entries(confirmDialog.calculation.scenarioUsage).forEach(([scenario, count]) => {
      const author = convertedAuthors.find(a => a.scenario === scenario);
      if (author) {
        const licenseAmount = count * author.licenseRate;
        
        if (author.contactMethod === 'email' && author.email) {
          const emailContent = `
件名: ${confirmDialog.calculation!.year}年${confirmDialog.calculation!.month} シナリオライセンス料のお知らせ

${author.author} 様

いつもお世話になっております。
マーダーミステリー店舗管理システムより、ライセンス料のご連絡をいたします。

【使用実績】
シナリオ名: ${scenario}
使用回数: ${count}回
単価: ¥${author.licenseRate.toLocaleString()}
合計ライセンス料: ¥${licenseAmount.toLocaleString()}

対象期間: ${confirmDialog.calculation!.year}年${confirmDialog.calculation!.month}

お支払いに関する詳細は、別途ご連絡いたします。

何かご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。
          `;
          
          console.log(`=== メール送信 ===`);
          console.log(`宛先: ${author.email}`);
          console.log(emailContent);
          sentMessages.push(`${author.author}様にメール送信完了`);
          
        } else if (author.contactMethod === 'discord' && author.discordChannel) {
          const discordMessage = `
@${author.author} 

📊 **${confirmDialog.calculation!.year}年${confirmDialog.calculation!.month} ライセンス料のお知らせ**

🎭 **シナリオ**: ${scenario}
🔢 **使用回数**: ${count}回
💰 **単価**: ¥${author.licenseRate.toLocaleString()}
💳 **合計**: ¥${licenseAmount.toLocaleString()}

お疲れ様でした！詳細は別途DMいたします。
          `;
          
          console.log(`=== Discord送信 ===`);
          console.log(`チャンネル: ${author.discordChannel}`);
          console.log(discordMessage);
          sentMessages.push(`${author.author}様にDiscord送信完了`);
        }
      }
    });

    // 送信結果の詳細表示
    console.log(`\n=== 送信完了サマリー ===`);
    console.log(`対象月: ${confirmDialog.calculation.year}年${confirmDialog.calculation.month}`);
    console.log(`総作者数: ${Object.keys(confirmDialog.calculation.scenarioUsage).length}名`);
    console.log(`送信完了: ${sentMessages.length}件`);
    sentMessages.forEach(msg => console.log(`- ${msg}`));

    // 編集履歴に追加
    addEditEntry({
      user: 'ま sui',
      action: 'update',
      target: `${confirmDialog.calculation.year}年${confirmDialog.calculation.month}のライセンス計算`,
      summary: `ライセンス料金の連絡を送信完了`,
      category: 'license',
      changes: [
        { field: 'ステータス', oldValue: 'calculated', newValue: 'sent' },
        { field: '送信日時', newValue: new Date().toLocaleString() }
      ]
    });

    toast.success('シナリオ作者への連絡を送信しました');
    setConfirmDialog({ open: false, calculation: null });
  };

  // 現在の月の計算データ
  const currentCalculation = convertedCalculations.find(calc =>
    calc.year === selectedYear && calc.month === monthNames[selectedMonth - 1]
  );

  // 年度選択オプション
  const yearOptions = [];
  for (let year = 2019; year <= new Date().getFullYear() + 1; year++) {
    yearOptions.push(year);
  }

  // 総計算
  const getTotalAmount = (calculation: LicenseCalculation) => {
    return Object.entries(calculation.scenarioUsage).reduce((total, [scenario, count]) => {
      const author = convertedAuthors.find(a => a.scenario === scenario);
      return total + (count * (author?.licenseRate || 0));
    }, 0);
  };

  // 年月ナビゲーション
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // 作者ダイアログを開く
  const openAuthorDialog = (author?: ScenarioAuthor) => {
    if (author) {
      setEditingAuthor(author);
      setAuthorForm({
        scenario: author.scenario,
        author: author.author,
        email: author.email || '',
        discordChannel: author.discordChannel || '',
        licenseRate: author.licenseRate,
        contactMethod: author.contactMethod
      });
    } else {
      setEditingAuthor(null);
      setAuthorForm({
        scenario: '',
        author: '',
        email: '',
        discordChannel: '',
        licenseRate: 0,
        contactMethod: 'email'
      });
      
      // 新規追加時にシナリオがない場合の警告
      if (filteredScenarios.length === 0) {
        toast.warning('利用可能なシナリオがありません。先にシナリオ管理ページでシナリオを登録してください。');
      }
    }
    setIsAuthorDialogOpen(true);
  };

  // 作者情報を保存
  const saveAuthor = async () => {
    // 利用可能なシナリオがない場合
    if (filteredScenarios.length === 0) {
      toast.error('利用可能なシナリオがありません。先にシナリオを登録してください。');
      return;
    }

    // バリデーション
    if (!authorForm.scenario.trim() || !authorForm.author.trim() || authorForm.licenseRate <= 0) {
      toast.error('シナリオ名、作者名、ライセンス料は必須です');
      return;
    }

    if (authorForm.contactMethod === 'email' && !authorForm.email.trim()) {
      toast.error('メール連絡の場合、メールアドレスは必須です');
      return;
    }

    if (authorForm.contactMethod === 'discord' && !authorForm.discordChannel.trim()) {
      toast.error('Discord連絡の場合、チャンネル名は必須です');
      return;
    }

    // 重複チェック（編集時は自分以外）
    const existingAuthor = convertedAuthors.find(a => 
      a.scenario === authorForm.scenario && 
      (!editingAuthor || a.scenario !== editingAuthor.scenario)
    );
    if (existingAuthor) {
      toast.error('このシナリオの作者情報は既に登録されています');
      return;
    }

    const newAuthor = {
      scenario_title: authorForm.scenario,
      author: authorForm.author,
      email: authorForm.contactMethod === 'email' ? authorForm.email : '',
      discord_channel: authorForm.contactMethod === 'discord' ? authorForm.discordChannel : null,
      license_rate: authorForm.licenseRate,
      contact_method: authorForm.contactMethod
    };

    try {
      if (editingAuthor) {
        // 編集
        const existingDbAuthor = authorData.find(a => a.scenario_title === editingAuthor.scenario);
        if (existingDbAuthor) {
          await updateAuthor(existingDbAuthor.id, newAuthor);
        }

        addEditEntry({
          user: 'ま sui',
          action: 'update',
          target: `シナリオ作者: ${authorForm.scenario}`,
          summary: `作者情報を更新`,
          category: 'license',
          changes: [
            { field: '作者名', oldValue: editingAuthor.author, newValue: authorForm.author },
            { field: 'ライセンス料', oldValue: editingAuthor.licenseRate.toString(), newValue: authorForm.licenseRate.toString() }
          ]
        });

        toast.success('作者情報を更新しました');
      } else {
        // 新規追加
        await insertAuthor(newAuthor);

        addEditEntry({
          user: 'ま sui',
          action: 'create',
          target: `シナリオ作者: ${authorForm.scenario}`,
          summary: `新規作者情報を追加`,
          category: 'license',
          changes: [
            { field: '作者名', newValue: authorForm.author },
            { field: 'ライセンス料', newValue: authorForm.licenseRate.toString() },
            { field: '連絡方法', newValue: authorForm.contactMethod }
          ]
        });

        toast.success('作者情報を追加しました');
      }
    } catch (error) {
      console.error('作者情報の保存に失敗:', error);
      toast.error('作者情報の保存に失敗しました');
    }

    setIsAuthorDialogOpen(false);
  };

  // 作者削除
  const deleteAuthorData = async (scenario: string) => {
    try {
      const existingDbAuthor = authorData.find(a => a.scenario_title === scenario);
      if (existingDbAuthor) {
        await deleteAuthor(existingDbAuthor.id);
      }

      addEditEntry({
        user: 'ま sui',
        action: 'delete',
        target: `シナリオ作者: ${scenario}`,
        summary: `作者情報を削除`,
        category: 'license',
        changes: []
      });

      toast.success('作者情報を削除しました');
    } catch (error) {
      console.error('作者情報の削除に失敗:', error);
      toast.error('作者情報の削除に失敗しました');
    }
  };

  // 作者ごとのシナリオ作品数を計算
  const getAuthorScenarioCount = (authorName: string) => {
    return convertedAuthors.filter(author => author.author === authorName).length;
  };

  // 作者の月別公演回数を計算
  const getAuthorMonthlyUsage = (authorName: string, year: number, month: number) => {
    if (!Array.isArray(scheduleEvents)) return 0;
    
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // その作者のシナリオが使用された回数を計算
    const authorScenarios = convertedAuthors
      .filter(author => author.author === authorName)
      .map(author => author.scenario);
    
    const monthlyEvents = scheduleEvents.filter((event: any) => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && 
             eventDate <= endDate && 
             authorScenarios.includes(event.scenario) &&
             !event.is_cancelled; // 中止されたイベントを除外
    });
    
    return monthlyEvents.length;
  };

  // 作者のシナリオ別月別公演回数を計算
  const getAuthorScenarioUsage = (authorName: string, year: number, month: number) => {
    if (!Array.isArray(scheduleEvents)) return [];
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // その作者のシナリオが使用された回数をシナリオ別に集計
    const authorScenarios = convertedAuthors
      .filter(author => author.author === authorName)
      .map(author => author.scenario);
    
    const monthlyEvents = scheduleEvents.filter((event: any) => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && 
             eventDate <= endDate && 
             authorScenarios.includes(event.scenario) &&
             !event.is_cancelled; // 中止されたイベントを除外
    });
    
    // シナリオ別に集計
    const scenarioUsage = monthlyEvents.reduce((acc: { [scenario: string]: number }, event: any) => {
      const scenario = event.scenario;
      acc[scenario] = (acc[scenario] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(scenarioUsage).map(([scenario, count]) => ({
      scenario,
      count,
      licenseRate: convertedAuthors.find(a => a.scenario === scenario)?.licenseRate || 0,
      totalAmount: (convertedAuthors.find(a => a.scenario === scenario)?.licenseRate || 0) * count
    }));
  };

  // 作者リストの取得（重複を除去し、作品数と月別公演回数付き）
  const getAuthorsWithScenarioCount = (): AuthorSummary[] => {
    const uniqueAuthors = Array.from(new Set(convertedAuthors.map(a => a.author)));
    return uniqueAuthors.map(authorName => ({
      authorName,
      scenarioCount: getAuthorScenarioCount(authorName),
      scenarios: convertedAuthors.filter(a => a.author === authorName),
      monthlyUsage: getAuthorMonthlyUsage(authorName, selectedYear, selectedMonth),
      scenarioUsage: getAuthorScenarioUsage(authorName, selectedYear, selectedMonth)
    })).sort((a, b) => a.authorName.localeCompare(b.authorName));
  };

  // Error boundary for rendering
  try {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2>ライセンス管理</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openAuthorDialog()}
            >
              <FileText className="w-4 h-4 mr-2" />
              作者情報管理
            </Button>
          </div>
        </div>

        <Tabs defaultValue="calculation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calculation">月次計算</TabsTrigger>
            <TabsTrigger value="history">計算履歴</TabsTrigger>
            <TabsTrigger value="authors">作者管理</TabsTrigger>
          </TabsList>

          <TabsContent value="calculation" className="space-y-6">
            {/* 月選択 */}
            <Card>
              <CardHeader>
                <CardTitle>計算対象月選択</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="mt-6"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <Label>年</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(year => (
                          <SelectItem key={`year-${year}`} value={year.toString()}>
                            <span>{year}年</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>月</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={`month-${index + 1}`} value={(index + 1).toString()}>
                            <span>{month}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="mt-6"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button onClick={performCalculation} className="mt-6">
                    <Calculator className="w-4 h-4 mr-2" />
                    計算実行
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="notes">計算メモ（任意）</Label>
                  <Textarea
                    id="notes"
                    value={calculationNotes}
                    onChange={(e) => setCalculationNotes(e.target.value)}
                    placeholder="この月の特記事項やメモがあれば入力してください..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 計算結果 */}
            {currentCalculation && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {currentCalculation.year}年{currentCalculation.month}の使用状況
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={currentCalculation.status === 'sent' ? 'default' : 'secondary'}
                    >
                      {currentCalculation.status === 'calculated' && <Clock className="w-3 h-3 mr-1" />}
                      {currentCalculation.status === 'sent' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {currentCalculation.status === 'calculated' ? '計算済み' : '送信済み'}
                    </Badge>
                    {currentCalculation.status === 'calculated' && (
                      <Button 
                        onClick={() => confirmAndSend(currentCalculation)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        計算確定・送信
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>総公演数</Label>
                        <div className="text-2xl font-medium">{currentCalculation.totalEvents}件</div>
                      </div>
                      <div>
                        <Label>総ライセンス料</Label>
                        <div className="text-2xl font-medium text-green-600">
                          ¥{getTotalAmount(currentCalculation).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>シナリオ別使用回数</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>シナリオ名</TableHead>
                            <TableHead>使用回数</TableHead>
                            <TableHead>作者</TableHead>
                            <TableHead>単価</TableHead>
                            <TableHead>合計額</TableHead>
                            <TableHead>連絡方法</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(currentCalculation.scenarioUsage).map(([scenario, count]) => {
                            const author = convertedAuthors.find(a => a.scenario === scenario);
                            const amount = count * (author?.licenseRate || 0);
                            return (
                              <TableRow key={scenario}>
                                <TableCell>{scenario}</TableCell>
                                <TableCell>{count}回</TableCell>
                                <TableCell>{author?.author || '未設定'}</TableCell>
                                <TableCell>¥{(author?.licenseRate || 0).toLocaleString()}</TableCell>
                                <TableCell className="font-medium">¥{amount.toLocaleString()}</TableCell>
                                <TableCell>
                                  {author?.contactMethod === 'email' && (
                                    <Badge variant="outline">
                                      <Mail className="w-3 h-3 mr-1" />
                                      メール
                                    </Badge>
                                  )}
                                  {author?.contactMethod === 'discord' && (
                                    <Badge variant="outline">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Discord
                                    </Badge>
                                  )}
                                  {!author && (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      未設定
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {currentCalculation.notes && (
                      <div>
                        <Label>メモ</Label>
                        <div className="bg-muted p-3 rounded-md">
                          {currentCalculation.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>計算履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>対象月</TableHead>
                      <TableHead>総公演数</TableHead>
                      <TableHead>総ライセンス料</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>計算日時</TableHead>
                      <TableHead>送信日時</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {convertedCalculations
                      .sort((a, b) => b.year - a.year || b.id.localeCompare(a.id))
                      .map(calculation => (
                        <TableRow key={calculation.id}>
                          <TableCell>{calculation.year}年{calculation.month}</TableCell>
                          <TableCell>{calculation.totalEvents}件</TableCell>
                          <TableCell>¥{getTotalAmount(calculation).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={calculation.status === 'sent' ? 'default' : 'secondary'}
                            >
                              {calculation.status === 'calculated' && <Clock className="w-3 h-3 mr-1" />}
                              {calculation.status === 'sent' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {calculation.status === 'calculated' ? '計算済み' : '送信済み'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {calculation.calculatedAt?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell>
                            {calculation.sentAt?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell>
                            {calculation.status === 'calculated' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmAndSend(calculation)}
                              >
                                送信
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authors" className="space-y-6">
            {/* 作者サマリー */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      作者別サマリー
                    </CardTitle>
                    <Button 
                      onClick={() => openAuthorDialog()}
                      disabled
                      title="作者情報はシナリオ管理で管理されます"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新規作者追加（無効化）
                    </Button>
                  </div>
                  
                  {/* 月選択コントロール */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedMonth === 1) {
                          setSelectedYear(selectedYear - 1);
                          setSelectedMonth(12);
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="text-lg font-medium">
                      {selectedYear}年{monthNames[selectedMonth - 1]}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedMonth === 12) {
                          setSelectedYear(selectedYear + 1);
                          setSelectedMonth(1);
                        } else {
                          setSelectedMonth(selectedMonth + 1);
                        }
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">作者名</TableHead>
                        <TableHead className="w-48">シナリオ名</TableHead>
                        <TableHead className="w-24">公演回数</TableHead>
                        <TableHead className="w-32">ライセンス料</TableHead>
                        <TableHead className="w-32">合計金額</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {getAuthorsWithScenarioCount().map(authorSummary => {
                      const totalAmount = authorSummary.scenarioUsage.reduce((sum, s) => sum + s.totalAmount, 0);
                      
                      return (
                        <React.Fragment key={authorSummary.authorName}>
                          {/* 作者の基本情報行 */}
                          <TableRow className="bg-muted/50">
                            <TableCell rowSpan={authorSummary.scenarioUsage.length > 0 ? authorSummary.scenarioUsage.length + 1 : 1}>
                              <div className="font-medium">{authorSummary.authorName}</div>
                              <div className="text-sm text-muted-foreground">
                                {authorSummary.scenarioCount}作品・{authorSummary.monthlyUsage}回公演
                              </div>
                            </TableCell>
                            <TableCell colSpan={4} className="text-center font-medium">
                              合計: ¥{totalAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                          
                          {/* シナリオ別詳細行 */}
                          {authorSummary.scenarioUsage.length > 0 ? (
                            authorSummary.scenarioUsage.map((usage, index) => (
                              <TableRow key={`${authorSummary.authorName}-${usage.scenario}`}>
                                <TableCell>
                                  <div className="font-medium">{usage.scenario}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {usage.count}回
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">¥{usage.licenseRate.toLocaleString()}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">¥{usage.totalAmount.toLocaleString()}</div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                {selectedYear}年{monthNames[selectedMonth - 1]}の公演はありません
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>

        {/* 送信確認ダイアログ */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, calculation: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ライセンス料連絡の送信確認</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.calculation && (
                  <>
                    {confirmDialog.calculation.year}年{confirmDialog.calculation.month}のライセンス計算結果を
                    シナリオ作者へ送信します。送信後はステータスが「送信済み」に変更されます。
                    <br /><br />
                    送信対象: {Object.keys(confirmDialog.calculation.scenarioUsage).length}シナリオ
                    <br />
                    総ライセンス料: ¥{getTotalAmount(confirmDialog.calculation).toLocaleString()}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={executeSend}>送信実行</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 作者編集ダイアログ */}
        <Dialog open={isAuthorDialogOpen} onOpenChange={setIsAuthorDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAuthor ? 'シナリオ作者情報編集' : '新規シナリオ作者追加'}
              </DialogTitle>
              <DialogDescription>
                シナリオのライセンス料と作者の連絡先情報を管理します。
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario">シナリオ名</Label>
                {editingAuthor ? (
                  <Input 
                    id="scenario"
                    value={authorForm.scenario} 
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select value={authorForm.scenario} onValueChange={(value) => setAuthorForm({...authorForm, scenario: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="シナリオを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredScenarios
                        .filter(scenario => !convertedAuthors.find(a => a.scenario === scenario))
                        .map(scenario => (
                          <SelectItem key={scenario} value={scenario}>
                            {scenario}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="author">作者名</Label>
                <Input 
                  id="author"
                  value={authorForm.author} 
                  onChange={(e) => setAuthorForm({...authorForm, author: e.target.value})}
                  placeholder="作者名を入力してください"
                />
              </div>

              <div>
                <Label htmlFor="licenseRate">ライセンス料（1回あたり）</Label>
                <Input 
                  id="licenseRate"
                  type="number"
                  value={authorForm.licenseRate.toString()} 
                  onChange={(e) => setAuthorForm({...authorForm, licenseRate: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>連絡方法</Label>
                <Select value={authorForm.contactMethod} onValueChange={(value: 'email' | 'discord') => setAuthorForm({...authorForm, contactMethod: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">メール</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authorForm.contactMethod === 'email' && (
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={authorForm.email} 
                    onChange={(e) => setAuthorForm({...authorForm, email: e.target.value})}
                    placeholder="author@example.com"
                  />
                </div>
              )}

              {authorForm.contactMethod === 'discord' && (
                <div>
                  <Label htmlFor="discordChannel">Discordチャンネル</Label>
                  <Input 
                    id="discordChannel"
                    value={authorForm.discordChannel} 
                    onChange={(e) => setAuthorForm({...authorForm, discordChannel: e.target.value})}
                    placeholder="#scenario-authors"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAuthorDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={saveAuthor}>
                {editingAuthor ? '更新' : '追加'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  } catch (error) {
    console.error('ライセンス管理でエラーが発生しました:', error);
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              ライセンス管理の読み込み中にエラーが発生しました。
              <br />
              ページを再読み込みしてください。
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}