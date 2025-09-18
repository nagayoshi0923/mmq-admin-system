import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Code, 
  Layout, 
  Database, 
  Layers, 
  Grid, 
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  UserCheck,
  Package,
  CreditCard,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { Input } from './ui/input';
import { useScenarios } from '../contexts/ScenarioContext';
import { useStores } from '../contexts/StoreContext';
import { Settings } from 'lucide-react';
import { DataPersistenceStatus } from './DataPersistenceStatus';

interface UIElement {
  name: string;
  type: 'component' | 'data' | 'ui-element' | 'dialog' | 'table' | 'form';
  description: string;
  location: string;
  relatedComponents?: string[];
  props?: string[];
  example?: string;
  preview?: React.ReactNode;
  status: 'implemented' | 'planned' | 'deprecated';
}

interface PageStructure {
  pageName: string;
  icon: any;
  mainComponent: string;
  description: string;
  elements: UIElement[];
}

const systemStructure: PageStructure[] = [
  {
    pageName: 'スケジュール管理',
    icon: Calendar,
    mainComponent: 'ScheduleManager',
    description: '月間スケジュール管理（リストカレンダー形式）6店舗×3時間帯での公演管理',
    elements: [
      {
        name: 'ScheduleManager',
        type: 'component',
        description: 'スケジュール管理のメインコンポーネント',
        location: '/components/ScheduleManager.tsx',
        status: 'implemented'
      },
      {
        name: 'ScheduleEvent',
        type: 'data',
        description: '公演イベントのデータ構造（id, date, venue, scenario, gms, startTime, endTime, category, etc.）',
        location: '/components/ScheduleManager.tsx:22-33',
        props: ['id', 'date', 'venue', 'scenario', 'gms', 'startTime', 'endTime', 'category', 'reservationInfo', 'notes'],
        status: 'implemented'
      },
      {
        name: 'EventCell',
        type: 'ui-element',
        description: '公演セル（時間帯×店舗の交差点に表示される公演ボックス）',
        location: 'TableCell内の公演表示要素',
        relatedComponents: ['ScheduleEvent', 'CategoryBadge'],
        preview: (
          <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs">
            <div className="font-medium text-blue-900">人狼ゲーム</div>
            <div className="text-blue-700">14:30-17:30</div>
            <Badge className="bg-blue-100 text-blue-800 text-xs">オープン公演</Badge>
          </div>
        ),
        status: 'implemented'
      },
      {
        name: 'DaySchedule',
        type: 'data',
        description: '日別スケジュール構造（date, dayOfWeek, isHoliday, events[]）',
        location: '/components/ScheduleManager.tsx:35-40',
        status: 'implemented'
      },
      {
        name: 'TimeSlotCell',
        type: 'ui-element',
        description: '時間帯セル（朝10:00・昼14:30・夜19:00）',
        location: 'TableHeader内の時間帯表示',
        status: 'implemented'
      },
      {
        name: 'VenueHeader',
        type: 'ui-element',
        description: '店舗ヘッダー（馬場、別館①、別館②、大久保、大塚、埼玉大宮）',
        location: 'TableHeader内の店舗名表示',
        status: 'implemented'
      },
      {
        name: 'EventDialog',
        type: 'dialog',
        description: '公演登録・編集ダイアログ（開始時間・終了時間Selectコンポーネント付き）',
        location: 'Dialog内の公演フォーム',
        relatedComponents: ['Select', 'TimeSelect'],
        status: 'implemented'
      },
      {
        name: 'CategoryBadge',
        type: 'ui-element',
        description: 'カテゴリーバッジ（オープン公演、貸切公演、GMテスト、テストプレイ、出張公演）',
        location: 'Badge component',
        preview: (
          <div className="flex gap-1 flex-wrap">
            <Badge className="bg-blue-100 text-blue-800">オープン公演</Badge>
            <Badge className="bg-green-100 text-green-800">貸切公演</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">GMテスト</Badge>
            <Badge className="bg-purple-100 text-purple-800">テストプレイ</Badge>
            <Badge className="bg-red-100 text-red-800">出張公演</Badge>
          </div>
        ),
        status: 'implemented'
      },
      {
        name: 'IntervalWarning',
        type: 'ui-element',
        description: '公演間インターバル警告アイコン',
        location: 'AlertTriangle icon',
        preview: (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600">インターバル不足</span>
          </div>
        ),
        status: 'implemented'
      },
      {
        name: 'CalendarGrid',
        type: 'ui-element',
        description: 'カレンダーグリッド（月間表示テーブル）',
        location: 'Table component',
        preview: (
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">日付</TableHead>
                  <TableHead>馬場</TableHead>
                  <TableHead>別館①</TableHead>
                  <TableHead>別館②</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">12/25</TableCell>
                  <TableCell><div className="bg-blue-50 p-1 rounded text-xs">人狼ゲーム</div></TableCell>
                  <TableCell><div className="bg-green-50 p-1 rounded text-xs">貸切</div></TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ),
        status: 'implemented'
      }
    ]
  },
  {
    pageName: '予約管理',
    icon: CreditCard,
    mainComponent: 'ReservationManager',
    description: 'ストアーズ予約API連携機能付き予約管理システム',
    elements: [
      {
        name: 'ReservationManager',
        type: 'component',
        description: '予約管理のメインコンポーネント',
        location: '/components/ReservationManager.tsx',
        status: 'implemented'
      },
      {
        name: 'ReservationTable',
        type: 'table',
        description: '予約一覧テーブル',
        location: 'Table component',
        status: 'implemented'
      },
      {
        name: 'ReservationRow',
        type: 'ui-element',
        description: '予約行（各予約データの表示行）',
        location: 'TableRow component',
        status: 'implemented'
      },
      {
        name: 'StoresAPISection',
        type: 'ui-element',
        description: 'ストアーズAPI連携セクション',
        location: 'API連携コンポーネント',
        status: 'implemented'
      }
    ]
  },
  {
    pageName: 'スタッフ管理',
    icon: Users,
    mainComponent: 'StaffManager',
    description: 'GM・マネージャー・企画スタッフの管理、公演可能シナリオ複数選択機能付き',
    elements: [
      {
        name: 'StaffManager',
        type: 'component',
        description: 'スタッフ管理のメインコンポーネント',
        location: '/components/StaffManager.tsx',
        status: 'implemented'
      },
      {
        name: 'Staff',
        type: 'data',
        description: 'スタッフデータ構造（id, name, role, email, phone, scenarios, etc.）',
        location: '/contexts/StaffContext.tsx',
        props: ['id', 'name', 'role', 'email', 'phone', 'availableScenarios', 'skills'],
        status: 'implemented'
      },
      {
        name: 'StaffTable',
        type: 'table',
        description: 'スタッフ一覧テーブル',
        location: 'Table component',
        status: 'implemented'
      },
      {
        name: 'StaffRow',
        type: 'ui-element',
        description: 'スタッフ行（ドラッグ&ドロップ並び替え機能付き）',
        location: 'TableRow with react-dnd',
        relatedComponents: ['DragHandle', 'RoleBadge'],
        status: 'implemented'
      },
      {
        name: 'StaffDialog',
        type: 'dialog',
        description: 'スタッフ登録・編集ダイアログ',
        location: '/components/StaffDialog.tsx',
        status: 'implemented'
      },
      {
        name: 'StaffAvatar',
        type: 'ui-element',
        description: 'スタッフアバター',
        location: 'Avatar component',
        preview: (
          <div className="flex gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-700">田</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-green-100 text-green-700">佐</AvatarFallback>
            </Avatar>
          </div>
        ),
        status: 'implemented'
      },
      {
        name: 'RoleBadge',
        type: 'ui-element',
        description: '役割バッジ（GM、マネージャー、企画）',
        location: 'Badge component',
        preview: (
          <div className="flex gap-1">
            <Badge className="bg-blue-100 text-blue-800">GM</Badge>
            <Badge className="bg-green-100 text-green-800">マネージャー</Badge>
            <Badge className="bg-purple-100 text-purple-800">企画</Badge>
          </div>
        ),
        status: 'implemented'
      },
      {
        name: 'SkillTags',
        type: 'ui-element',
        description: 'スキルタグ表示',
        location: 'Badge components array',
        status: 'implemented'
      },
      {
        name: 'ScenarioCheckboxes',
        type: 'form',
        description: '対応シナリオチェックボックス群（複数選択可能）',
        location: 'Checkbox components array',
        relatedComponents: ['Checkbox'],
        status: 'implemented'
      },
      {
        name: 'DragHandle',
        type: 'ui-element',
        description: 'ドラッグハンドル（react-dnd用）',
        location: 'GripVertical icon',
        status: 'implemented'
      },
      {
        name: 'WorkloadSummary',
        type: 'data',
        description: '負荷サマリー（総時間、公演数、予定・完了数）',
        location: 'workloadSummary interface',
        status: 'implemented'
      },
      {
        name: 'StaffScheduleDialog',
        type: 'dialog',
        description: 'スタッフスケジュール編集ダイアログ',
        location: '/components/StaffScheduleDialog.tsx',
        preview: (
          <div className="border rounded p-3 bg-white shadow-sm">
            <h4 className="font-medium mb-2">スケジュール編集</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="開始時間" />
                  </SelectTrigger>
                </Select>
                <Select>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="終了時間" />
                  </SelectTrigger>
                </Select>
              </div>
              <div className="flex gap-1">
                <Button size="sm">保存</Button>
                <Button size="sm" variant="outline">キャンセル</Button>
              </div>
            </div>
          </div>
        ),
        status: 'implemented'
      },
      {
        name: 'ProtectedField',
        type: 'ui-element',
        description: '保護フィールド（電話番号・メールアドレス、パスワード「0909」で保護）',
        location: 'Password protected display',
        status: 'implemented'
      }
    ]
  },
  {
    pageName: 'シナリオ管理',
    icon: BookOpen,
    mainComponent: 'ScenarioManager',
    description: 'マーダーミステリーシナリオの管理（難易度、プレイヤー数、時間等）',
    elements: [
      {
        name: 'ScenarioManager',
        type: 'component',
        description: 'シナリオ管理のメインコンポーネント',
        location: '/components/ScenarioManager.tsx',
        status: 'implemented'
      },
      {
        name: 'Scenario',
        type: 'data',
        description: 'シナリオデータ構造（id, title, duration, players, difficulty, etc.）',
        location: '/contexts/ScenarioContext.tsx',
        status: 'implemented'
      },
      {
        name: 'ScenarioTable',
        type: 'table',
        description: 'シナリオ一覧テーブル',
        location: 'Table component',
        status: 'implemented'
      },
      {
        name: 'ScenarioRow',
        type: 'ui-element',
        description: 'シナリオ行',
        location: 'TableRow component',
        status: 'implemented'
      },
      {
        name: 'ScenarioDialog',
        type: 'dialog',
        description: 'シナリオ登録・編集ダイアログ',
        location: '/components/ScenarioDialog.tsx',
        status: 'implemented'
      },
      {
        name: 'DifficultyBadge',
        type: 'ui-element',
        description: '難易度バッジ',
        location: 'Badge component',
        status: 'implemented'
      },
      {
        name: 'PlayerCountBadge',
        type: 'ui-element',
        description: 'プレイヤー数バッジ',
        location: 'Badge component',
        status: 'implemented'
      }
    ]
  },
  {
    pageName: '売上管理',
    icon: TrendingUp,
    mainComponent: 'SalesManager',
    description: '売上データの管理・分析機能',
    elements: [
      {
        name: 'SalesManager',
        type: 'component',
        description: '売上管理のメインコンポーネント',
        location: '/components/SalesManager.tsx',
        status: 'implemented'
      },
      {
        name: 'SalesTable',
        type: 'table',
        description: '売上一覧テーブル',
        location: 'Table component',
        status: 'implemented'
      },
      {
        name: 'SalesDialog',
        type: 'dialog',
        description: '売上登録・編集ダイアログ',
        location: '/components/SalesDialog.tsx',
        status: 'implemented'
      },
      {
        name: 'RevenueChart',
        type: 'ui-element',
        description: '売上チャート',
        location: 'Chart component',
        status: 'implemented'
      }
    ]
  },
  {
    pageName: '顧客管理',
    icon: UserCheck,
    mainComponent: 'CustomerManager',
    description: '顧客情報管理（電話番号・メールアドレス保護機能付き）',
    elements: [
      {
        name: 'CustomerManager',
        type: 'component',
        description: '顧客管理のメインコンポーネント',
        location: '/components/CustomerManager.tsx',
        status: 'implemented'
      },
      {
        name: 'CustomerTable',
        type: 'table',
        description: '顧客一覧テーブル',
        location: 'Table component',
        status: 'implemented'
      },
      {
        name: 'CustomerDialog',
        type: 'dialog',
        description: '顧客登録・編集ダイアログ',
        location: '/components/CustomerDialog.tsx',
        status: 'implemented'
      },
      {
        name: 'ProtectedField',
        type: 'ui-element',
        description: '保護フィールド（電話番号・メールアドレス、パスワード「0909」で保護）',
        location: 'Password protected display',
        status: 'implemented'
      }
    ]
  },
  {
    pageName: '在庫管理',
    icon: Package,
    mainComponent: 'InventoryManager',
    description: '在庫アイテムの管理機能',
    elements: [
      {
        name: 'InventoryManager',
        type: 'component',
        description: '在庫管理のメインコンポーネント',
        location: '/components/InventoryManager.tsx',
        status: 'implemented'
      },
      {
        name: 'InventoryTable',
        type: 'table',
        description: '在庫一覧テーブル',
        location: 'Table component',
        status: 'implemented'
      },
      {
        name: 'InventoryDialog',
        type: 'dialog',
        description: '在庫登録・編集ダイアログ',
        location: '/components/InventoryDialog.tsx',
        status: 'implemented'
      }
    ]
  }
];

