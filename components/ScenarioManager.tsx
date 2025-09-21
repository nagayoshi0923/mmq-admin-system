import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
// 最適化されたアイコンインポート
import Clock from 'lucide-react/dist/esm/icons/clock';
import Users from 'lucide-react/dist/esm/icons/users';
import Plus from 'lucide-react/dist/esm/icons/plus';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Star from 'lucide-react/dist/esm/icons/star';
import TestTube from 'lucide-react/dist/esm/icons/test-tube';
import Package from 'lucide-react/dist/esm/icons/package';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Cloud from 'lucide-react/dist/esm/icons/cloud';
import CloudOff from 'lucide-react/dist/esm/icons/cloud-off';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

import { useEditHistory } from '../contexts/EditHistoryContext';
import { useScenarios, Scenario } from '../contexts/ScenarioContext';
import { useStaff } from '../contexts/StaffContext';
import { useStores } from '../contexts/StoreContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabase } from '../contexts/SupabaseContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { SupabaseSyncIndicator } from './SupabaseSyncIndicator';
import { ScenarioDialog } from './ScenarioDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const difficultyLabels = {
  1: '初心者',
  2: '簡単',
  3: '普通',
  4: '難しい',
  5: '上級者'
};

const statusOptions = [
  { value: 'available', label: '公演中' },
  { value: 'maintenance', label: 'メンテナンス' },
  { value: 'retired', label: '公演終了' }
];

const difficultyColors = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800'
};

const statusColors = {
  'available': 'bg-green-100 text-green-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'retired': 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  'available': '利用可能',
  'maintenance': 'メンテナンス中',
  'retired': '引退'
};

// 時間変換ヘルパー関数
const formatDuration = (minutes: number): string => {
  const hours = minutes / 60;
  return `${hours}時間`;
};

// プレイ人数表示ヘルパー関数
const formatPlayerCount = (playerCount: { min: number; max: number } | undefined): string => {
  if (!playerCount) {
    return '1名'; // デフォルト値
  }
  if (playerCount.min === playerCount.max) {
    return `${playerCount.max}名`;
  }
  return `${playerCount.min}-${playerCount.max}名`;
};

// ライセンス料フォーマット関数
const formatLicenseAmount = (amount: number): string => {
  return `¥${amount.toLocaleString()}`;
};

// 現在の年月を取得（デフォルト値用）
const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// 日付フォーマット関数
const formatDate = (dateString?: string): string => {
  if (!dateString || dateString === 'unset') return '未設定';
  try {
    // YYYY-MM形式の場合
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = dateString.split('-');
      return `${year}年${parseInt(month)}月`;
    }
    // 従来のYYYY-MM-DD形式の場合
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  } catch (error) {
    return '未設定';
  }
};

// 公演回数はデータベースのplay_countカラムから取得するため、
// フロントエンドでの計算は不要になりました

const ItemType = 'SCENARIO_ROW';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableScenarioRowProps {
  index: number;
  scenario: Scenario;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  setSelectedScenario: (scenario: Scenario) => void;
  setIsEditDialogOpen: (open: boolean) => void;
}

function DraggableScenarioRow({ index, scenario, moveRow, children, setSelectedScenario, setIsEditDialogOpen }: DraggableScenarioRowProps) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: { type: ItemType, id: scenario.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item: DragItem) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Connect drag and drop to the ref
  drag(drop(ref));

  return (
    <TableRow 
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={isDragging ? 'cursor-grabbing' : ''}
    >
      {children}
    </TableRow>
  );
}

