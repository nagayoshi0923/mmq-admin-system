import { useState, useMemo, useEffect } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
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
import { Calendar, FileText, Mail, MessageSquare, Calculator, CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Trash2, Plus, Edit2, BookOpen } from 'lucide-react';
import { useScenarios } from '../contexts/ScenarioContext';
import { useEditHistory } from '../contexts/EditHistoryContext';
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

interface AuthorSummary {
  authorName: string;
  scenarioCount: number;
  scenarios: ScenarioAuthor[];
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

  // 作者編集フォームの状態
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

  // usePersistedStateで統一されたLocalStorage操作
  const [calculations, setCalculations] = usePersistedState<LicenseCalculation[]>(
    'murder-mystery-license-calculations',
    [],
    {
      // 日付オブジェクトのシリアライズ/デシリアライズ
      deserialize: (value) => {
        const parsed = JSON.parse(value);
        return parsed.map((calc: any) => ({
          ...calc,
          calculatedAt: calc.calculatedAt ? new Date(calc.calculatedAt) : undefined,
          sentAt: calc.sentAt ? new Date(calc.sentAt) : undefined
        }));
      },
      onError: (error, operation) => {
        console.error(`ライセンス計算データの${operation === 'read' ? '読み込み' : '保存'}に失敗:`, error);
      }
    }
  );

  const [authorData, setAuthorData] = usePersistedState<ScenarioAuthor[]>(
    'murder-mystery-scenario-authors',
    mockScenarioAuthors,
    {
      onError: (error, operation) => {
        console.error(`シナリオ作者データの${operation === 'read' ? '読み込み' : '保存'}に失敗:`, error);
      }
    }
  );