const commonElements: UIElement[] = [
  {
    name: 'EditHistory',
    type: 'component',
    description: '編集履歴コンポーネント（全ページ共通）',
    location: '/components/EditHistory.tsx',
    preview: (
      <div className="border rounded p-2 bg-gray-50">
        <h5 className="text-xs font-medium mb-1">編集履歴</h5>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>田中太郎 - スタッフ追加</span>
            <span className="text-gray-500">12/25 14:30</span>
          </div>
          <div className="flex justify-between">
            <span>佐藤花子 - 公演変更</span>
            <span className="text-gray-500">12/25 13:15</span>
          </div>
        </div>
      </div>
    ),
    status: 'implemented'
  },
  {
    name: 'CompactEditHistory',
    type: 'component',
    description: 'コンパクト編集履歴',
    location: '/components/CompactEditHistory.tsx',
    preview: (
      <div className="border rounded p-2 bg-blue-50 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>最新: 田中太郎 - 12/25 14:30</span>
        </div>
      </div>
    ),
    status: 'implemented'
  },
  {
    name: 'ItemEditHistory',
    type: 'component',
    description: 'アイテム別編集履歴',
    location: '/components/ItemEditHistory.tsx',
    status: 'implemented'
  },
  {
    name: 'AlertDialog',
    type: 'dialog',
    description: '確認ダイアログ（削除確認等、全ページ共通）',
    location: 'AlertDialog component',
    preview: (
      <div className="border border-red-200 rounded p-3 bg-red-50">
        <h4 className="font-medium text-red-800 mb-2">削除確認</h4>
        <p className="text-sm text-red-700 mb-3">この操作は取り消せません。本当に削除しますか？</p>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive">削除</Button>
          <Button size="sm" variant="outline">キャンセル</Button>
        </div>
      </div>
    ),
    status: 'implemented'
  },
  {
    name: 'SortButton',
    type: 'ui-element',
    description: 'ソートボタン（全フィールド対応）',
    location: 'Button with sort icons',
    preview: (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="text-xs">
          名前 ↑
        </Button>
        <Button size="sm" variant="ghost" className="text-xs">
          日付 ↓
        </Button>
      </div>
    ),
    status: 'implemented'
  },
  {
    name: 'ActionButtons',
    type: 'ui-element',
    description: 'アクション（編集・削除）ボタン群',
    location: 'Button components',
    preview: (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="text-xs">編集</Button>
        <Button size="sm" variant="destructive" className="text-xs">削除</Button>
      </div>
    ),
    status: 'implemented'
  }
];

