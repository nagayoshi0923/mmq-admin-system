import { useState, useMemo, useEffect } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabase } from '../contexts/SupabaseContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserCheck, Plus, Edit, Search, Filter, Mail, Phone, Calendar, Star, Users, TrendingUp, Trash2, ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinDate: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  preferredGenres: string[];
  favoriteScenarios: string[];
  participantType: 'individual' | 'group' | 'corporate';
  status: 'active' | 'inactive' | 'vip';
  birthMonth?: number;
  notes?: string;
  tags: string[];
}

interface VisitHistory {
  id: string;
  customerId: string;
  date: string;
  venue: string;
  scenario: string;
  participants: number;
  spent: number;
  rating?: number;
  feedback?: string;
}

const ItemType = 'CUSTOMER_ROW';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableCustomerRowProps {
  index: number;
  customer: Customer;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

function DraggableCustomerRow({ index, customer, moveRow, children }: DraggableCustomerRowProps) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: { type: ItemType, id: customer.id, index },
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

export function CustomerManager() {
  const { isConnected } = useSupabase();

  // Supabaseから顧客データを取得
  const {
    data: customersData,
    loading: customersLoading,
    error: customersError,
    insert: insertCustomer,
    update: updateCustomer,
    delete: deleteCustomer,
    refetch: refetchCustomers
  } = useSupabaseData<any>({
    table: 'customers',
    realtime: true,
    orderBy: { column: 'name', ascending: true }
  });

  // データをアプリケーション形式に変換
  const customers = useMemo(() => {
    if (!Array.isArray(customersData)) return [];
    
    return customersData.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      joinDate: customer.created_at ? new Date(customer.created_at).toISOString().split('T')[0] : '',
      totalVisits: customer.total_visits || 0,
      totalSpent: 0, // 売上データから計算する必要がある
      lastVisit: customer.last_visit,
      preferredGenres: customer.preferred_scenarios || [],
      favoriteScenarios: customer.preferred_scenarios || [],
      participantType: 'individual' as const, // デフォルト値
      status: customer.status || 'active',
      birthMonth: customer.birthday ? new Date(customer.birthday).getMonth() + 1 : undefined,
      tags: [], // タグ機能は後で実装
      notes: customer.notes
    }));
  }, [customersData]);

  const [visitHistory] = useState<VisitHistory[]>([
    {
      id: '1',
      customerId: '1',
      date: '2025-01-15',
      venue: '馬場',
      scenario: '人狼村の惨劇',
      participants: 6,
      spent: 6000,
      rating: 5,
      feedback: 'とても楽しかったです！'
    },
    {
      id: '2',
      customerId: '2',
      date: '2025-01-10',
      venue: '大久保',
      scenario: '学園ミステリー',
      participants: 1,
      spent: 5000,
      rating: 4
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ソート状態の管理
  const [sortField, setSortField] = useState<keyof Customer | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 顧客削除関数
  const handleDeleteCustomer = (customer: Customer) => {
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
  };

  // ソート処理関数
  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソートアイコンの表示
  const getSortIcon = (field: keyof Customer) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  // フィルタリングされた顧客リスト
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  // ソートされた顧客リスト
  const sortedFilteredCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // 配列の場合は長さで比較
    if (Array.isArray(aValue)) aValue = aValue.length as any;
    if (Array.isArray(bValue)) bValue = bValue.length as any;
    
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

  // 統計データ
  const statistics = useMemo(() => {
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const vipCustomers = customers.filter(c => c.status === 'vip').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageSpent = totalRevenue / customers.length || 0;
    const averageVisits = customers.reduce((sum, c) => sum + c.totalVisits, 0) / customers.length || 0;

    return {
      totalCustomers: customers.length,
      activeCustomers,
      vipCustomers,
      totalRevenue,
      averageSpent,
      averageVisits
    };
  }, [customers]);

  const getCustomerVisitHistory = (customerId: string) => {
    return visitHistory.filter(visit => visit.customerId === customerId);
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'vip':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Customer['participantType']) => {
    switch (type) {
      case 'corporate':
        return 'bg-blue-100 text-blue-800';
      case 'group':
        return 'bg-purple-100 text-purple-800';
      case 'individual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h2>顧客管理</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            顧客追加
          </Button>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総顧客数</p>
                  <p className="text-lg">{statistics.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">VIP顧客</p>
                  <p className="text-lg">{statistics.vipCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総売上</p>
                  <p className="text-lg">¥{Math.round(statistics.totalRevenue / 1000)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">平均来店回数</p>
                  <p className="text-lg">{statistics.averageVisits.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルター */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="顧客名、メールアドレスで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="inactive">非アクティブ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 顧客一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>顧客一覧</CardTitle>
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
                      顧客名
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('totalVisits')}
                  >
                    <div className="flex items-center gap-2">
                      来店回数
                      {getSortIcon('totalVisits')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('totalSpent')}
                  >
                    <div className="flex items-center gap-2">
                      総支払額
                      {getSortIcon('totalSpent')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('lastVisit')}
                  >
                    <div className="flex items-center gap-2">
                      最終来店
                      {getSortIcon('lastVisit')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('participantType')}
                  >
                    <div className="flex items-center gap-2">
                      タイプ
                      {getSortIcon('participantType')}
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
                {(sortField || statusFilter !== 'all' || searchTerm ? sortedFilteredCustomers : customers).map((customer, index) => (
                  <DraggableCustomerRow 
                    key={customer.id} 
                    index={index} 
                    customer={customer} 
                    moveRow={(dragIndex, hoverIndex) => {
                      if (sortField || statusFilter !== 'all' || searchTerm) return; // フィルタ/ソート中はドラッグ&ドロップを無効化
                      const newCustomers = [...customers];
                      const dragged = newCustomers[dragIndex];
                      newCustomers.splice(dragIndex, 1);
                      newCustomers.splice(hoverIndex, 0, dragged);
                      setCustomers(newCustomers);
                    }}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="mr-1 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.totalVisits}回</TableCell>
                    <TableCell className="font-mono">¥{customer.totalSpent.toLocaleString()}</TableCell>
                    <TableCell>{customer.lastVisit}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(customer.participantType)}>
                        {customer.participantType === 'individual' ? '個人' :
                         customer.participantType === 'group' ? 'グループ' : '法人'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status === 'active' ? 'アクティブ' :
                         customer.status === 'vip' ? 'VIP' : '非アクティブ'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>顧客を削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{customer.name}」の顧客情報を削除します。この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteCustomer(customer)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </DraggableCustomerRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 顧客詳細・編集ダイアログ */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer ? '顧客情報編集' : '新規顧客登録'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="info">基本情報</TabsTrigger>
                  <TabsTrigger value="preferences">嗜好データ</TabsTrigger>
                  <TabsTrigger value="history">来店履歴</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>顧客名</Label>
                      <Input defaultValue={selectedCustomer.name} />
                    </div>
                    <div>
                      <Label>メールアドレス</Label>
                      <Input type="email" defaultValue={selectedCustomer.email} />
                    </div>
                    <div>
                      <Label>電話番号</Label>
                      <Input defaultValue={selectedCustomer.phone} />
                    </div>
                    <div>
                      <Label>ステータス</Label>
                      <Select defaultValue={selectedCustomer.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">アクティブ</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="inactive">非アクティブ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>備考</Label>
                    <Textarea defaultValue={selectedCustomer.notes} />
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div>
                    <Label>好みのジャンル</Label>
                    <div className="mt-2 space-y-2">
                      {selectedCustomer.preferredGenres.map(genre => (
                        <Badge key={genre} className="mr-2">{genre}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>お気に入りシナリオ</Label>
                    <div className="mt-2 space-y-2">
                      {selectedCustomer.favoriteScenarios.map(scenario => (
                        <Badge key={scenario} variant="outline" className="mr-2">{scenario}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日付</TableHead>
                        <TableHead>店舗</TableHead>
                        <TableHead>シナリオ</TableHead>
                        <TableHead>参加者数</TableHead>
                        <TableHead>支払額</TableHead>
                        <TableHead>評価</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCustomerVisitHistory(selectedCustomer.id).map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>{visit.date}</TableCell>
                          <TableCell>{visit.venue}</TableCell>
                          <TableCell>{visit.scenario}</TableCell>
                          <TableCell>{visit.participants}名</TableCell>
                          <TableCell>¥{visit.spent.toLocaleString()}</TableCell>
                          <TableCell>
                            {visit.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {visit.rating}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}