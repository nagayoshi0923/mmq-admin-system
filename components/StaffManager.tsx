import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Calendar as CalendarIcon, Users, Clock, TrendingUp, Trash2, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, TestTube } from 'lucide-react';
import { Phone, Mail, Calendar, Plus, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';

import { useEditHistory } from '../contexts/EditHistoryContext';
import { useStaff, Staff } from '../contexts/StaffContext';
import { setStaffUpdateFunction } from '../contexts/ScenarioContext';
import { StaffDialog } from './StaffDialog';
import { StaffScheduleDialog } from './StaffScheduleDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';

// Staff interfaceはStaffContextから import

interface StaffSchedule {
  id: string;
  staffId: string;
  date: string;
  venue: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  scenario?: string;
  role: 'GM' | 'サポート';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface WorkloadSummary {
  staffId: string;
  staffName: string;
  totalHours: number;
  sessionsCount: number; // 総公演数
  upcomingSessions: number; // 予定公演数
  completedSessions: number; // 完了公演数
}

// モックデータ
const mockStaff: Staff[] = [];

const roleColors: { [key: string]: string } = {
  'GM': 'bg-blue-100 text-blue-800',
  'サポート': 'bg-green-100 text-green-800',
  'マネージャー': 'bg-purple-100 text-purple-800',
  '社長': 'bg-red-100 text-red-800',
  '企画': 'bg-orange-100 text-orange-800',
  '事務': 'bg-gray-100 text-gray-800'
};

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'inactive': 'bg-gray-100 text-gray-800',
  'on-leave': 'bg-yellow-100 text-yellow-800'
};

const statusLabels = {
  'active': '勤務中',
  'inactive': '休止中',
  'on-leave': '休暇中'
};

// Helper function to generate initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ItemType = 'STAFF_ROW';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableRowProps {
  index: number;
  member: Staff;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

function DraggableRow({ index, member, moveRow, children }: DraggableRowProps) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: { type: ItemType, id: member.id, index },
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

export function StaffManager() {
  const { staff, addStaff, updateStaff, updateStaffList, addScenarioToStaff, removeScenarioFromStaff, removeStaff } = useStaff();
  const { addEditEntry } = useEditHistory();
  
  // ソート状態の管理
  const [sortField, setSortField] = useState<keyof Staff | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // スタッフスケジュールのモックデータ
  const [schedules] = useState<StaffSchedule[]>([
    {
      id: '1',
      staffId: '1',
      date: '2025-01-20',
      venue: '馬場',
      timeSlot: 'afternoon',
      scenario: '人狼村の惨劇',
      role: 'GM',
      status: 'confirmed'
    },
    {
      id: '2',
      staffId: '2',
      date: '2025-01-20',
      venue: '別館①',
      timeSlot: 'evening',
      scenario: '密室の謎',
      role: 'GM',
      status: 'scheduled'
    },
    {
      id: '3',
      staffId: '3',
      date: '2025-01-21',
      venue: '大久保',
      timeSlot: 'afternoon',
      role: 'サポート',
      status: 'scheduled'
    }
  ]);

  // 負荷統計の計算
  const workloadSummary: WorkloadSummary[] = staff.map(member => {
    const memberSchedules = schedules.filter(s => s.staffId === member.id);
    const upcomingSessions = memberSchedules.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length;
    const completedSessions = memberSchedules.filter(s => s.status === 'completed').length;
    
    return {
      staffId: member.id,
      staffName: member.name,
      totalHours: memberSchedules.length * 4, // 1公演4時間と仮定
      sessionsCount: memberSchedules.length,
      upcomingSessions,
      completedSessions
    };
  });
  
  // スタッフ保存関数
  const handleSaveStaff = (staffData: Staff) => {
    // データの安全性を確保
    const safeStaffData = {
      ...staffData,
      availableScenarios: staffData.availableScenarios || []
    };
    
    const existingIndex = staff.findIndex(s => s.id === safeStaffData.id);
    
    if (existingIndex >= 0) {
      // 更新
      updateStaff(safeStaffData);
      
      // 編集履歴に追加
      addEditEntry({
        user: 'ユーザー', // 実際のアプリではログインユーザー名を使用
        action: 'update',
        target: `${safeStaffData.name} - 情報更新`,
        summary: `${safeStaffData.name}の情報を更新しました`,
        category: 'staff',
        changes: [
          { field: '全般', newValue: '情報が更新されました' }
        ]
      });
    } else {
      // 新規追加
      addStaff(safeStaffData);
      
      // 編集履歴に追加
      addEditEntry({
        user: 'ユーザー',
        action: 'create',
        target: `${safeStaffData.name} - 新規スタッフ`,
        summary: `新規スタッフを追加：${safeStaffData.name}`,
        category: 'staff',
        changes: [
          { field: '名前', newValue: safeStaffData.name },
          { field: '役割', newValue: safeStaffData.role.join(', ') },
          { field: '勤務店舗', newValue: safeStaffData.stores.join(', ') }
        ]
      });
    }
  };

  // スタッフ削除関数
  const handleDeleteStaff = (staffData: Staff) => {
    removeStaff(staffData.id);
    
    // 編集履歴に追加
    addEditEntry({
      user: 'ユーザー',
      action: 'delete',
      target: `${staffData.name} - スタッフ削除`,
      summary: `スタッフを削除：${staffData.name}`,
      category: 'staff',
      changes: [
        { field: '名前', oldValue: staffData.name, newValue: '削除済み' },
        { field: '役割', oldValue: staffData.role.join(', '), newValue: '削除済み' }
      ]
    });
  };

  const getTimeSlotLabel = (timeSlot: string) => {
    const labels = {
      morning: '朝 (9:00-13:00)',
      afternoon: '昼 (14:00-18:00)',
      evening: '夜 (19:00-23:00)'
    };
    return labels[timeSlot as keyof typeof labels] || timeSlot;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: '予定',
      confirmed: '確定',
      completed: '完了',
      cancelled: 'キャンセル'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // ソート処理関数
  const handleSort = (field: keyof Staff) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 新しいフィールドの場合は昇順から開始
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // データ永続化 - localStorage から初期データを読み込み
  useEffect(() => {
    // StaffContext が既にデータを管理しているので、追加の読み込みは不要
    // この useEffect は削除可能
  }, []);

  // ソートアイコンの表示
  const getSortIcon = (field: keyof Staff) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  // ソートされたスタッフリスト
  const sortedStaff = [...staff].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // 配列の場合は長さで比較（nullチェック追加）
    if (Array.isArray(aValue)) aValue = aValue.length as any;
    if (Array.isArray(bValue)) bValue = bValue.length as any;
    if (aValue === undefined || aValue === null) aValue = 0 as any;
    if (bValue === undefined || bValue === null) bValue = 0 as any;
    
    // 文字列の場合は大文字小文字を無視して比較
    if (typeof aValue === 'string') aValue = aValue.toLowerCase() as any;
    if (typeof bValue === 'string') bValue = bValue.toLowerCase() as any;
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // データ永続化 - staff が変更されるたびに localStorage に保存
  useEffect(() => {
    if (staff.length > 0) {
      localStorage.setItem('murder-mystery-staff', JSON.stringify(staff));
    }
  }, [staff]);

  // ScenarioContextとの連携をセットアップ
  useEffect(() => {
    setStaffUpdateFunction((staffName: string, scenarioTitle: string, action: 'add' | 'remove') => {
      if (action === 'add') {
        addScenarioToStaff(staffName, scenarioTitle);
      } else {
        removeScenarioFromStaff(staffName, scenarioTitle);
      }
    });
  }, [addScenarioToStaff, removeScenarioFromStaff]);

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>スタッフ管理</h2>
            <div className="flex gap-4 items-center">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('=== スタッフ側連携テスト ===');
                  console.log('現在のスタッフ数:', staff.length);
                  staff.forEach(member => {
                    if (member.role.includes('GM') || member.role.includes('マネージャー')) {
                      console.log(`${member.name} (${member.role})の公演可能シナリオ:`, member.availableScenarios);
                    }
                  });
                }}
              >
                <TestTube className="w-4 h-4 mr-2" />
                連携テスト
              </Button>
              <StaffDialog 
                onSave={handleSaveStaff}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    スタッフ追加
                  </Button>
                }
              />
            </div>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">総スタッフ数</p>
                    <p className="text-lg">{staff.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">今週の予定</p>
                    <p className="text-lg">{schedules.filter(s => s.status !== 'completed').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">総勤務時間</p>
                    <p className="text-lg">{workloadSummary.reduce((sum, w) => sum + w.totalHours, 0)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">アクティブ率</p>
                    <p className="text-lg">{staff.length > 0 ? Math.round((staff.filter(s => s.status === 'active').length / staff.length) * 100) : 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* タブコンテンツ */}
          <Tabs defaultValue="staff-list" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="staff-list" className="text-xs sm:text-sm">スタッフ一覧</TabsTrigger>
              <TabsTrigger value="schedules" className="text-xs sm:text-sm">スケジュール詳細</TabsTrigger>
              <TabsTrigger value="workload" className="text-xs sm:text-sm">負荷分析</TabsTrigger>
            </TabsList>

            <TabsContent value="staff-list" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>スタッフ一覧</CardTitle>
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
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            スタッフ
                            {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center gap-2">
                            役割
                            {getSortIcon('role')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50"
                          onClick={() => handleSort('stores')}
                        >
                          <div className="flex items-center gap-2">
                            勤務店舗
                            {getSortIcon('stores')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50"
                          onClick={() => handleSort('availability')}
                        >
                          <div className="flex items-center gap-2">
                            勤務可能日
                            {getSortIcon('availability')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/50"
                          onClick={() => handleSort('availableScenarios')}
                        >
                          <div className="flex items-center gap-2">
                            公演可能シナリオ
                            {getSortIcon('availableScenarios')}
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
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sortField ? sortedStaff : staff).map((member, index) => (
                        <DraggableRow 
                          key={member.id} 
                          index={index} 
                          member={member} 
                          moveRow={(dragIndex, hoverIndex) => {
                            if (sortField) return; // ソート中はドラッグ&ドロップを無効化
                            const newStaff = [...staff];
                            const dragged = newStaff[dragIndex];
                            newStaff.splice(dragIndex, 1);
                            newStaff.splice(hoverIndex, 0, dragged);
                            updateStaffList(newStaff);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="truncate">{member.name}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {member.lineName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(member.role) ? (
                                member.role.map((role, index) => (
                                  <Badge key={index} className={`${roleColors[role]} text-xs`}>
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge className={`${roleColors[member.role as string]} text-xs`}>
                                  {member.role}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[140px]">
                              {member.stores.length <= 2 ? (
                                <span className="text-sm">{member.stores.join(', ')}</span>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-sm cursor-help">
                                      {member.stores.slice(0, 2).join(', ')}, 他{member.stores.length - 2}店舗
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{member.stores.join(', ')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[140px]">
                              {member.availability.length <= 3 ? (
                                <span className="text-sm">{member.availability.join(', ')}</span>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-sm cursor-help">
                                      {member.availability.slice(0, 3).join(', ')}, 他{member.availability.length - 3}日
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{member.availability.join(', ')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              {member.availableScenarios && member.availableScenarios.length > 0 ? (
                                <div className="space-y-1">
                                  {member.availableScenarios.length <= 3 ? (
                                    // 3個以下の場合はすべて表示
                                    <div className="flex flex-wrap gap-1">
                                      {member.availableScenarios.map((scenario, index) => (
                                        <Tooltip key={index}>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs cursor-help">
                                              {scenario.length > 12 ? scenario.substring(0, 12) + '...' : scenario}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="max-w-xs break-words">{scenario}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                    </div>
                                  ) : (
                                    // 3個より多い場合は最初の2個 + 「他N個」
                                    <div className="flex flex-wrap gap-1">
                                      {member.availableScenarios.slice(0, 2).map((scenario, index) => (
                                        <Tooltip key={index}>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs cursor-help">
                                              {scenario.length > 12 ? scenario.substring(0, 12) + '...' : scenario}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="max-w-xs break-words">{scenario}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="secondary" className="text-xs cursor-help">
                                            他{member.availableScenarios.length - 2}個
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="max-w-xs">
                                            <p className="font-medium mb-2">すべての公演可能シナリオ:</p>
                                            <div className="space-y-1">
                                              {member.availableScenarios.map((scenario, index) => (
                                                <div key={index} className="text-sm">
                                                  • {scenario}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">未設定</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[member.status]} text-xs`}>
                              {statusLabels[member.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="連絡先を表示"
                                onClick={() => {
                                  const password = prompt('連絡先を表示するにはパスワードを入力してください:');
                                  if (password === '0909') {
                                    alert(`${member.name}の連絡先:\n電話: ${member.contact.phone}\nメール: ${member.contact.email}`);
                                  } else if (password !== null) {
                                    alert('パスワードが間違っています。');
                                  }
                                }}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                              <StaffDialog 
                                staff={member}
                                onSave={handleSaveStaff}
                                trigger={
                                  <Button variant="ghost" size="sm" title="編集">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                }
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="削除">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>スタッフを削除しますか？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      「{member.name}」を削除します。この操作は取り消せません。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStaff(member)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      削除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </DraggableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {staff.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      まだスタッフが登録されていません。「スタッフ追加」ボタンからスタッフを追加してください。
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>スケジュール詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日付</TableHead>
                        <TableHead>スタッフ</TableHead>
                        <TableHead>店舗</TableHead>
                        <TableHead>時間帯</TableHead>
                        <TableHead>シナリオ</TableHead>
                        <TableHead>役割</TableHead>
                        <TableHead>ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => {
                        const staffMember = staff.find(s => s.id === schedule.staffId);
                        return (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              {new Date(schedule.date).toLocaleDateString('ja-JP')}
                            </TableCell>
                            <TableCell>{staffMember?.name || '不明'}</TableCell>
                            <TableCell>{schedule.venue}</TableCell>
                            <TableCell>{getTimeSlotLabel(schedule.timeSlot)}</TableCell>
                            <TableCell>{schedule.scenario || '-'}</TableCell>
                            <TableCell>
                              <Badge className={roleColors[schedule.role]}>
                                {schedule.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getStatusLabel(schedule.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {schedules.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      現在スケジュールは登録されていません。
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>負荷分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>スタッフ名</TableHead>
                        <TableHead>総公演数</TableHead>
                        <TableHead>予定公演</TableHead>
                        <TableHead>完了公演</TableHead>
                        <TableHead>総時間数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workloadSummary.map((summary) => (
                        <TableRow key={summary.staffId}>
                          <TableCell>{summary.staffName}</TableCell>
                          <TableCell>{summary.sessionsCount}</TableCell>
                          <TableCell>{summary.upcomingSessions}</TableCell>
                          <TableCell>{summary.completedSessions}</TableCell>
                          <TableCell>{summary.totalHours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {workloadSummary.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      負荷データがありません。
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </DndProvider>
  );
}