const contextElements: UIElement[] = [
  {
    name: 'ScenarioProvider',
    type: 'component',
    description: 'シナリオデータのContext Provider',
    location: '/contexts/ScenarioContext.tsx',
    props: ['scenarios', 'addScenario', 'updateScenario', 'deleteScenario'],
    status: 'implemented'
  },
  {
    name: 'StaffProvider',
    type: 'component',
    description: 'スタッフデータのContext Provider',
    location: '/contexts/StaffContext.tsx',
    props: ['staff', 'addStaff', 'updateStaff', 'deleteStaff'],
    status: 'implemented'
  },
  {
    name: 'EditHistoryProvider',
    type: 'component',
    description: '編集履歴のContext Provider',
    location: '/contexts/EditHistoryContext.tsx',
    props: ['history', 'addHistory', 'clearHistory'],
    status: 'implemented'
  }
];

const dialogElements: UIElement[] = [
  {
    name: 'StaffDialog',
    type: 'dialog',
    description: 'スタッフ登録・編集ダイアログ',
    location: '/components/StaffDialog.tsx',
    preview: (
      <div className="border rounded p-3 bg-white shadow-sm">
        <h4 className="font-medium mb-3">スタッフ情報</h4>
        <div className="space-y-2">
          <input className="w-full p-2 border rounded text-sm" placeholder="名前" />
          <select className="w-full p-2 border rounded text-sm">
            <option>GM</option>
            <option>マネージャー</option>
            <option>企画</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm">保存</Button>
            <Button size="sm" variant="outline">キャンセル</Button>
          </div>
        </div>
      </div>
    ),
    status: 'implemented'
  },
  {
    name: 'ScenarioDialog',
    type: 'dialog',
    description: 'シナリオ登録・編集ダイアログ',
    location: '/components/ScenarioDialog.tsx',
    preview: (
      <div className="border rounded p-3 bg-white shadow-sm">
        <h4 className="font-medium mb-3">シナリオ情報</h4>
        <div className="space-y-2">
          <input className="w-full p-2 border rounded text-sm" placeholder="タイトル" />
          <div className="flex gap-2">
            <input className="flex-1 p-2 border rounded text-sm" placeholder="時間(分)" />
            <input className="flex-1 p-2 border rounded text-sm" placeholder="人数" />
          </div>
          <select className="w-full p-2 border rounded text-sm">
            <option>初級</option>
            <option>中級</option>
            <option>上級</option>
          </select>
        </div>
      </div>
    ),
    status: 'implemented'
  },
  {
    name: 'SalesDialog',
    type: 'dialog',
    description: '売上登録・編集ダイアログ',
    location: '/components/SalesDialog.tsx',
    status: 'implemented'
  },
  {
    name: 'CustomerDialog',
    type: 'dialog',
    description: '顧客登録・編集ダイアログ',
    location: '/components/CustomerDialog.tsx',
    status: 'implemented'
  },
  {
    name: 'InventoryDialog',
    type: 'dialog',
    description: '在庫登録・編集ダイアログ',
    location: '/components/InventoryDialog.tsx',
    status: 'implemented'
  }
];

