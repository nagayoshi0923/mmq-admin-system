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
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
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
// useScheduleは不要になったため削除
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
      <TableCell className="w-8">
        <div 
          className="cursor-pointer hover:text-blue-600" 
          onClick={() => {
            setSelectedScenario(scenario);
            setIsEditDialogOpen(true);
          }}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

export const ScenarioManager = React.memo(() => {
  const { scenarios, addScenario, updateScenario, removeScenario, updateScenarios } = useScenarios();
  const { staff } = useStaff();
  const { stores, getKitsByScenario } = useStores();
  const { addEditEntry } = useEditHistory();
  const { isConnected } = useSupabase();
  // 公演回数はデータベースで管理するため、useScheduleは不要
  
  // Supabaseからのリアルタイムデータ取得
  const { 
    data: supabaseScenarios, 
    loading: supabaseLoading, 
    error: supabaseError,
    refetch: refetchSupabaseData,
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
  const [sortField, setSortField] = useState<keyof Scenario | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  // シナリオ保存関数
  const handleSaveScenario = async (scenarioData: Scenario) => {
    const existingScenario = scenarios.find(s => s.id === scenarioData.id);
    
    try {
      if (existingScenario) {
        // 更新
        const result = await updateScenario(scenarioData);
        if (result.error) {
          console.error('シナリオ更新エラー:', result.error);
          return;
        }
        
        // 編集履歴に追加
        addEditEntry({
          user: 'ユーザー',
          action: 'update',
          target: `${scenarioData.title}`,
          summary: `${scenarioData.title}の情報を更新しました`,
          category: 'scenario',
          changes: [
            { field: '全般', newValue: '情報が更新されました' }
          ]
        });
      } else {
        // 新規追加
        const result = await addScenario(scenarioData);
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
      const result = await removeScenario(scenario.id);
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
  const handleSort = (field: keyof Scenario) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // シナリオリスト（データベースのplay_countカラムを直接使用）
  const scenariosWithPlayCount = useMemo(() => {
    if (!Array.isArray(scenarios)) return [];
    
    return scenarios.map(scenario => ({
      ...scenario,
      playCount: scenario.playCount || 0 // データベースのplay_countカラムを使用
    }));
  }, [scenarios]);

  // ソートされたシナリオリスト（安全な配列処理）
  const sortedScenarios = Array.isArray(scenariosWithPlayCount) ? [...scenariosWithPlayCount].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // playerCountフィールドの特別処理
    if (sortField === 'playerCount') {
      aValue = a.playerCount.min as any; // 最小人数で比較
      bValue = b.playerCount.min as any;
    } else {
      // 配列の場合は長さで比較
      if (Array.isArray(aValue)) aValue = aValue.length as any;
      if (Array.isArray(bValue)) bValue = bValue.length as any;
      
      // 文字列の場合は大文字小文字を無視して比較
      if (typeof aValue === 'string') aValue = aValue.toLowerCase() as any;
      if (typeof bValue === 'string') bValue = bValue.toLowerCase() as any;
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
  const getSortIcon = (field: keyof Scenario) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
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
    return scenarios.filter(s => s.author === authorName).length;
  };

  // 作者一覧を取得（重複なし）
  const uniqueAuthors = Array.from(new Set(scenarios.map(s => s.author)));

  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>シナリオ管理</h2>
            <div className="flex gap-4 items-center">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('=== 双方向連携テスト ===');
                  console.log('現在のシナリオ数:', scenarios.length);
                  scenarios.forEach(scenario => {
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
                    <p className="text-lg">{scenarios.length}</p>
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
                    <p className="text-lg">{scenarios.reduce((sum, s) => sum + s.playCount, 0)}</p>
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
                    <TableHead className="w-8">
                      <GripVertical className="w-4 h-4 opacity-50" />
                    </TableHead>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <GripVertical className="w-4 h-4 opacity-50" />
                        </TableHead>
                        <TableHead>タイトル</TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50 w-[100px]"
                          onClick={() => handleSort('playCount')}
                        >
                          <div className="flex items-center gap-2">
                            累計公演数
                            {getSortIcon('playCount')}
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">売上/回</TableHead>
                        <TableHead className="w-[100px]">GM代/回</TableHead>
                        <TableHead className="w-[100px]">雑費/回</TableHead>
                        <TableHead className="w-[100px]">償却/回</TableHead>
                        <TableHead className="w-[100px]">粗利/回</TableHead>
                        <TableHead className="w-[100px]">売上累計</TableHead>
                        <TableHead className="w-[100px]">コスト累計</TableHead>
                        <TableHead className="w-[100px]">未償却残高</TableHead>
                        <TableHead className="w-[100px]">最終純利益</TableHead>
                        <TableHead className="w-20">操作</TableHead>
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

                            {/* 累計公演数 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm">
                                  {scenario.playCount}回
                                </span>
                              </div>
                            </TableCell>

                            {/* 売上/回 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-green-600">
                                  {formatLicenseAmount(scenario.revenue || 0)}
                                </span>
                              </div>
                            </TableCell>

                            {/* GM代/回 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-red-600">
                                  {formatLicenseAmount(scenario.gmFee || 0)}
                                </span>
                              </div>
                            </TableCell>

                            {/* 雑費/回 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-red-600">
                                  {formatLicenseAmount(scenario.miscellaneousExpenses || 0)}
                                </span>
                              </div>
                            </TableCell>

                            {/* 償却/回 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-red-600">
                                  {formatLicenseAmount((scenario.depreciation || 0) / Math.max(scenario.playCount, 1))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 粗利/回 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-blue-600 font-medium">
                                  {formatLicenseAmount((scenario.revenue || 0) - (scenario.gmFee || 0) - (scenario.miscellaneousExpenses || 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 売上累計 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-green-600 font-medium">
                                  {formatLicenseAmount((scenario.revenue || 0) * scenario.playCount)}
                                </span>
                              </div>
                            </TableCell>

                            {/* コスト累計 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-red-600 font-medium">
                                  {formatLicenseAmount(((scenario.gmFee || 0) + (scenario.miscellaneousExpenses || 0)) * scenario.playCount + (scenario.productionCost || 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 未償却残高 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-red-600 font-medium">
                                  {formatLicenseAmount((scenario.productionCost || 0) - (scenario.depreciation || 0))}
                                </span>
                              </div>
                            </TableCell>

                            {/* 最終純利益 */}
                            <TableCell className="w-[100px]">
                              <div className="w-[100px] text-right">
                                <span className="text-sm text-blue-600 font-medium">
                                  {formatLicenseAmount(((scenario.revenue || 0) * scenario.playCount) - ((scenario.gmFee || 0) + (scenario.miscellaneousExpenses || 0)) * scenario.playCount - (scenario.productionCost || 0))}
                                </span>
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
          {selectedScenario && (
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
              onOpenChange={setIsEditDialogOpen}
            />
          )}
        </div>
      </DndProvider>
    </TooltipProvider>
  );
});