export const ScenarioManager = React.memo(() => {
  const { scenarios, updateScenario, removeScenario, updateScenarios } = useScenarios();
  const { staff } = useStaff();
  const { stores, getKitsByScenario } = useStores();
  const { addEditEntry } = useEditHistory();
  const { isConnected } = useSupabase();
  const { events: scheduleEvents } = useSchedule();
  
  // Supabaseからのリアルタイムデータ取得
  const { 
    data: supabaseScenarios, 
    loading: supabaseLoading, 
    error: supabaseError,
    refetch: refetchSupabaseData,
    insert: addScenarioToSupabase,
    update: updateScenarioInSupabase,
    delete: deleteScenario
  } = useSupabaseData<Scenario>({
    table: 'scenarios',
    realtime: true,
    fallbackKey: 'murder-mystery-scenarios'
  });
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [viewScenario, setViewScenario] = useState<Scenario | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // ソート状態の管理
  const [sortField, setSortField] = useState<keyof Scenario | 'playCount' | 'roi' | 'paybackPeriod' | 'profitMargin' | 'revenuePerPlay' | 'costPerPlay' | 'totalRevenue' | 'totalCost' | 'finalProfit' | 'recoveryRate' | 'gmFee' | 'miscellaneousExpenses' | 'licenseAmount' | 'propsCost' | 'productionCost' | 'grossProfit' | 'recoverySpeed' | 'recoveryStatus' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 回収期間設定（月単位）
  const [paybackPeriodMonths, setPaybackPeriodMonths] = useState(12);


  // シナリオ保存関数
  const handleSaveScenario = async (scenarioData: Scenario) => {
    console.log('handleSaveScenario呼び出し:', scenarioData);
    const dataSource = supabaseScenarios || scenarios;
    const existingScenario = dataSource.find(s => s.id === scenarioData.id);
    console.log('既存シナリオ:', existingScenario);
    
    // データベースに存在するカラムのみで保存データを構築
    const cleanedData = {
      title: scenarioData.title,
      description: scenarioData.description || '',
      author: scenarioData.author || '',
      duration: scenarioData.duration || 0,
      player_count_min: scenarioData.playerCount?.min || 3,
      player_count_max: scenarioData.playerCount?.max || 6,
      difficulty: scenarioData.difficulty || 1,
      rating: scenarioData.rating || 0,
      play_count: scenarioData.playCount || 0,
      status: scenarioData.status || 'available',
      required_props: scenarioData.requiredProps || [],
      props: scenarioData.props || [],
      genre: scenarioData.genre || [],
      production_cost: scenarioData.productionCost || 0,
      revenue: scenarioData.revenue || 0,
      gm_fee: scenarioData.gmFee || 0,
      miscellaneous_expenses: scenarioData.miscellaneousExpenses || 0,
      license_rate_override: scenarioData.licenseRateOverride || 0,
      has_pre_reading: scenarioData.hasPreReading || false,
      release_date: scenarioData.releaseDate || null,
      notes: scenarioData.notes || '',
      participation_fee: scenarioData.participationFee || 0,
      license_amount: scenarioData.licenseAmount || 0
    };
    
    try {
      if (existingScenario) {
        // 更新
        console.log('シナリオ更新開始');
        const result = await updateScenarioInSupabase(scenarioData.id, cleanedData as any);
        console.log('シナリオ更新結果:', result);
        if (result.error) {
          console.error('シナリオ更新エラー:', result.error);
          return;
        }
        
        // 編集履歴に追加
        addEditEntry({
          user: 'ユーザー',
          action: 'update',
          target: `${scenarioData.title}`,
          summary: `シナリオを更新：${scenarioData.title}`,
          category: 'scenario',
          changes: [
            { field: '全般', newValue: '情報が更新されました' }
          ]
        });
      } else {
        // 新規追加
        console.log('シナリオ新規追加開始');
        const result = await addScenarioToSupabase(cleanedData as any);
        console.log('シナリオ新規追加結果:', result);
        if (result.error) {
          console.error('シナリオ追加エラー:', result.error);
          return;
        }
        
        // 編集履歴に追加
        addEditEntry({
          user: 'ユーザー',
          action: 'create',
          target: scenarioData.title,
          summary: `新規シナリオを追加：${scenarioData.title}（${scenarioData.duration}分・${difficultyLabels[scenarioData.difficulty]}）`,
          category: 'scenario',
          changes: [
            { field: 'タイトル', newValue: scenarioData.title },
            { field: '所要時間', newValue: `${scenarioData.duration}分` },
            { field: '難易度', newValue: difficultyLabels[scenarioData.difficulty] },
            { field: 'ジャンル', newValue: Array.isArray(scenarioData.genre) ? scenarioData.genre.join(', ') : '' }
          ]
        });
      }
    } catch (error) {
      console.error('シナリオ保存エラー:', error);
    }
  };

  // 削除処理関数
  const handleDeleteScenario = async (scenario: Scenario) => {
    try {
      const result = await deleteScenario(scenario.id);
      if (result.error) {
        console.error('シナリオ削除エラー:', result.error);
        return;
      }
      
      // 編集履歴に追加
      addEditEntry({
        user: 'ユーザー',
        action: 'delete',
        target: `${scenario.title} - シナリオ削除`,
        summary: `シナリオを削除：${scenario.title}`,
        category: 'scenario',
        changes: [
          { field: 'タイトル', oldValue: scenario.title, newValue: '削除済み' },
          { field: 'ステータス', oldValue: scenario.status, newValue: '削除済み' }
        ]
      });
    } catch (error) {
      console.error('シナリオ削除エラー:', error);
    }
  };

  // ソート処理関数
  const handleSort = (field: keyof Scenario | 'playCount' | 'roi' | 'paybackPeriod' | 'profitMargin' | 'revenuePerPlay' | 'costPerPlay' | 'totalRevenue' | 'totalCost' | 'finalProfit' | 'recoveryRate' | 'gmFee' | 'miscellaneousExpenses' | 'licenseAmount' | 'propsCost' | 'productionCost' | 'grossProfit' | 'recoverySpeed' | 'recoveryStatus') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // スケジュールイベントからシナリオの実際の公演回数を計算する関数
  const calculateActualPlayCount = (scenarioTitle: string): number => {
    if (!scheduleEvents || !Array.isArray(scheduleEvents)) return 0;
    
    return scheduleEvents.filter(event => 
      event.scenario === scenarioTitle && 
      !event.is_cancelled
    ).length;
  };

  // 経理分析用の計算関数
  const calculateFinancialMetrics = (scenario: Scenario) => {
    const playCount = scenario.playCount || 0;
    const productionCost = scenario.productionCost || 0;
    const participationFee = scenario.participationFee || 0;
    const maxPlayers = scenario.playerCount?.max || 0;
    const gmFee = scenario.gmFee || 0;
    const miscellaneousExpenses = scenario.miscellaneousExpenses || 0;

    // 売上計算
    const revenuePerPlay = maxPlayers * participationFee;
    const totalRevenue = revenuePerPlay * playCount;

    // 道具のコスト計算
    const perPlayPropsCost = scenario.props ? scenario.props
      .filter(prop => prop.costType === 'per_play')
      .reduce((sum, prop) => sum + prop.cost, 0) : 0;
    
    const oneTimePropsCost = scenario.props ? scenario.props
      .filter(prop => prop.costType === 'one_time')
      .reduce((sum, prop) => sum + prop.cost, 0) : 0;

    // 制作費に1度きりの道具コストを含める
    const totalProductionCost = productionCost + oneTimePropsCost;
    
    // コスト計算（ライセンス料と毎回の道具コストも含める）
    const licenseAmount = scenario.licenseAmount || 0;
    const costPerPlay = gmFee + miscellaneousExpenses + licenseAmount + perPlayPropsCost;
    const totalCost = costPerPlay * playCount + totalProductionCost;

    // 利益計算
    const finalProfit = totalRevenue - totalCost;

    // ROI計算（制作費 + 1度きり道具コスト）
    const roi = totalProductionCost > 0 ? (finalProfit / totalProductionCost) * 100 : 0;

    // 回収回数計算（1回あたりの純利益は既にライセンス料込みのcostPerPlayを使用）
    const profitPerPlay = revenuePerPlay - costPerPlay;
    const paybackPeriod = profitPerPlay > 0 ? Math.ceil(totalProductionCost / profitPerPlay) : Infinity;
    

    // 純利益率計算
    const profitMargin = totalRevenue > 0 ? (finalProfit / totalRevenue) * 100 : 0;

    // 回収率計算（総収益 ÷ 制作費 × 100）
    const recoveryRate = totalProductionCost > 0 ? (totalRevenue / totalProductionCost) * 100 : 0;

    return {
      revenuePerPlay,
      totalRevenue,
      costPerPlay,
      totalCost,
      finalProfit,
      roi: Math.round(roi * 10) / 10,
      paybackPeriod: paybackPeriod === Infinity ? '未回収' : `${paybackPeriod}回`,
      profitMargin: Math.round(profitMargin * 10) / 10,
      recoveryRate: Math.round(recoveryRate * 10) / 10
    };
  };

  // 回収指標の計算関数
  const calculateRecoveryMetrics = (scenario: Scenario) => {
    const releaseDate = scenario.releaseDate;
    
    if (!releaseDate) {
      return {
        recoverySpeedScore: null,
        timelineStatus: 'リリース日未設定',
        recoveryStatus: 'unknown',
        monthsElapsed: 0,
        remainingMonths: null,
        remainingDays: null,
        progressPercentage: 0
      };
    }

    const release = new Date(releaseDate);
    const now = new Date();
    
    // 日付が有効かチェック
    if (isNaN(release.getTime())) {
      return {
        recoverySpeedScore: null,
        timelineStatus: '無効なリリース日',
        recoveryStatus: 'unknown',
        monthsElapsed: 0,
        remainingMonths: null,
        remainingDays: null,
        progressPercentage: 0
      };
    }
    
    const daysElapsed = Math.floor((now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24)); // 日数
    
    // 未来の日付の場合は0日経過として扱う
    const actualDaysElapsed = Math.max(0, daysElapsed);

    const metrics = calculateFinancialMetrics(scenario);
    const paybackPeriodPlays = metrics.paybackPeriod === '未回収' ? Infinity : parseInt(metrics.paybackPeriod.replace('回', ''));

    if (paybackPeriodPlays === Infinity) {
      return {
        recoverySpeedScore: null,
        timelineStatus: '回収不可',
        recoveryStatus: 'unrecoverable',
        monthsElapsed: 0,
        remainingMonths: null,
        remainingDays: null,
        progressPercentage: 0
      };
    }

    // 回収日を設定（デフォルトでリリースから1年後）
    const recoveryDate = new Date(release);
    recoveryDate.setFullYear(recoveryDate.getFullYear() + 1); // 1年後
    
    // 回収日までの総日数
    const totalRecoveryDays = Math.floor((recoveryDate.getTime() - release.getTime()) / (1000 * 60 * 60 * 24));
    
    // 回収日までの残り日数（負の値は超過日数を表す）
    const remainingDays = Math.floor((recoveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // 進捗率の計算（経過日数 ÷ 総回収期間）
    const progressPercentage = Math.min(100, Math.max(0, (actualDaysElapsed / totalRecoveryDays) * 100));
    
    // 速度スコア（進捗率に基づく）
    const recoverySpeedScore = actualDaysElapsed > 0 ? actualDaysElapsed / totalRecoveryDays : null;
    
    let timelineStatus = '';
    let recoveryStatus = '';

    if (remainingDays === 0) {
      timelineStatus = '回収完了';
      recoveryStatus = 'completed';
    } else if (recoverySpeedScore !== null) {
      const remainingDaysText = remainingDays > 0 
        ? (remainingDays >= 30 ? `${Math.floor(remainingDays / 30)}ヶ月${remainingDays % 30}日` : `${remainingDays}日`)
        : remainingDays === 0 
        ? '今日' 
        : `${Math.abs(remainingDays)}日超過`;
      
      // 回収率が100%を超えている場合は回収状況を緩和
      const metrics = calculateFinancialMetrics(scenario);
      const isProfitable = metrics.recoveryRate >= 100;
      
      if (recoverySpeedScore < 0.5) {
        timelineStatus = `優秀 (${remainingDaysText}残り)`;
        recoveryStatus = 'excellent';
      } else if (recoverySpeedScore < 0.75) {
        timelineStatus = `良好 (${remainingDaysText}残り)`;
        recoveryStatus = 'good';
      } else if (recoverySpeedScore < 1.0) {
        timelineStatus = `普通 (${remainingDaysText}残り)`;
        recoveryStatus = 'average';
      } else if (recoverySpeedScore < 1.5 && isProfitable) {
        // 回収率100%以上で速度が1.5未満の場合は「普通」に格上げ
        timelineStatus = `普通 (${remainingDaysText}残り)`;
        recoveryStatus = 'average';
      } else {
        timelineStatus = `要改善 (${remainingDaysText}残り)`;
        recoveryStatus = 'poor';
      }
    } else {
      const remainingDaysText = remainingDays > 0 
        ? (remainingDays >= 30 ? `${Math.floor(remainingDays / 30)}ヶ月${remainingDays % 30}日` : `${remainingDays}日`)
        : remainingDays === 0 
        ? '今日' 
        : `${Math.abs(remainingDays)}日超過`;
      timelineStatus = remainingDays > 0 ? `回収予定まで${remainingDaysText}` : 
                      remainingDays === 0 ? '回収予定日' : 
                      `回収予定から${Math.abs(remainingDays)}日超過`;
      recoveryStatus = 'pending';
    }

    return {
      recoverySpeedScore: recoverySpeedScore ? Math.round(recoverySpeedScore * 100) / 100 : null,
      timelineStatus,
      recoveryStatus,
      monthsElapsed: Math.floor(actualDaysElapsed / 30), // 日数を月数に変換して表示
      remainingMonths: Math.floor(remainingDays / 30), // 残り日数を月数に変換して表示
      remainingDays: remainingDays, // 残り日数（日単位）
      progressPercentage: Math.round(progressPercentage * 10) / 10 // 進捗率（小数点第1位まで）
    };
  };

  // データベースのカラム名をフロントエンドの形式に変換する関数
  const transformDatabaseToFrontend = (dbScenario: any): Scenario => {
    return {
      id: dbScenario.id,
      title: dbScenario.title,
      description: dbScenario.description || '',
      author: dbScenario.author || '',
      duration: dbScenario.duration || 0,
      playerCount: {
        min: dbScenario.player_count_min || 3,
        max: dbScenario.player_count_max || 6
      },
      difficulty: dbScenario.difficulty || 1,
      rating: dbScenario.rating || 0,
      playCount: dbScenario.play_count || 0,
      status: dbScenario.status || 'available',
      requiredProps: dbScenario.required_props || [],
      props: dbScenario.props || [],
      genre: dbScenario.genre || [],
      productionCost: dbScenario.production_cost || 0,
      revenue: dbScenario.revenue || 0,
      gmFee: dbScenario.gm_fee || 0,
      miscellaneousExpenses: dbScenario.miscellaneous_expenses || 0,
      licenseRateOverride: dbScenario.license_rate_override || 0,
      hasPreReading: dbScenario.has_pre_reading || false,
      releaseDate: dbScenario.release_date || '',
      notes: dbScenario.notes || '',
      participationFee: dbScenario.participation_fee || 0,
      licenseAmount: dbScenario.license_amount || 0,
      availableGMs: [] // データベースに存在しないため空配列
    };
  };

  // シナリオリスト（Supabaseから取得したデータを使用）
  const scenariosWithPlayCount = useMemo(() => {
    const dataSource = supabaseScenarios || scenarios;
    if (!Array.isArray(dataSource)) return [];
    
    return dataSource.map(scenario => {
      // Supabaseから取得したデータの場合は変換を適用
      if (supabaseScenarios && supabaseScenarios.includes(scenario)) {
        const transformedScenario = transformDatabaseToFrontend(scenario);
        // 実際の公演回数を計算して上書き
        return {
          ...transformedScenario,
          playCount: calculateActualPlayCount(transformedScenario.title)
        };
      }
      // Contextから取得したデータの場合は実際の公演回数を計算
      return {
        ...scenario,
        playCount: calculateActualPlayCount(scenario.title)
      };
    });
  }, [supabaseScenarios, scenarios, scheduleEvents]);

  // ソートされたシナリオリスト（安全な配列処理）
  const sortedScenarios = Array.isArray(scenariosWithPlayCount) ? [...scenariosWithPlayCount].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any;
    let bValue: any;
    
    if (sortField === 'playCount') {
      aValue = a.playCount || 0;
      bValue = b.playCount || 0;
    } else if (sortField === 'roi') {
      aValue = calculateFinancialMetrics(a).roi;
      bValue = calculateFinancialMetrics(b).roi;
    } else if (sortField === 'paybackPeriod') {
      const aPayback = calculateFinancialMetrics(a).paybackPeriod;
      const bPayback = calculateFinancialMetrics(b).paybackPeriod;
      aValue = aPayback === '未回収' ? Infinity : parseInt(aPayback.replace('回', ''));
      bValue = bPayback === '未回収' ? Infinity : parseInt(bPayback.replace('回', ''));
        } else if (sortField === 'profitMargin') {
          aValue = calculateFinancialMetrics(a).profitMargin;
          bValue = calculateFinancialMetrics(b).profitMargin;
        } else if (sortField === 'revenuePerPlay') {
          aValue = calculateFinancialMetrics(a).revenuePerPlay;
          bValue = calculateFinancialMetrics(b).revenuePerPlay;
        } else if (sortField === 'costPerPlay') {
          aValue = calculateFinancialMetrics(a).costPerPlay;
          bValue = calculateFinancialMetrics(b).costPerPlay;
        } else if (sortField === 'totalRevenue') {
          aValue = calculateFinancialMetrics(a).totalRevenue;
          bValue = calculateFinancialMetrics(b).totalRevenue;
        } else if (sortField === 'totalCost') {
          aValue = calculateFinancialMetrics(a).totalCost;
          bValue = calculateFinancialMetrics(b).totalCost;
        } else if (sortField === 'finalProfit') {
          aValue = calculateFinancialMetrics(a).finalProfit;
          bValue = calculateFinancialMetrics(b).finalProfit;
        } else if (sortField === 'recoveryRate') {
          aValue = calculateFinancialMetrics(a).recoveryRate;
          bValue = calculateFinancialMetrics(b).recoveryRate;
        } else if (sortField === 'gmFee') {
          aValue = a.gmFee || 0;
          bValue = b.gmFee || 0;
        } else if (sortField === 'miscellaneousExpenses') {
          aValue = a.miscellaneousExpenses || 0;
          bValue = b.miscellaneousExpenses || 0;
        } else if (sortField === 'licenseAmount') {
          aValue = a.licenseAmount || 0;
          bValue = b.licenseAmount || 0;
        } else if (sortField === 'propsCost') {
          aValue = a.props ? a.props.reduce((sum, prop) => sum + prop.cost, 0) : 0;
          bValue = b.props ? b.props.reduce((sum, prop) => sum + prop.cost, 0) : 0;
        } else if (sortField === 'productionCost') {
          const aOneTimePropsCost = a.props ? a.props
            .filter(prop => prop.costType === 'one_time')
            .reduce((sum, prop) => sum + prop.cost, 0) : 0;
          const bOneTimePropsCost = b.props ? b.props
            .filter(prop => prop.costType === 'one_time')
            .reduce((sum, prop) => sum + prop.cost, 0) : 0;
          aValue = (a.productionCost || 0) + aOneTimePropsCost;
          bValue = (b.productionCost || 0) + bOneTimePropsCost;
        } else if (sortField === 'grossProfit') {
          const aMetrics = calculateFinancialMetrics(a);
          const bMetrics = calculateFinancialMetrics(b);
          aValue = aMetrics.revenuePerPlay - aMetrics.costPerPlay;
          bValue = bMetrics.revenuePerPlay - bMetrics.costPerPlay;
        } else if (sortField === 'recoverySpeed') {
          const aRecovery = calculateRecoveryMetrics(a);
          const bRecovery = calculateRecoveryMetrics(b);
          aValue = aRecovery.recoverySpeedScore || 0;
          bValue = bRecovery.recoverySpeedScore || 0;
        } else if (sortField === 'recoveryStatus') {
          const aRecovery = calculateRecoveryMetrics(a);
          const bRecovery = calculateRecoveryMetrics(b);
          // ステータスの優先順位で並び替え
          const statusOrder = { 'completed': 0, 'excellent': 1, 'good': 2, 'average': 3, 'poor': 4, 'pending': 5, 'unrecoverable': 6, 'unknown': 7 };
          aValue = statusOrder[aRecovery.recoveryStatus as keyof typeof statusOrder] || 7;
          bValue = statusOrder[bRecovery.recoveryStatus as keyof typeof statusOrder] || 7;
        } else if (sortField === 'playerCount') {
      aValue = a.playerCount?.min || 0;
      bValue = b.playerCount?.min || 0;
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
      
      // 配列の場合は長さで比較
      if (Array.isArray(aValue)) aValue = aValue.length;
      if (Array.isArray(bValue)) bValue = bValue.length;
      
      // 文字列の場合は大文字小文字を無視して比較
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  }) : [];

  // ソートアイコンの表示
  const getSortIcon = (field: keyof Scenario | 'playCount' | 'roi' | 'paybackPeriod' | 'profitMargin' | 'revenuePerPlay' | 'costPerPlay' | 'totalRevenue' | 'totalCost' | 'finalProfit' | 'recoveryRate' | 'gmFee' | 'miscellaneousExpenses' | 'licenseAmount' | 'propsCost' | 'productionCost' | 'grossProfit' | 'recoverySpeed' | 'recoveryStatus') => {
    // 矢印は表示しない
    return null;
  };

  // GM可能なスタッフを取得（GMまたはマネージャーの役割を持つスタッフ）
  const availableGMStaff = staff.filter(s => 
    s.status === 'active' && 
    (s.role.includes('GM') || s.role.includes('マネージャー'))
  );

  // シナリオのキット情報を取得するヘルパー関数
  const getScenarioKitInfo = useCallback((scenarioId: string) => {
    const kitsByStore = getKitsByScenario(scenarioId);
    const totalKits = kitsByStore.reduce((sum, entry) => sum + entry.kits.length, 0);
    return {
      totalKits,
      kitsByStore
    };
  }, [getKitsByScenario, stores]);











  // 作者ごとのシナリオ数を取得
  const getAuthorScenarioCount = (authorName: string) => {
    const dataSource = supabaseScenarios || scenarios;
    return dataSource.filter(s => s.author === authorName).length;
  };

  // 作者一覧を取得（重複なし）
  const uniqueAuthors = Array.from(new Set((supabaseScenarios || scenarios).map(s => s.author)));

  // ローディング状態の表示
  if (supabaseLoading) {
        return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>シナリオデータを読み込み中...</span>
          </div>
        );
    }

  // エラー状態の表示
  if (supabaseError) {
        return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <CloudOff className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-2">データの読み込みに失敗しました</p>
          <Button onClick={refetchSupabaseData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            再試行
          </Button>
            </div>
          </div>
        );
  }

  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>シナリオ管理</h2>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Cloud className="w-4 h-4 text-green-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Supabase接続中' : 'Supabase未接続'}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('=== 双方向連携テスト ===');
                  const dataSource = supabaseScenarios || scenarios;
                  console.log('現在のシナリオ数:', dataSource.length);
                  console.log('Supabaseデータ:', supabaseScenarios?.length || 0);
                  console.log('Contextデータ:', scenarios.length);
                  dataSource.forEach(scenario => {
                    console.log(`シナリオ「${scenario.title}」のGM:`, scenario.availableGMs);
                  });
                }}
              >
                <TestTube className="w-4 h-4 mr-2" />
                連携テスト
              </Button>
              <ScenarioDialog
                onSave={handleSaveScenario}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新しいシナリオを追加
                  </Button>
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">総シナリオ数</p>
                    <p className="text-lg">{(supabaseScenarios || scenarios).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">総プレイ回数</p>
                    <p className="text-lg">{(supabaseScenarios || scenarios).reduce((sum, s) => sum + (s.playCount || 0), 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">作者数</p>
                    <p className="text-lg">{uniqueAuthors.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 計算方法の説明 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">収益計算の方法</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {/* 基本計算 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-1">売上</h4>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div><strong>売上/回</strong>: 最大参加人数 × 参加費</div>
                      <div><strong>売上累計</strong>: 売上/回 × 累計公演数</div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-700 mb-1">コスト</h4>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div><strong>コスト/回</strong>: GM代 + 雑費 + ライセンス料 + 毎回道具コスト</div>
                      <div><strong>制作費</strong>: 基本制作費 + 1度きり道具コスト</div>
                      <div><strong>コスト累計</strong>: (GM代 + 雑費 + ライセンス料 + 毎回道具コスト) × 累計公演数 + 制作費</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-700 mb-1">利益</h4>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div><strong>粗利/回</strong>: 売上/回 - コスト/回</div>
                      <div><strong>最終純利益</strong>: 売上累計 - コスト累計</div>
                    </div>
                  </div>
                </div>

                {/* 分析指標 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-purple-700 mb-2">収益性分析</h4>
                    <div className="text-xs space-y-1">
                      <div><strong>ROI率</strong>: (最終純利益 ÷ 制作費) × 100</div>
                      <div className="ml-2 text-gray-600">🟢 100%以上: 黒字 | 🟡 50-100%: 回収中 | 🔴 50%未満: 赤字</div>
                      <div><strong>回収回数</strong>: 制作費を回収するのに必要な公演回数</div>
                      <div className="ml-2 text-gray-600">🟢 10回以下: 優秀 | 🟡 10-20回: 普通 | 🔴 20回以上: 要改善</div>
                      <div><strong>純利益率</strong>: (最終純利益 ÷ 売上累計) × 100</div>
                      <div className="ml-2 text-gray-600">🟢 20%以上: 高収益 | 🟡 10-20%: 普通 | 🔴 10%未満: 低収益</div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-orange-700 mb-2">回収分析</h4>
                    <div className="text-xs space-y-1">
                      <div><strong>回収率</strong>: 総収益 ÷ 制作費 × 100</div>
                      <div className="ml-2 text-gray-600">🟢 100%以上: 完全回収 | 🟡 50-100%: 部分回収 | 🔴 50%未満: 未回収</div>
                      <div><strong>残数</strong>: 回収日までの残り日数</div>
                      <div className="ml-2 text-gray-600">📅 リリース日から1年後の回収日までの残り日数</div>
                      <div><strong>時系列回収状況</strong>: 速度に基づく評価</div>
                      <div className="ml-2 text-gray-600">🟢 完了/優秀 | 🟡 良好/普通 | 🔴 要改善 | ⚫ 不可</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>シナリオ一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">基本情報</TabsTrigger>
                  <TabsTrigger value="management">管理情報</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        タイトル
                        {getSortIcon('title')}
                      </div>
                    </TableHead>
                    <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 w-[100px]"
                      onClick={() => handleSort('author')}
                    >
                      <div className="flex items-center gap-2">
                            作者
                        {getSortIcon('author')}
                      </div>
                    </TableHead>
                    <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 w-[100px]"
                      onClick={() => handleSort('releaseDate')}
                    >
                      <div className="flex items-center gap-2">
                            公開日
                        {getSortIcon('releaseDate')}
                      </div>
                    </TableHead>
                    <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 w-[100px]"
                      onClick={() => handleSort('playerCount')}
                    >
                      <div className="flex items-center gap-2">
                            人数
                        {getSortIcon('playerCount')}
                      </div>
                    </TableHead>
                    <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 w-[100px]"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center gap-2">
                        所要時間
                        {getSortIcon('duration')}
                      </div>
                    </TableHead>
                    <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 w-[100px]"
                      onClick={() => handleSort('participationFee')}
                    >
                      <div className="flex items-center gap-2">
                            参加費
                        {getSortIcon('participationFee')}
                      </div>
                    </TableHead>
                        <TableHead className="w-[100px]">キット</TableHead>
                        <TableHead className="w-[200px]">対応GM</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScenarios.map((scenario, index) => {
                    const kitInfo = getScenarioKitInfo(scenario.id);
                    const moveRow = (dragIndex: number, hoverIndex: number) => {
                      const newScenarios = [...sortedScenarios];
                      const draggedScenario = newScenarios[dragIndex];
                      newScenarios.splice(dragIndex, 1);
                      newScenarios.splice(hoverIndex, 0, draggedScenario);
                      updateScenarios(newScenarios);
                    };

                    return (
                      <DraggableScenarioRow
                        key={scenario.id}
                        index={index}
                        scenario={scenario}
                        moveRow={moveRow}
                        setSelectedScenario={setSelectedScenario}
                        setIsEditDialogOpen={setIsEditDialogOpen}
                      >
                        {/* タイトル */}
                        <TableCell>
                          <div className="max-w-xs">
                            <p 
                              className="text-sm truncate cursor-pointer hover:text-blue-600 hover:underline"
                              onClick={() => {
                                setViewScenario(scenario);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              {scenario.title}
                            </p>
                          </div>
                        </TableCell>

                        {/* 作者名 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px]">
                                <span className="text-sm truncate block">{scenario.author}</span>
                          </div>
                        </TableCell>

                            {/* 公開日 */}
                            <TableCell className="w-[100px]">
                              <span className="text-sm">
                            {scenario.releaseDate ? new Date(scenario.releaseDate).toLocaleDateString('ja-JP') : '未設定'}
                          </span>
                        </TableCell>

                            {/* 人数 */}
                            <TableCell className="w-[100px]">
                          <div className="flex items-center gap-1 justify-end">
                            <Users className="w-3 h-3" />
                                <span className="text-sm">{formatPlayerCount(scenario.playerCount)}</span>
                          </div>
                        </TableCell>

                        {/* 所要時間 */}
                            <TableCell className="w-[100px]">
                          <div className="flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                                <span className="text-sm">{formatDuration(scenario.duration)}</span>
                          </div>
                        </TableCell>

                        {/* 参加費 */}
                        <TableCell className="w-[100px]">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-sm">
                              {scenario.participationFee ? `¥${scenario.participationFee.toLocaleString()}` : '未設定'}
                            </span>
                          </div>
                        </TableCell>

                        {/* キット */}
                            <TableCell className="w-[100px]">
                          {kitInfo.totalKits > 0 ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 justify-end">
                                  <Package className="w-3 h-3 text-blue-500" />
                                      <span className="text-sm">{kitInfo.totalKits}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {kitInfo.kitsByStore.map((entry) => (
                                        <div key={entry.storeId} className="text-sm">
                                      {entry.storeName}: {entry.kits.length}キット
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                                <span className="text-muted-foreground text-sm">なし</span>
                          )}
                        </TableCell>

                            {/* 対応GM */}
                            <TableCell className="w-[200px]">
                              <div className="flex flex-wrap gap-1">
                                {scenario.availableGMs && scenario.availableGMs.length > 0 ? (
                                  scenario.availableGMs.map((gm) => (
                                    <Badge key={gm} variant="outline" className="text-xs">
                                      {gm}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">未設定</span>
                                )}
                              </div>
                        </TableCell>

                        {/* 操作 */}
                        <TableCell>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedScenario(scenario);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>編集</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                      </DraggableScenarioRow>
                    );
                  })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="management">
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-300">
                        <TableHead className="border-r border-gray-300">タイトル</TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'playCount' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'playCount' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('playCount')}
                        >
                          <div className="flex items-center gap-2" style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">公演数</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'revenuePerPlay' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'revenuePerPlay' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('revenuePerPlay')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">売上/回</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'gmFee' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'gmFee' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('gmFee')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">GM代/回</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'licenseAmount' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'licenseAmount' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('licenseAmount')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">ライセンス</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'propsCost' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'propsCost' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('propsCost')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">道具</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'productionCost' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'productionCost' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('productionCost')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">制作費合計</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'costPerPlay' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'costPerPlay' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('costPerPlay')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">コスト/回</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'grossProfit' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'grossProfit' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('grossProfit')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">粗利/回</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'totalRevenue' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'totalRevenue' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('totalRevenue')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">売上累計</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'totalCost' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'totalCost' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('totalCost')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">コスト累計</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'finalProfit' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'finalProfit' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('finalProfit')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">最終純利益</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'roi' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'roi' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('roi')}
                        >
                          <div className="flex items-center gap-2" style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">ROI</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'paybackPeriod' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'paybackPeriod' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('paybackPeriod')}
                        >
                          <div className="flex items-center gap-2" style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">回収回数</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'profitMargin' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'profitMargin' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('profitMargin')}
                        >
                          <div className="flex items-center gap-2" style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">純利%</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'recoveryRate' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'recoveryRate' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('recoveryRate')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">回収率</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '80px',
                            borderTop: sortField === 'recoverySpeed' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'recoverySpeed' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('recoverySpeed')}
                        >
                          <div style={{ width: '80px', overflow: 'hidden' }}>
                            <span className="truncate">残数</span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 border-r border-gray-300"
                          style={{ 
                            width: '60px',
                            borderTop: sortField === 'recoveryStatus' && sortDirection === 'asc' ? '3px solid #374151' : '1px solid #d1d5db',
                            borderBottom: sortField === 'recoveryStatus' && sortDirection === 'desc' ? '3px solid #374151' : '1px solid #d1d5db'
                          }}
                          onClick={() => handleSort('recoveryStatus')}
                        >
                          <div style={{ width: '60px', overflow: 'hidden' }}>
                            <span className="truncate">状況</span>
                          </div>
                        </TableHead>
                        <TableHead style={{ width: '60px' }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedScenarios.map((scenario, index) => {
                        
                        const moveRow = (dragIndex: number, hoverIndex: number) => {
                          const newScenarios = [...sortedScenarios];
                          const draggedScenario = newScenarios[dragIndex];
                          newScenarios.splice(dragIndex, 1);
                          newScenarios.splice(hoverIndex, 0, draggedScenario);
                          updateScenarios(newScenarios);
                        };

                        return (
                          <DraggableScenarioRow
                            key={scenario.id}
                            index={index}
                            scenario={scenario}
                            moveRow={moveRow}
                            setSelectedScenario={setSelectedScenario}
                            setIsEditDialogOpen={setIsEditDialogOpen}
                          >
                            {/* タイトル */}
                            <TableCell className="border-r border-gray-300">
                              <div className="max-w-xs">
                                <p 
                                  className="text-sm truncate cursor-pointer hover:text-blue-600 hover:underline"
                                  onClick={() => {
                                    setViewScenario(scenario);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  {scenario.title}
                                </p>
                              </div>
                            </TableCell>

                            {/* 累計公演数 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm">
                                  {scenario.playCount}回
                                </span>
                              </div>
                            </TableCell>

                            {/* 売上/回 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-green-600">
                                  {formatLicenseAmount((scenario.playerCount?.max || 0) * (scenario.participationFee || 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* GM代/回 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-red-600">
                                  {formatLicenseAmount(scenario.gmFee || 0)}
                                </span>
                              </div>
                            </TableCell>


                            {/* ライセンス/回 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-orange-600">
                                  {formatLicenseAmount(scenario.licenseAmount || 0)}
                                </span>
                              </div>
                            </TableCell>

                            {/* 道具コスト/回 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-purple-600">
                                  {formatLicenseAmount(scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'per_play')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0)}
                                </span>
                              </div>
                            </TableCell>

                            {/* 制作費合計 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-orange-600 font-medium">
                                  {formatLicenseAmount((scenario.productionCost || 0) + (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'one_time')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* コスト/回 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-red-600">
                                  {formatLicenseAmount((scenario.gmFee || 0) + (scenario.miscellaneousExpenses || 0) + (scenario.licenseAmount || 0) + (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'per_play')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 粗利/回 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-blue-600 font-medium">
                                  {formatLicenseAmount(((scenario.playerCount?.max || 0) * (scenario.participationFee || 0)) - (scenario.gmFee || 0) - (scenario.miscellaneousExpenses || 0) - (scenario.licenseAmount || 0) - (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'per_play')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 売上累計 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-green-600 font-medium">
                                  {formatLicenseAmount((scenario.playerCount?.max || 0) * (scenario.participationFee || 0) * scenario.playCount)}
                                </span>
                              </div>
                            </TableCell>

                            {/* コスト累計 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-red-600 font-medium">
                                  {formatLicenseAmount(((scenario.gmFee || 0) + (scenario.miscellaneousExpenses || 0) + (scenario.licenseAmount || 0) + (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'per_play')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0)) * scenario.playCount + (scenario.productionCost || 0) + (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'one_time')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 最終純利益 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className="text-sm text-blue-600 font-medium">
                                  {formatLicenseAmount(((scenario.playerCount?.max || 0) * (scenario.participationFee || 0) * scenario.playCount) - ((scenario.gmFee || 0) + (scenario.miscellaneousExpenses || 0) + (scenario.licenseAmount || 0) + (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'per_play')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0)) * scenario.playCount - (scenario.productionCost || 0) - (scenario.props ? scenario.props
                                    .filter(prop => prop.costType === 'one_time')
                                    .reduce((sum, prop) => sum + prop.cost, 0) : 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* ROI率 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className={`text-sm font-medium ${
                                  calculateFinancialMetrics(scenario).roi >= 100 ? 'text-green-600' :
                                  calculateFinancialMetrics(scenario).roi >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {calculateFinancialMetrics(scenario).roi}%
                                </span>
                              </div>
                            </TableCell>

                            {/* 回収回数 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className={`text-sm font-medium ${
                                  calculateFinancialMetrics(scenario).paybackPeriod === '未回収' ? 'text-gray-600' :
                                  parseInt(calculateFinancialMetrics(scenario).paybackPeriod.replace('回', '')) <= 10 ? 'text-green-600' :
                                  parseInt(calculateFinancialMetrics(scenario).paybackPeriod.replace('回', '')) <= 20 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {calculateFinancialMetrics(scenario).paybackPeriod}
                                </span>
                              </div>
                            </TableCell>

                            {/* 純利益率 (%) */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className={`text-sm font-medium ${
                                  calculateFinancialMetrics(scenario).profitMargin >= 20 ? 'text-green-600' :
                                  calculateFinancialMetrics(scenario).profitMargin >= 10 ? 'text-yellow-600' :
                                  calculateFinancialMetrics(scenario).profitMargin >= 0 ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {calculateFinancialMetrics(scenario).profitMargin}%
                                </span>
                              </div>
                            </TableCell>

                            {/* 回収率 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-right">
                                <span className={`text-sm font-medium ${
                                  calculateFinancialMetrics(scenario).recoveryRate >= 100 ? 'text-green-600' :
                                  calculateFinancialMetrics(scenario).recoveryRate >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {calculateFinancialMetrics(scenario).recoveryRate}%
                                </span>
                              </div>
                            </TableCell>

                            {/* 残数 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '80px' }}>
                              <div style={{ width: '80px' }} className="text-center">
                                {(() => {
                                  const recoveryMetrics = calculateRecoveryMetrics(scenario);
                                  const remainingDays = recoveryMetrics.remainingDays;
                                  
                                  if (remainingDays === null) {
                                    return <span className="text-xs text-gray-500">-</span>;
                                  }
                                  
                                  return (
                                    <div className="text-center">
                                      <div className={`text-sm font-medium ${
                                        remainingDays > 0 ? 'text-gray-900' : 
                                        remainingDays === 0 ? 'text-blue-600' : 
                                        'text-red-600'
                                      }`}>
                                        {remainingDays > 0 ? `${remainingDays}日` : 
                                         remainingDays === 0 ? '今日' : 
                                         `${Math.abs(remainingDays)}日超過`}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </TableCell>

                            {/* 回収状況 */}
                            <TableCell className="border-r border-gray-300" style={{ width: '60px' }}>
                              <div style={{ width: '60px' }} className="text-center">
                                {(() => {
                                  const recoveryMetrics = calculateRecoveryMetrics(scenario);
                                  const getStatusBadge = (status: string) => {
                                    switch (status) {
                                      case 'completed':
                                        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">完了</Badge>;
                                      case 'excellent':
                                        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">優秀</Badge>;
                                      case 'good':
                                        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">良好</Badge>;
                                      case 'average':
                                        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">普通</Badge>;
                                      case 'poor':
                                        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">要改善</Badge>;
                                      case 'pending':
                                        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">予定</Badge>;
                                      case 'unrecoverable':
                                        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">不可</Badge>;
                                      case 'unknown':
                                        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">未設定</Badge>;
                                      default:
                                        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">-</Badge>;
                                    }
                                  };
                                  return getStatusBadge(recoveryMetrics.recoveryStatus);
                                })()}
                              </div>
                            </TableCell>

                            {/* 操作 */}
                            <TableCell style={{ width: '60px' }}>
                              <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedScenario(scenario);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>編集</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </DraggableScenarioRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 詳細表示ダイアログ */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewScenario?.title}</DialogTitle>
                <DialogDescription>
                  作者: {viewScenario?.author} | ライセンス: {viewScenario ? formatLicenseAmount(viewScenario.licenseAmount || 0) : ''}
                </DialogDescription>
              </DialogHeader>
              {viewScenario && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">概要</h4>
                    <p className="text-sm text-muted-foreground">{viewScenario.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">基本情報</h4>
                      <div className="space-y-1 text-sm">
                        <p>難易度: {difficultyLabels[viewScenario.difficulty]}</p>
                        <p>人数: {formatPlayerCount(viewScenario.playerCount)}</p>
                        <p>所要時間: {formatDuration(viewScenario.duration)}</p>
                        <p>累計公演数: {viewScenario.playCount}回</p>
                        <p>評価: {viewScenario.rating}/5.0</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">対応GM</h4>
                      <div className="flex flex-wrap gap-1">
                        {viewScenario.availableGMs && viewScenario.availableGMs.length > 0 ? (
                          viewScenario.availableGMs.map((gm) => (
                            <Badge key={gm} variant="outline" className="text-xs">
                              {gm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">未設定</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {viewScenario.requiredProps && viewScenario.requiredProps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">必要なプロップス</h4>
                      <div className="flex flex-wrap gap-1">
                        {viewScenario.requiredProps.map((prop, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {prop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* 編集ダイアログ */}
            <ScenarioDialog
              scenario={selectedScenario}
              onSave={handleSaveScenario}
            onDelete={async (scenarioId: string) => {
              console.log('シナリオ削除開始:', scenarioId);
              try {
                const result = await deleteScenario(scenarioId);
                if (result.error) {
                  console.error('シナリオ削除エラー:', result.error);
                  alert('シナリオの削除に失敗しました: ' + result.error);
                } else {
                  console.log('シナリオ削除成功');
                  // 編集ダイアログを閉じる
                  setIsEditDialogOpen(false);
                  setSelectedScenario(null);
                }
              } catch (error) {
                console.error('シナリオ削除エラー:', error);
                alert('シナリオの削除に失敗しました');
              }
            }}
              open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setSelectedScenario(null);
              }
            }}
          />
        </div>
      </DndProvider>
    </TooltipProvider>
  );
});