export function DevelopmentManager() {
  const [selectedPage, setSelectedPage] = useState<string>('schedule');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isGeneratingKits, setIsGeneratingKits] = useState(false);
  
  const { scenarios } = useScenarios();
  const { stores, addPerformanceKit } = useStores();

  // 全シナリオに2キットずつ配置する機能
  const generateInitialKits = () => {
    if (isGeneratingKits) return;
    
    setIsGeneratingKits(true);
    
    try {
      let generatedKitsCount = 0;
      
      scenarios.forEach(scenario => {
        // 各シナリオに2キットずつ生成
        for (let kitNumber = 1; kitNumber <= 2; kitNumber++) {
          // ランダムに店舗を選択
          const randomStoreIndex = Math.floor(Math.random() * stores.length);
          const selectedStore = stores[randomStoreIndex];
          
          const kit = {
            scenarioId: scenario.id,
            scenarioTitle: scenario.title,
            kitNumber: kitNumber,
            condition: 'excellent' as const,
            notes: '初期データ生成'
          };
          
          addPerformanceKit(selectedStore.id, kit);
          generatedKitsCount++;
        }
      });
      
      alert(`${scenarios.length}シナリオ × 2キット = ${generatedKitsCount}キットを生成しました！`);
    } catch (error) {
      console.error('キット生成エラー:', error);
      alert('キット生成中にエラーが発生しました');
    } finally {
      setIsGeneratingKits(false);
    }
  };

  const filteredPages = systemStructure.filter(page => 
    selectedPage === 'all' || page.pageName === selectedPage ||
    (selectedPage === 'schedule' && page.pageName === 'スケジュール管理') ||
    (selectedPage === 'reservations' && page.pageName === '予約管理') ||
    (selectedPage === 'staff' && page.pageName === 'スタッフ管理') ||
    (selectedPage === 'scenarios' && page.pageName === 'シナリオ管理') ||
    (selectedPage === 'sales' && page.pageName === '売上管理') ||
    (selectedPage === 'customers' && page.pageName === '顧客管理') ||
    (selectedPage === 'inventory' && page.pageName === '在庫管理')
  );

  const getTypeColor = (type: string) => {
    const colors = {
      'component': 'bg-blue-100 text-blue-800',
      'data': 'bg-green-100 text-green-800',
      'ui-element': 'bg-purple-100 text-purple-800',
      'dialog': 'bg-orange-100 text-orange-800',
      'table': 'bg-yellow-100 text-yellow-800',
      'form': 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'implemented': 'bg-green-100 text-green-800',
      'planned': 'bg-yellow-100 text-yellow-800',
      'deprecated': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* 初期データ生成セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            初期データ生成
          </CardTitle>
          <p className="text-muted-foreground">
            テスト用のデータを自動生成します
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                この機能は開発・テスト目的のためのものです。本番環境でのご利用はお避けください。
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">全シナリオに初期キット配置</h4>
                <p className="text-sm text-muted-foreground">
                  全{scenarios.length}シナリオに2キットずつ、ランダムな店舗に配置します
                </p>
              </div>
              <Button 
                onClick={generateInitialKits}
                disabled={isGeneratingKits || scenarios.length === 0}
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                {isGeneratingKits ? '生成中...' : 'キット配置実行'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* データ永続化状況セクション */}
      <DataPersistenceStatus />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                UI要素マスターリスト
              </CardTitle>
              <p className="text-muted-foreground">
                マーダーミステリー店舗管理システムの全UI要素・コンポーネント・データ構造の一元管理
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={generateInitialKits}
                disabled={isGeneratingKits || scenarios.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {isGeneratingKits ? '生成中...' : '初期キット配置'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPage} onValueChange={setSelectedPage} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
                <TabsTrigger value="schedule">スケジュール</TabsTrigger>
                <TabsTrigger value="reservations">予約</TabsTrigger>
                <TabsTrigger value="staff">スタッフ</TabsTrigger>
                <TabsTrigger value="scenarios">シナリオ</TabsTrigger>
                <TabsTrigger value="sales">売上</TabsTrigger>
                <TabsTrigger value="customers">顧客</TabsTrigger>
                <TabsTrigger value="inventory">在庫</TabsTrigger>
                <TabsTrigger value="common">共通</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Input
                  placeholder="要素名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* ページ別表示 */}
            {filteredPages.map((page) => (
              <TabsContent key={page.pageName} value={selectedPage}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <page.icon className="w-5 h-5" />
                      {page.pageName}
                    </CardTitle>
                    <p className="text-muted-foreground">{page.description}</p>
                    <Badge variant="outline">
                      メインコンポーネント: {page.mainComponent}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {page.elements
                        .filter(element => 
                          searchTerm === '' || 
                          element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          element.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((element) => (
                          <Card key={element.name} className="p-4">
                            <div className="space-y-3">
                              {/* ヘッダー */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-medium">
                                  {element.name}
                                </code>
                                <Badge variant="outline" className={getTypeColor(element.type)}>
                                  {element.type}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(element.status)}>
                                  {element.status}
                                </Badge>
                              </div>
                              
                              {/* 説明 */}
                              <p className="text-sm text-muted-foreground">{element.description}</p>
                              
                              {/* プレビュー */}
                              {element.preview && (
                                <div className="border rounded p-3 bg-gray-50">
                                  <h5 className="text-xs font-medium text-gray-600 mb-2">プレビュー</h5>
                                  {element.preview}
                                </div>
                              )}
                              
                              {/* 詳細情報 */}
                              <div className="space-y-2">
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 mb-1">場所</h5>
                                  <code className="text-xs bg-muted p-1 rounded text-gray-700">
                                    {element.location}
                                  </code>
                                </div>
                                
                                {element.props && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-1">プロパティ</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {element.props.slice(0, 3).map((prop) => (
                                        <Badge key={prop} variant="secondary" className="text-xs">
                                          {prop}
                                        </Badge>
                                      ))}
                                      {element.props.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{element.props.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {element.relatedComponents && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-1">関連</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {element.relatedComponents.map((comp) => (
                                        <Badge key={comp} variant="outline" className="text-xs">
                                          {comp}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            {/* 共通要素タブ */}
            <TabsContent value="common">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      共通コンポーネント
                    </CardTitle>
                    <p className="text-muted-foreground">
                      全ページで使用される共通のUI要素・コンポーネント
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {commonElements
                        .filter(element => 
                          searchTerm === '' || 
                          element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          element.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((element) => (
                          <Card key={element.name} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-medium">
                                  {element.name}
                                </code>
                                <Badge variant="outline" className={getTypeColor(element.type)}>
                                  {element.type}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(element.status)}>
                                  {element.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{element.description}</p>
                              
                              {element.preview && (
                                <div className="border rounded p-3 bg-gray-50">
                                  <h5 className="text-xs font-medium text-gray-600 mb-2">プレビュー</h5>
                                  {element.preview}
                                </div>
                              )}
                              
                              <div>
                                <h5 className="text-xs font-medium text-gray-600 mb-1">場所</h5>
                                <code className="text-xs bg-muted p-1 rounded text-gray-700">
                                  {element.location}
                                </code>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Context Providers
                    </CardTitle>
                    <p className="text-muted-foreground">
                      データ管理用のReact Context Providers
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {contextElements.map((element) => (
                        <Card key={element.name} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-medium">
                                {element.name}
                              </code>
                              <Badge variant="outline" className={getTypeColor(element.type)}>
                                {element.type}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(element.status)}>
                                {element.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{element.description}</p>
                            
                            {element.props && (
                              <div>
                                <h5 className="text-xs font-medium text-gray-600 mb-1">提供機能</h5>
                                <div className="flex flex-wrap gap-1">
                                  {element.props.map((prop) => (
                                    <Badge key={prop} variant="secondary" className="text-xs">
                                      {prop}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 mb-1">場所</h5>
                              <code className="text-xs bg-muted p-1 rounded text-gray-700">
                                {element.location}
                              </code>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid className="w-5 h-5" />
                      ダイアログコンポーネント
                    </CardTitle>
                    <p className="text-muted-foreground">
                      各機能の登録・編集用ダイアログ
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {dialogElements.map((element) => (
                        <Card key={element.name} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-medium">
                                {element.name}
                              </code>
                              <Badge variant="outline" className={getTypeColor(element.type)}>
                                {element.type}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(element.status)}>
                                {element.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{element.description}</p>
                            
                            {element.preview && (
                              <div className="border rounded p-3 bg-gray-50">
                                <h5 className="text-xs font-medium text-gray-600 mb-2">プレビュー</h5>
                                {element.preview}
                              </div>
                            )}
                            
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 mb-1">場所</h5>
                              <code className="text-xs bg-muted p-1 rounded text-gray-700">
                                {element.location}
                              </code>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 使用ガイド */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            開発ガイドライン
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">命名規則</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• コンポーネント: PascalCase (ScheduleManager)</li>
                <li>• UI要素: PascalCase (EventCell, CategoryBadge)</li>
                <li>• データ型: PascalCase (ScheduleEvent, Staff)</li>
                <li>• プロパティ: camelCase (startTime, endTime)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">タイプ分類</h4>
              <div className="space-y-1">
                <Badge className={getTypeColor('component')}>component</Badge>
                <span className="text-sm ml-2">Reactコンポーネント</span>
                <br />
                <Badge className={getTypeColor('data')}>data</Badge>
                <span className="text-sm ml-2">TypeScript interface/type</span>
                <br />
                <Badge className={getTypeColor('ui-element')}>ui-element</Badge>
                <span className="text-sm ml-2">表示要素</span>
                <br />
                <Badge className={getTypeColor('dialog')}>dialog</Badge>
                <span className="text-sm ml-2">ダイアログ・モーダル</span>
                <br />
                <Badge className={getTypeColor('table')}>table</Badge>
                <span className="text-sm ml-2">テーブル・リスト</span>
                <br />
                <Badge className={getTypeColor('form')}>form</Badge>
                <span className="text-sm ml-2">フォーム・入力要素</span>
              </div>
            </div>
          </div>
          
          
          <div>
            <h4 className="font-medium mb-2">重要な用語説明</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium">公演関連</h5>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• 公演 = セッション（マーダーミステリーの1回の実施）</li>
                  <li>• EventCell = 公演セル（カレンダー上の公演表示）</li>
                  <li>• ScheduleEvent = 公演データ（情報を格納）</li>
                  <li>• TimeSlot = 時間帯（朝・昼・夜）</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium">店舗関連</h5>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Venue = 店舗（馬場、別館①、別館②、大久保、大塚、埼玉大宮）</li>
                  <li>• VenueHeader = 店舗ヘッダー</li>
                  <li>• IntervalWarning = インターバル警告</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}