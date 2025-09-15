import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { TrendingUp, DollarSign, Users, Calendar, BarChart3, PieChart, Download, Filter, Trash2, ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie } from 'recharts';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ItemType = 'SALES_ROW';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableSalesRowProps {
  index: number;
  record: SalesRecord;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

function DraggableSalesRow({ index, record, moveRow, children }: DraggableSalesRowProps) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: { type: ItemType, id: record.id, index },
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

interface SalesRecord {
  id: string;
  date: string;
  venue: string;
  scenario: string;
  participants: number;
  revenue: number;
  category: 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';
  paymentMethod: 'クレジット' | '現金' | '銀行振込' | 'PayPay' | 'その他';
  gm: string;
  discount?: number;
  notes?: string;
}

const initialSalesRecords = [
  {
    id: '1',
    date: '2025-01-15',
    venue: '馬場',
    scenario: '人狼村の惨劇',
    participants: 6,
    revenue: 18000,
    category: 'オープン公演',
    paymentMethod: 'クレジット',
    gm: '田中GM'
  },
  {
    id: '2',
    date: '2025-01-15',
    venue: '別館①',
    scenario: '密室の謎',
    participants: 8,
    revenue: 32000,
    category: '貸切公演',
    paymentMethod: '銀行振込',
    gm: '佐藤GM'
  },
  {
    id: '3',
    date: '2025-01-14',
    venue: '大久保',
    scenario: '学園ミステリー',
    participants: 5,
    revenue: 15000,
    category: 'オープン公演',
    paymentMethod: 'PayPay',
    gm: '鈴木GM'
  }
];

export function SalesManager() {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);

  // データ永続化 - localStorage から初期データを読��込み
  useEffect(() => {
    const savedSales = localStorage.getItem('murder-mystery-sales');
    if (savedSales) {
      try {
        setSalesRecords(JSON.parse(savedSales) as SalesRecord[]);
      } catch (error) {
        console.error('Failed to load sales data:', error);
        setSalesRecords(initialSalesRecords as SalesRecord[]);
      }
    } else {
      setSalesRecords(initialSalesRecords as SalesRecord[]);
    }
  }, []);

  // データ永続化 - salesRecords が変更されるたびに localStorage に保存
  useEffect(() => {
    if (salesRecords.length > 0) {
      localStorage.setItem('murder-mystery-sales', JSON.stringify(salesRecords));
    }
  }, [salesRecords]);

  const [selectedPeriod, setSelectedPeriod] = useState('本月');
  const [selectedVenue, setSelectedVenue] = useState('全店舗');

  // ソート状態の管理
  const [sortField, setSortField] = useState<keyof SalesRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 売上記録削除関数
  const handleDeleteSalesRecord = (record: SalesRecord) => {
    setSalesRecords(prev => prev.filter(r => r.id !== record.id));
  };

  // ソート処理関数
  const handleSort = (field: keyof SalesRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソートされた売上記録リスト
  const sortedSalesRecords = [...salesRecords].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
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

  // ソートアイコンの表示
  const getSortIcon = (field: keyof SalesRecord) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  // 統計データの計算
  const statistics = useMemo(() => {
    const totalRevenue = salesRecords.reduce((sum, record) => sum + record.revenue, 0);
    const totalParticipants = salesRecords.reduce((sum, record) => sum + record.participants, 0);
    const averagePerSession = totalRevenue / salesRecords.length || 0;
    const averagePerPerson = totalRevenue / totalParticipants || 0;

    return {
      totalRevenue,
      totalParticipants,
      totalSessions: salesRecords.length,
      averagePerSession,
      averagePerPerson
    };
  }, [salesRecords]);

  // チャート用データの生成
  const dailyData = useMemo(() => {
    const dailyStats = salesRecords.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, sessions: 0, participants: 0 };
      }
      acc[date].revenue += record.revenue;
      acc[date].sessions += 1;
      acc[date].participants += record.participants;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [salesRecords]);

  const venueData = useMemo(() => {
    const venueStats = salesRecords.reduce((acc, record) => {
      const venue = record.venue;
      if (!acc[venue]) {
        acc[venue] = { name: venue, revenue: 0, sessions: 0 };
      }
      acc[venue].revenue += record.revenue;
      acc[venue].sessions += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(venueStats);
  }, [salesRecords]);

  const categoryData = useMemo(() => {
    const categoryStats = salesRecords.reduce((acc, record) => {
      const category = record.category;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0 };
      }
      acc[category].value += record.revenue;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(categoryStats);
  }, [salesRecords]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h2>売上管理</h2>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="本日">本日</SelectItem>
                <SelectItem value="本週">本週</SelectItem>
                <SelectItem value="本月">本月</SelectItem>
                <SelectItem value="3ヶ月">3ヶ月</SelectItem>
                <SelectItem value="年間">年間</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全店舗">全店舗</SelectItem>
                <SelectItem value="馬場">馬場</SelectItem>
                <SelectItem value="別館①">別館①</SelectItem>
                <SelectItem value="別館②">別館②</SelectItem>
                <SelectItem value="大久保">大久保</SelectItem>
                <SelectItem value="大塚">大塚</SelectItem>
                <SelectItem value="埼玉大宮">埼玉大宮</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
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
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総参加者数</p>
                  <p className="text-lg">{statistics.totalParticipants}名</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総公演数</p>
                  <p className="text-lg">{statistics.totalSessions}回</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">平均単価</p>
                  <p className="text-lg">¥{Math.round(statistics.averagePerPerson).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* タブコンテンツ */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="trends">トレンド分析</TabsTrigger>
            <TabsTrigger value="venues">店舗別分析</TabsTrigger>
            <TabsTrigger value="records">売上記録</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 日別売上推移 */}
              <Card>
                <CardHeader>
                  <CardTitle>日別売上推移</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`¥${Number(value).toLocaleString()}`, '売上']} />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* カテゴリ別売上構成比 */}
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリ別売上構成比</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>売上・参加者数トレンド</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="売上 (¥)" />
                    <Bar yAxisId="right" dataKey="participants" fill="#82ca9d" name="参加者数 (人)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>店舗別売上</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={venueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>売上記録一覧</CardTitle>
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
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          日付
                          {getSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('venue')}
                      >
                        <div className="flex items-center gap-2">
                          店舗
                          {getSortIcon('venue')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('scenario')}
                      >
                        <div className="flex items-center gap-2">
                          シナリオ
                          {getSortIcon('scenario')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('participants')}
                      >
                        <div className="flex items-center gap-2">
                          参加者
                          {getSortIcon('participants')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('revenue')}
                      >
                        <div className="flex items-center gap-2">
                          売上
                          {getSortIcon('revenue')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center gap-2">
                          カテゴリ
                          {getSortIcon('category')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('paymentMethod')}
                      >
                        <div className="flex items-center gap-2">
                          支払方法
                          {getSortIcon('paymentMethod')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('gm')}
                      >
                        <div className="flex items-center gap-2">
                          GM
                          {getSortIcon('gm')}
                        </div>
                      </TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sortField ? sortedSalesRecords : salesRecords).map((record, index) => (
                      <DraggableSalesRow 
                        key={record.id} 
                        index={index} 
                        record={record} 
                        moveRow={(dragIndex, hoverIndex) => {
                          if (sortField) return; // ソート中はドラッグ&ドロップを無効化
                          const newSalesRecords = [...salesRecords];
                          const dragRecord = newSalesRecords[dragIndex];
                          newSalesRecords.splice(dragIndex, 1);
                          newSalesRecords.splice(hoverIndex, 0, dragRecord);
                          setSalesRecords(newSalesRecords);
                        }}
                      >
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.venue}</TableCell>
                        <TableCell>{record.scenario}</TableCell>
                        <TableCell>{record.participants}名</TableCell>
                        <TableCell className="font-mono">¥{record.revenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.category}</Badge>
                        </TableCell>
                        <TableCell>{record.paymentMethod}</TableCell>
                        <TableCell>{record.gm}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>売上記録を削除しますか?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  これにより、{record.venue}の{record.scenario}の売上記録が削除されます。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSalesRecord(record)} className="bg-destructive hover:bg-destructive/90">
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </DraggableSalesRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DndProvider>
  );
}