  // スケジュールデータを取得
  const getScheduleData = (): { [key: string]: DaySchedule[] } => {
    const savedScheduleEvents = localStorage.getItem('murder-mystery-schedule-events');
    if (savedScheduleEvents) {
      try {
        return JSON.parse(savedScheduleEvents);
      } catch (error) {
        console.error('スケジュールデータの読み込みに失敗しました:', error);
      }
    }
    return {};
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
  const performCalculation = () => {
    const { scenarioUsage, totalEvents } = calculateMonthlyUsage(selectedYear, selectedMonth);
    
    const calculationId = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    const existingIndex = calculations.findIndex(calc => calc.id === calculationId);

    const newCalculation: LicenseCalculation = {
      id: calculationId,
      month: monthNames[selectedMonth - 1],
      year: selectedYear,
      scenarioUsage,
      status: 'calculated',
      calculatedAt: new Date(),
      totalEvents,
      notes: calculationNotes.trim() || undefined
    };

    if (existingIndex >= 0) {
      const updatedCalculations = [...calculations];
      updatedCalculations[existingIndex] = newCalculation;
      setCalculations(updatedCalculations);
    } else {
      setCalculations(prev => [...prev, newCalculation]);
    }

    // 編集履歴に追加
    addEditEntry({
      user: 'ま sui',
      action: existingIndex >= 0 ? 'update' : 'create',
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
      const author = authorData.find(a => a.scenario === scenario);
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
  const currentCalculation = calculations.find(calc => 
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
      const author = authorData.find(a => a.scenario === scenario);
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
  const saveAuthor = () => {
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
    const existingAuthor = authorData.find(a => 
      a.scenario === authorForm.scenario && 
      (!editingAuthor || a.scenario !== editingAuthor.scenario)
    );
    if (existingAuthor) {
      toast.error('このシナリオの作者情報は既に登録されています');
      return;
    }

    const newAuthor: ScenarioAuthor = {
      scenario: authorForm.scenario,
      author: authorForm.author,
      email: authorForm.contactMethod === 'email' ? authorForm.email : undefined,
      discordChannel: authorForm.contactMethod === 'discord' ? authorForm.discordChannel : undefined,
      licenseRate: authorForm.licenseRate,
      contactMethod: authorForm.contactMethod
    };

    if (editingAuthor) {
      // 編集
      const updatedAuthors = authorData.map(a => 
        a.scenario === editingAuthor.scenario ? newAuthor : a
      );
      setAuthorData(updatedAuthors);

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
      setAuthorData([...authorData, newAuthor]);

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

    setIsAuthorDialogOpen(false);
  };

  // 作者削除
  const deleteAuthor = (scenario: string) => {
    const updatedAuthors = authorData.filter(a => a.scenario !== scenario);
    setAuthorData(updatedAuthors);

    addEditEntry({
      user: 'ま sui',
      action: 'delete',
      target: `シナリオ作者: ${scenario}`,
      summary: `作者情報を削除`,
      category: 'license',
      changes: []
    });

    toast.success('作者情報を削除しました');
  };

  // 作者ごとのシナリオ作品数を計算
  const getAuthorScenarioCount = (authorName: string) => {
    return authorData.filter(author => author.author === authorName).length;
  };

  // 作者リストの取得（重複を除去し、作品数付き）
  const getAuthorsWithScenarioCount = (): AuthorSummary[] => {
    const uniqueAuthors = Array.from(new Set(authorData.map(a => a.author)));
    return uniqueAuthors.map(authorName => ({
      authorName,
      scenarioCount: getAuthorScenarioCount(authorName),
      scenarios: authorData.filter(a => a.author === authorName)
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
                            const author = authorData.find(a => a.scenario === scenario);
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
                    {calculations
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  作者別サマリー
                </CardTitle>
                <Button onClick={() => openAuthorDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  新規作者追加
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>作者名</TableHead>
                      <TableHead>作品数</TableHead>
                      <TableHead>平均ライセンス料</TableHead>
                      <TableHead>連絡方法</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAuthorsWithScenarioCount().map(authorSummary => {
                      const avgRate = Math.round(
                        authorSummary.scenarios.reduce((sum, s) => sum + s.licenseRate, 0) / authorSummary.scenarios.length
                      );
                      const primaryContact = authorSummary.scenarios[0]?.contactMethod;
                      
                      return (
                        <TableRow key={authorSummary.authorName}>
                          <TableCell>{authorSummary.authorName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {authorSummary.scenarioCount}作品
                            </Badge>
                          </TableCell>
                          <TableCell>¥{avgRate.toLocaleString()}</TableCell>
                          <TableCell>
                            {primaryContact === 'email' && (
                              <Badge variant="outline">
                                <Mail className="w-3 h-3 mr-1" />
                                メール
                              </Badge>
                            )}
                            {primaryContact === 'discord' && (
                              <Badge variant="outline">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Discord
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAuthorDialog(authorSummary.scenarios[0])}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 詳細シナリオ一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>シナリオ詳細一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>シナリオ名</TableHead>
                      <TableHead>作者名</TableHead>
                      <TableHead>ライセンス料</TableHead>
                      <TableHead>連絡方法</TableHead>
                      <TableHead>連絡先</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorData
                      .sort((a, b) => a.scenario.localeCompare(b.scenario))
                      .map(author => (
                        <TableRow key={author.scenario}>
                          <TableCell>{author.scenario}</TableCell>
                          <TableCell>{author.author}</TableCell>
                          <TableCell>{author.licenseRate.toLocaleString()}</TableCell>
                          <TableCell>
                            {author.contactMethod === 'email' && (
                              <Badge variant="outline">
                                <Mail className="w-3 h-3 mr-1" />
                                メール
                              </Badge>
                            )}
                            {author.contactMethod === 'discord' && (
                              <Badge variant="outline">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Discord
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            {author.contactMethod === 'email' ? author.email : author.discordChannel}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAuthorDialog(author)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAuthor(author.scenario)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
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
                        .filter(scenario => !authorData.find(a => a.scenario === scenario))
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