import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
// 最適化されたアイコンインポート
import Clock from 'lucide-react/dist/esm/icons/clock';
import Users from 'lucide-react/dist/esm/icons/users';
import Plus from 'lucide-react/dist/esm/icons/plus';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import TestTube from 'lucide-react/dist/esm/icons/test-tube';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import Package from 'lucide-react/dist/esm/icons/package';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Cloud from 'lucide-react/dist/esm/icons/cloud';
import CloudOff from 'lucide-react/dist/esm/icons/cloud-off';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { useEditHistory } from '../contexts/EditHistoryContext';
import { useScenarios, Scenario } from '../contexts/ScenarioContext';
import { useStaff } from '../contexts/StaffContext';
import { useStores } from '../contexts/StoreContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabase } from '../contexts/SupabaseContext';
import { SupabaseSyncIndicator } from './SupabaseSyncIndicator';
import { ScenarioDialog } from './ScenarioDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const difficultyLabels = {
  1: '初心者',
  2: '簡単',
  3: '普通',
  4: '難しい',
  5: '上級者'
};

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
}

function DraggableScenarioRow({ index, scenario, moveRow, children }: DraggableScenarioRowProps) {
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
        <div className="cursor-grab hover:text-muted-foreground" style={{ touchAction: 'none' }}>
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
  
  // Supabaseからのリアルタイムデータ取得
  const { 
    data: supabaseScenarios, 
    loading: supabaseLoading, 
    error: supabaseError,
    refetch: refetchSupabaseData 
  } = useSupabaseData<Scenario>({
    table: 'scenarios',
    realtime: true,
    fallbackKey: 'murder-mystery-scenarios'
  });
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [viewScenario, setViewScenario] = useState<Scenario | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // ソート状態の管理
  const [sortField, setSortField] = useState<keyof Scenario | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 編集状態の管理
  const [editingCell, setEditingCell] = useState<{scenarioId: string; field: string} | null>(null);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [minSelectOpen, setMinSelectOpen] = useState(false);
  const [maxSelectOpen, setMaxSelectOpen] = useState(false);

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

  // ソートされたシナリオリスト（安全な配列処理）
  const sortedScenarios = Array.isArray(scenarios) ? [...scenarios].sort((a, b) => {
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

  // 汎用編集関数
  const startEdit = (scenarioId: string, field: string, currentValue: any) => {
    setEditingCell({ scenarioId, field });
    
    // リリース日の場合は現在の月をデフォルトに
    const defaultValue = field === 'releaseDate' && (!currentValue || currentValue === 'unset') ? getCurrentYearMonth() : currentValue;
    setEditingValue(defaultValue);
    
    // プルダウンフィールドの場合は自動で開く
    const isSelectField = ['duration', 'playerCount', 'difficulty', 'status', 'releaseDate'].includes(field);
    if (isSelectField) {
      if (field === 'playerCount') {
        setTimeout(() => setMinSelectOpen(true), 10); // プレイ人数の場合は最小から開く
      } else {
        setTimeout(() => setSelectOpen(true), 10);
      }
    }
  };

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditingValue(null);
    setSelectOpen(false);
    setMinSelectOpen(false);
    setMaxSelectOpen(false);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const scenario = scenarios.find(s => s.id === editingCell.scenarioId);
    if (scenario) {
      console.log('🔄 Saving scenario edit:', {
        scenarioId: editingCell.scenarioId,
        field: editingCell.field,
        oldValue: scenario[editingCell.field as keyof Scenario],
        newValue: editingValue
      });
      
      const updatedScenario = { ...scenario, [editingCell.field]: editingValue };
      updateScenario(updatedScenario).then((result) => {
        console.log('✅ Scenario update result:', result);
      }).catch((error) => {
        console.error('❌ Scenario update error:', error);
      });
      
      // 編集履歴に追加
      const fieldLabels: Record<string, string> = {
        author: '作者名',
        title: 'タイトル',
        licenseAmount: 'ライセンス料',
        difficulty: 'GM難易度',
        playerCount: 'プレイ人数',
        duration: '所要時間',
        genre: 'ジャンル',
        status: 'ステータス',
        availableGMs: '対応GM',
        releaseDate: 'リリース日'
      };
      
      addEditEntry({
        user: 'ユーザー',
        action: 'update',
        target: `${scenario.title} - ${fieldLabels[editingCell.field] || editingCell.field}更新`,
        summary: `シナリオ「${scenario.title}」の${fieldLabels[editingCell.field] || editingCell.field}を更新しました`,
        category: 'scenario',
        changes: [
          { 
            field: fieldLabels[editingCell.field] || editingCell.field, 
            oldValue: formatFieldValue(scenario[editingCell.field as keyof Scenario]), 
            newValue: formatFieldValue(editingValue) 
          }
        ]
      });
    }
    setEditingCell(null);
    setEditingValue(null);
    setSelectOpen(false);
    setMinSelectOpen(false);
    setMaxSelectOpen(false);
  }, [editingCell, editingValue, scenarios, updateScenario, addEditEntry]);

  // 自動保存用の関数（プルダウン選択時用）
  const autoSave = (scenarioId: string, field: string, newValue: any) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      console.log('🔄 Auto-saving scenario edit:', {
        scenarioId,
        field,
        oldValue: scenario[field as keyof Scenario],
        newValue
      });
      
      const updatedScenario = { ...scenario, [field]: newValue };
      updateScenario(updatedScenario).then((result) => {
        console.log('✅ Auto-save result:', result);
      }).catch((error) => {
        console.error('❌ Auto-save error:', error);
      });
      
      // 編集履歴に追加
      const fieldLabels: Record<string, string> = {
        duration: '所要時間',
        playerCount: 'プレイ人数',
        difficulty: 'GM難易度',
        status: 'ステータス',
        releaseDate: 'リリース日'
      };
      
      addEditEntry({
        user: 'ユーザー',
        action: 'update',
        target: `${scenario.title} - ${fieldLabels[field] || field}更新`,
        summary: `シナリオ「${scenario.title}」の${fieldLabels[field] || field}を更新しました`,
        category: 'scenario',
        changes: [
          { 
            field: fieldLabels[field] || field, 
            oldValue: formatFieldValue(scenario[field as keyof Scenario]), 
            newValue: formatFieldValue(newValue) 
          }
        ]
      });
    }
    // 編集モードを終了
    setEditingCell(null);
    setEditingValue(null);
    setSelectOpen(false);
    setMinSelectOpen(false);
    setMaxSelectOpen(false);
  };

  const formatFieldValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return String(value);
  };

  const toggleGMSelection = (gmName: string) => {
    const currentGMs = Array.isArray(editingValue) ? editingValue : [];
    if (currentGMs.includes(gmName)) {
      setEditingValue(currentGMs.filter((gm: string) => gm !== gmName));
    } else {
      setEditingValue([...currentGMs, gmName]);
    }
  };

  // 編集可能セルコンポーネント
  const EditableCell = ({ scenario, field, children, className }: { 
    scenario: Scenario; 
    field: string; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const cellRef = useRef<HTMLTableCellElement>(null);
    const isEditing = editingCell?.scenarioId === scenario.id && editingCell?.field === field;
    // プルダウン対象のフィールドは保存/キャンセルボタンを表示しない
    const isSelectField = ['duration', 'playerCount', 'difficulty', 'status', 'releaseDate'].includes(field);

    // 外部クリック検知
    useEffect(() => {
      if (!isEditing) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        
        // 編集セル外のクリックかチェック
        if (cellRef.current && !cellRef.current.contains(target)) {
          // プルダウンが開いている場合は、プルダウン要素のクリックかチェック
          const isSelectClick = target.closest('[role="listbox"], [role="option"], [data-radix-select-content], [data-radix-select-trigger]');
          
          if (!isSelectClick) {
            // プルダウンフィールドでない場合、または プルダウンが閉じている場合は自動保存
            if (!isSelectField || (!selectOpen && !minSelectOpen && !maxSelectOpen)) {
              saveEdit();
            }
          }
        }
      };

      // 少し遅延を入れてイベントリスナーを追加
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }, [isEditing, isSelectField, selectOpen, minSelectOpen, maxSelectOpen, saveEdit]);

    if (isEditing) {
      return (
        <TableCell className={className}>
          <div ref={cellRef} className="space-y-2 p-2 border rounded-md bg-muted/20" data-editing-area>
            {renderEditingUI(field, editingValue, setEditingValue, scenario)}
            {!isSelectField && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={saveEdit}
                >
                  <Check className="w-3 h-3 mr-1" />
                  保存
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={cancelEdit}
                >
                  <X className="w-3 h-3 mr-1" />
                  キャンセル
                </Button>
              </div>
            )}
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell 
        className={`${className} cursor-pointer hover:bg-muted/50 p-1 rounded`}
        onClick={() => startEdit(scenario.id, field, scenario[field as keyof Scenario])}
        title="クリックして編集"
      >
        {children}
      </TableCell>
    );
  };

  // フィールドごとの編集UIを返す関数
  const renderEditingUI = (field: string, value: any, setValue: (value: any) => void, scenario?: Scenario) => {
    switch (field) {
      case 'author':
        return (
          <Input
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder="作者名を入力"
            className="text-xs"
          />
        );

      case 'title':
        return (
          <Input
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder="タイトルを入力"
            className="text-xs"
          />
        );

      case 'licenseAmount':
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder="ライセンス料を入力"
            className="text-xs"
            min="0"
            step="100"
          />
        );
      
      case 'description':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder="説明を入力"
            className="text-xs min-h-20"
          />
        );

      case 'difficulty':
        return (
          <Select 
            value={String(value)} 
            open={selectOpen}
            onOpenChange={setSelectOpen}
            onValueChange={(val) => {
              const newValue = Number(val);
              setValue(newValue);
              setSelectOpen(false);
              // 自動保存
              if (scenario) {
                autoSave(scenario.id, 'difficulty', newValue);
              }
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(difficultyLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'playerCount':
        const currentPlayerCount = value || { min: 1, max: 4 };
        
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">最小人数</label>
                <Select 
                  value={String(currentPlayerCount.min)} 
                  open={minSelectOpen}
                  onOpenChange={setMinSelectOpen}
                  onValueChange={(val) => {
                    const newMin = Number(val);
                    const newMax = Math.max(newMin, currentPlayerCount.max); // 最大値が最小値より小さくならないように調整
                    const newValue = { min: newMin, max: newMax };
                    setValue(newValue);
                    setMinSelectOpen(false);
                    // 最大値の編集に移行
                    setTimeout(() => setMaxSelectOpen(true), 10);
                    // 最小値変更では保存しない（最大値変更時にまとめて保存）
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(num => (
                      <SelectItem key={num} value={String(num)}>{num}名</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">最大人数</label>
                <Select 
                  value={String(currentPlayerCount.max)} 
                  open={maxSelectOpen}
                  onOpenChange={setMaxSelectOpen}
                  onValueChange={(val) => {
                    const newMax = Number(val);
                    const newMin = Math.min(currentPlayerCount.min, newMax); // 最小値が最大値より大きくならないように調整
                    const newValue = { min: newMin, max: newMax };
                    setValue(newValue);
                    setMaxSelectOpen(false);
                    // 自動保存
                    if (scenario) {
                      autoSave(scenario.id, 'playerCount', newValue);
                    }
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(num => (
                      <SelectItem key={num} value={String(num)}>{num}名</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'duration':
        return (
          <Select 
            value={String(value || '')} 
            open={selectOpen}
            onOpenChange={setSelectOpen}
            onValueChange={(val) => {
              const newValue = Number(val);
              setValue(newValue);
              setSelectOpen(false);
              // 自動保存
              if (scenario) {
                autoSave(scenario.id, 'duration', newValue);
              }
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="所要時間を選択" />
            </SelectTrigger>
            <SelectContent>
              {/* 30分区切りの選択肢（30分〜8時間） */}
              {Array.from({ length: 16 }, (_, i) => {
                const minutes = (i + 1) * 30;
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const label = mins === 0 ? `${hours}時間` : `${hours}時間${mins}分`;
                return (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case 'status':
        return (
          <Select 
            value={value} 
            open={selectOpen}
            onOpenChange={setSelectOpen}
            onValueChange={(val) => {
              setValue(val);
              setSelectOpen(false);
              // 自動保存
              if (scenario) {
                autoSave(scenario.id, 'status', val);
              }
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'availableGMs':
        const currentGMs = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {currentGMs.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">選択中のGM:</p>
                <div className="flex flex-wrap gap-1">
                  {currentGMs.map((gm: string) => (
                    <Badge key={gm} variant="outline" className="text-xs">
                      {gm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">対応可能GM選択:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableGMStaff.map(staffMember => (
                  <div key={staffMember.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gm-${staffMember.id}`}
                      checked={currentGMs.includes(staffMember.name)}
                      onCheckedChange={() => toggleGMSelection(staffMember.name)}
                    />
                    <label 
                      htmlFor={`gm-${staffMember.id}`}
                      className="text-xs cursor-pointer flex-1"
                    >
                      {staffMember.name}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Array.isArray(staffMember.role) ? staffMember.role.join(', ') : ''})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'releaseDate':
        return (
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none z-10" />
            <Select 
              value={value || ''} 
              open={selectOpen}
              onOpenChange={setSelectOpen}
              onValueChange={(val) => {
                setValue(val);
                setSelectOpen(false);
                // 自動保存
                if (scenario) {
                  autoSave(scenario.id, 'releaseDate', val);
                }
              }}
            >
              <SelectTrigger className="text-xs bg-warm-50 border-warm-200 rounded-lg focus:border-warm-400">
                <SelectValue placeholder="リリース時期を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">未設定</SelectItem>
                <SelectItem value="2023-01">2023年1月</SelectItem>
                <SelectItem value="2023-02">2023年2月</SelectItem>
                <SelectItem value="2023-03">2023年3月</SelectItem>
                <SelectItem value="2023-04">2023年4月</SelectItem>
                <SelectItem value="2023-05">2023年5月</SelectItem>
                <SelectItem value="2023-06">2023年6月</SelectItem>
                <SelectItem value="2023-07">2023年7月</SelectItem>
                <SelectItem value="2023-08">2023年8月</SelectItem>
                <SelectItem value="2023-09">2023年9月</SelectItem>
                <SelectItem value="2023-10">2023年10月</SelectItem>
                <SelectItem value="2023-11">2023年11月</SelectItem>
                <SelectItem value="2023-12">2023年12月</SelectItem>
                <SelectItem value="2024-01">2024年1月</SelectItem>
                <SelectItem value="2024-02">2024年2月</SelectItem>
                <SelectItem value="2024-03">2024年3月</SelectItem>
                <SelectItem value="2024-04">2024年4月</SelectItem>
                <SelectItem value="2024-05">2024年5月</SelectItem>
                <SelectItem value="2024-06">2024年6月</SelectItem>
                <SelectItem value="2024-07">2024年7月</SelectItem>
                <SelectItem value="2024-08">2024年8月</SelectItem>
                <SelectItem value="2024-09">2024年9月</SelectItem>
                <SelectItem value="2024-10">2024年10月</SelectItem>
                <SelectItem value="2024-11">2024年11月</SelectItem>
                <SelectItem value="2024-12">2024年12月</SelectItem>
                <SelectItem value="2025-01">2025年1月</SelectItem>
                <SelectItem value="2025-02">2025年2月</SelectItem>
                <SelectItem value="2025-03">2025年3月</SelectItem>
                <SelectItem value="2025-04">2025年4月</SelectItem>
                <SelectItem value="2025-05">2025年5月</SelectItem>
                <SelectItem value="2025-06">2025年6月</SelectItem>
                <SelectItem value="2025-07">2025年7月</SelectItem>
                <SelectItem value="2025-08">2025年8月</SelectItem>
                <SelectItem value="2025-09">2025年9月</SelectItem>
                <SelectItem value="2025-10">2025年10月</SelectItem>
                <SelectItem value="2025-11">2025年11月</SelectItem>
                <SelectItem value="2025-12">2025年12月</SelectItem>
                <SelectItem value="2026-01">2026年1月</SelectItem>
                <SelectItem value="2026-02">2026年2月</SelectItem>
                <SelectItem value="2026-03">2026年3月</SelectItem>
                <SelectItem value="2026-04">2026年4月</SelectItem>
                <SelectItem value="2026-05">2026年5月</SelectItem>
                <SelectItem value="2026-06">2026年6月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => setValue(e.target.value)}
            className="text-xs"
          />
        );
    }
  };

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
                  <Pencil className="w-5 h-5 text-purple-500" />
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
                      className="cursor-pointer select-none hover:bg-muted/50 w-[80px]"
                      onClick={() => handleSort('author')}
                    >
                      <div className="flex items-center gap-2">
                        作者名
                        {getSortIcon('author')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50 w-[80px]"
                      onClick={() => handleSort('licenseAmount')}
                    >
                      <div className="flex items-center gap-2">
                        ライセンス料
                        {getSortIcon('licenseAmount')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('playCount')}
                    >
                      <div className="flex items-center gap-2">
                        公演回数
                        {getSortIcon('playCount')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('releaseDate')}
                    >
                      <div className="flex items-center gap-2">
                        リリース日
                        {getSortIcon('releaseDate')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('difficulty')}
                    >
                      <div className="flex items-center gap-2">
                        GM難易度
                        {getSortIcon('difficulty')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('playerCount')}
                    >
                      <div className="flex items-center gap-2">
                        プレイ人数
                        {getSortIcon('playerCount')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center gap-2">
                        所要時間
                        {getSortIcon('duration')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        ステータス
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead>対応GM</TableHead>
                    <TableHead>キット</TableHead>
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
                      >
                        {/* タイトル */}
                        <EditableCell scenario={scenario} field="title">
                          <div className="max-w-xs">
                            <p className="text-xs truncate">{scenario.title}</p>
                          </div>
                        </EditableCell>

                        {/* 作者名 */}
                        <EditableCell scenario={scenario} field="author">
                          <div className="w-[80px]">
                            <span className="text-xs truncate block">{scenario.author}</span>
                          </div>
                        </EditableCell>

                        {/* ライセンス料 */}
                        <EditableCell scenario={scenario} field="licenseAmount">
                          <div className="w-[80px]">
                            <span className="text-xs text-green-600">
                              {formatLicenseAmount(scenario.licenseAmount || 0)}
                            </span>
                          </div>
                        </EditableCell>

                        {/* 公演回数 */}
                        <EditableCell scenario={scenario} field="playCount">
                          <span className="text-xs">{scenario.playCount}回</span>
                        </EditableCell>

                        {/* リリース日 */}
                        <EditableCell scenario={scenario} field="releaseDate">
                          <span className="text-xs">
                            {scenario.releaseDate ? new Date(scenario.releaseDate).toLocaleDateString('ja-JP') : '未設定'}
                          </span>
                        </EditableCell>

                        {/* GM難易度 */}
                        <EditableCell scenario={scenario} field="difficulty">
                          <Badge className={`${difficultyColors[scenario.difficulty]} text-xs`}>
                            {difficultyLabels[scenario.difficulty]}
                          </Badge>
                        </EditableCell>

                        {/* プレイ人数 */}
                        <EditableCell scenario={scenario} field="playerCount">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{formatPlayerCount(scenario.playerCount)}</span>
                          </div>
                        </EditableCell>

                        {/* 所要時間 */}
                        <EditableCell scenario={scenario} field="duration">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{formatDuration(scenario.duration)}</span>
                          </div>
                        </EditableCell>

                        {/* ステータス */}
                        <EditableCell scenario={scenario} field="status">
                          <Badge className={`${statusColors[scenario.status]} text-xs`}>
                            {statusLabels[scenario.status]}
                          </Badge>
                        </EditableCell>

                        {/* 対応GM */}
                        <EditableCell scenario={scenario} field="availableGMs" className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {scenario.availableGMs && scenario.availableGMs.length > 0 ? (
                              scenario.availableGMs.map((gm) => (
                                <Badge key={gm} variant="outline" className="text-xs">
                                  {gm}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">未設定</span>
                            )}
                          </div>
                        </EditableCell>

                        {/* キット */}
                        <TableCell>
                          {kitInfo.totalKits > 0 ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs">{kitInfo.totalKits}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {kitInfo.kitsByStore.map((entry) => (
                                    <div key={entry.storeId} className="text-xs">
                                      {entry.storeName}: {entry.kits.length}キット
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-xs">なし</span>
                          )}
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
                                    setViewScenario(scenario);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>詳細を表示</TooltipContent>
                            </Tooltip>

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

                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>削除</TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>シナリオを削除しますか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    「{scenario.title}」を削除します。この操作は元に戻せません。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteScenario(scenario)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    削除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </DraggableScenarioRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 詳細表示ダイアログ */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewScenario?.title}</DialogTitle>
                <DialogDescription>
                  作者: {viewScenario?.author} | ライセンス料: {viewScenario ? formatLicenseAmount(viewScenario.licenseAmount || 0) : ''}
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
                        <p>プレイ人数: {formatPlayerCount(viewScenario.playerCount)}</p>
                        <p>所要時間: {formatDuration(viewScenario.duration)}</p>
                        <p>プレイ回数: {viewScenario.playCount}回</p>
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
                          <Badge key={index} variant="secondary" className="text-xs">
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
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
            />
          )}
        </div>
      </DndProvider>
    </TooltipProvider>
  );
});