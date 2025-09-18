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
import { Package, Plus, Edit, Search, Filter, AlertTriangle, CheckCircle, Clock, Archive, MapPin, Calendar, Trash2, ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'prop' | 'costume' | 'document' | 'equipment' | 'consumable';
  subcategory?: string;
  quantity: number;
  unit: string;
  minStock: number;
  currentLocation: string;
  status: 'available' | 'in-use' | 'maintenance' | 'lost' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  usedInScenarios: string[];
  lastUsed?: string;
  nextMaintenance?: string;
  notes?: string;
  imageUrl?: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'transfer' | 'loss' | 'found';
  quantity: number;
  date: string;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  performedBy: string;
  relatedScenario?: string;
}

const ItemType = 'INVENTORY_ROW';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableInventoryRowProps {
  index: number;
  item: InventoryItem;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

function DraggableInventoryRow({ index, item, moveRow, children }: DraggableInventoryRowProps) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: { type: ItemType, id: item.id, index },
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

export function InventoryManager() {
  const { isConnected } = useSupabase();

  // Supabaseから在庫データを取得
  const {
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError,
    insert: insertInventory,
    update: updateInventory,
    delete: deleteInventory,
    refetch: refetchInventory
  } = useSupabaseData<any>({
    table: 'inventory_items',
    realtime: true,
    orderBy: { column: 'name', ascending: true }
  });

  // Supabaseから在庫移動記録を取得
  const {
    data: stockMovementsData,
    loading: movementsLoading,
    error: movementsError,
    insert: insertStockMovement,
    refetch: refetchMovements
  } = useSupabaseData<any>({
    table: 'stock_movements',
    realtime: true,
    orderBy: { column: 'date', ascending: false }
  });

  // データをアプリケーション形式に変換
  const inventory = useMemo(() => {
    if (!Array.isArray(inventoryData)) return [];
    
    return inventoryData.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.min_stock,
      currentLocation: item.current_location,
      status: item.status,
      condition: item.condition,
      purchaseDate: item.purchase_date,
      purchasePrice: item.purchase_price,
      supplier: item.supplier,
      usedInScenarios: item.used_in_scenarios || [],
      lastUsed: item.last_used,
      nextMaintenance: item.next_maintenance,
      notes: item.notes,
      imageUrl: item.image_url
    }));
  }, [inventoryData]);

  const stockMovements = useMemo(() => {
    if (!Array.isArray(stockMovementsData)) return [];
    
    return stockMovementsData.map((movement: any) => ({
      id: movement.id,
      itemId: movement.item_id,
      type: movement.type,
      quantity: movement.quantity,
      date: movement.date,
      fromLocation: movement.from_location,
      toLocation: movement.to_location,
      reason: movement.reason,
      performedBy: movement.performed_by,
      relatedScenario: movement.related_scenario
    }));
  }, [stockMovementsData]);


  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');

  // ソート状態の管理
  const [sortField, setSortField] = useState<keyof InventoryItem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // アイテム削除関数
  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      await deleteInventory(item.id);
    } catch (error) {
      console.error('在庫アイテムの削除に失敗:', error);
    }
  };

  // アイテム保存関数
  const handleSaveItem = async (item: InventoryItem) => {
    try {
      const dbItem = {
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        quantity: item.quantity,
        unit: item.unit,
        min_stock: item.minStock,
        current_location: item.currentLocation,
        status: item.status,
        condition: item.condition,
        purchase_date: item.purchaseDate,
        purchase_price: item.purchasePrice,
        supplier: item.supplier,
        used_in_scenarios: item.usedInScenarios,
        last_used: item.lastUsed,
        next_maintenance: item.nextMaintenance,
        notes: item.notes,
        image_url: item.imageUrl
      };

      if (item.id && inventory.some(i => i.id === item.id)) {
        // 更新
        await updateInventory(item.id, dbItem);
      } else {
        // 新規追加
        await insertInventory(dbItem);
      }
    } catch (error) {
      console.error('在庫アイテムの保存に失敗:', error);
    }
  };

  // ソート処理関数
  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソートアイコンの表示
  const getSortIcon = (field: keyof InventoryItem) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  // フィルタリングされた在庫リスト
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, categoryFilter, statusFilter]);

  // ソートされた在庫リスト
  const sortedFilteredInventory = [...filteredInventory].sort((a, b) => {
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

  // 在庫統計
  const statistics = useMemo(() => {
    const totalItems = inventory.length;
    const availableItems = inventory.filter(item => item.status === 'available').length;
    const lowStockItems = inventory.filter(item => item.quantity <= item.minStock).length;
    const inUseItems = inventory.filter(item => item.status === 'in-use').length;
    const maintenanceItems = inventory.filter(item => item.status === 'maintenance').length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.purchasePrice || 0) * item.quantity, 0);

    return {
      totalItems,
      availableItems,
      lowStockItems,
      inUseItems,
      maintenanceItems,
      totalValue
    };
  }, [inventory]);

  // カテゴリ別集計
  const categoryStats = useMemo(() => {
    const stats = inventory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, value: 0 };
      }
      acc[item.category].count += 1;
      acc[item.category].value += (item.purchasePrice || 0) * item.quantity;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return Object.entries(stats).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value
    }));
  }, [inventory]);

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: InventoryItem['condition']) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    const names = {
      prop: '小道具',
      costume: '衣装',
      document: '資料',
      equipment: '機材',
      consumable: '消耗品'
    };
    return names[category as keyof typeof names] || category;
  };

  const getStatusName = (status: string) => {
    const names = {
      available: '利用可能',
      'in-use': '使用中',
      maintenance: 'メンテナンス',
      lost: '紛失',
      retired: '退役'
    };
    return names[status as keyof typeof names] || status;
  };

  const getConditionName = (condition: string) => {
    const names = {
      excellent: '優秀',
      good: '良好',
      fair: '普通',
      poor: '要交換'
    };
    return names[condition as keyof typeof names] || condition;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h2>在庫管理</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            アイテム追加
          </Button>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総アイテム数</p>
                  <p className="text-lg">{statistics.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">利用可能</p>
                  <p className="text-lg">{statistics.availableItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">在庫少</p>
                  <p className="text-lg">{statistics.lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総資産価値</p>
                  <p className="text-lg">¥{Math.round(statistics.totalValue / 1000)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* タブ切り替え */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">在庫一覧</TabsTrigger>
            <TabsTrigger value="categories">カテゴリ別</TabsTrigger>
            <TabsTrigger value="movements">入出庫履歴</TabsTrigger>
            <TabsTrigger value="alerts">アラート</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            {/* 検索・フィルター */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="アイテム名、サブカテゴリで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="カテゴリ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全カテゴリ</SelectItem>
                  <SelectItem value="prop">小道具</SelectItem>
                  <SelectItem value="costume">衣装</SelectItem>
                  <SelectItem value="document">資料</SelectItem>
                  <SelectItem value="equipment">機材</SelectItem>
                  <SelectItem value="consumable">消耗品</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ステータス</SelectItem>
                  <SelectItem value="available">利用可能</SelectItem>
                  <SelectItem value="in-use">使用中</SelectItem>
                  <SelectItem value="maintenance">メンテナンス</SelectItem>
                  <SelectItem value="lost">紛失</SelectItem>
                  <SelectItem value="retired">退役</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 在庫一覧テーブル */}
            <Card>
              <CardHeader>
                <CardTitle>在庫一覧</CardTitle>
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
                          アイテム名
                          {getSortIcon('name')}
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
                        onClick={() => handleSort('quantity')}
                      >
                        <div className="flex items-center gap-2">
                          在庫数
                          {getSortIcon('quantity')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('currentLocation')}
                      >
                        <div className="flex items-center gap-2">
                          場所
                          {getSortIcon('currentLocation')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          状態
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('condition')}
                      >
                        <div className="flex items-center gap-2">
                          コンディション
                          {getSortIcon('condition')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('lastUsed')}
                      >
                        <div className="flex items-center gap-2">
                          最終使用
                          {getSortIcon('lastUsed')}
                        </div>
                      </TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sortField || categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm ? sortedFilteredInventory : inventory).map((item, index) => (
                      <DraggableInventoryRow
                        key={item.id}
                        index={index}
                        item={item}
                        moveRow={(dragIndex, hoverIndex) => {
                          if (sortField || categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm) return; // フィルタ/ソート中はドラッグ&ドロップを無効化
                          const newInventory = [...inventory];
                          const dragged = newInventory[dragIndex];
                          newInventory.splice(dragIndex, 1);
                          newInventory.splice(hoverIndex, 0, dragged);
                          setInventory(newInventory);
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.subcategory && (
                              <div className="text-sm text-muted-foreground">{item.subcategory}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryName(item.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={item.quantity <= item.minStock ? 'text-red-600 font-semibold' : ''}>
                              {item.quantity} {item.unit}
                            </span>
                            {item.quantity <= item.minStock && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            最小: {item.minStock} {item.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-sm">{item.currentLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusName(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConditionColor(item.condition)}>
                            {getConditionName(item.condition)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.lastUsed && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">{item.lastUsed}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
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
                                  <AlertDialogTitle>アイテムを削除しますか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    「{item.name}」を在庫から削除します。この操作は取り消せません。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteItem(item)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    削除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </DraggableInventoryRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((stat) => (
                <Card key={stat.category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{getCategoryName(stat.category)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>アイテム数:</span>
                        <span className="font-bold">{stat.count}個</span>
                      </div>
                      <div className="flex justify-between">
                        <span>総価値:</span>
                        <span className="font-bold">¥{stat.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>入出庫履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>アイテム</TableHead>
                      <TableHead>種類</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>場所</TableHead>
                      <TableHead>理由</TableHead>
                      <TableHead>実行者</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => {
                      const item = inventory.find(i => i.id === movement.itemId);
                      return (
                        <TableRow key={movement.id}>
                          <TableCell>{movement.date}</TableCell>
                          <TableCell>{item?.name}</TableCell>
                          <TableCell>
                            <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                              {movement.type === 'in' ? '入庫' :
                               movement.type === 'out' ? '出庫' :
                               movement.type === 'transfer' ? '移動' :
                               movement.type === 'loss' ? '紛失' : '発見'}
                            </Badge>
                          </TableCell>
                          <TableCell>{movement.quantity}</TableCell>
                          <TableCell>
                            {movement.fromLocation && movement.toLocation 
                              ? `${movement.fromLocation} → ${movement.toLocation}`
                              : movement.fromLocation || movement.toLocation}
                          </TableCell>
                          <TableCell>{movement.reason}</TableCell>
                          <TableCell>{movement.performedBy}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              {/* 在庫不足アラート */}
              {statistics.lowStockItems > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      在庫不足アラート
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inventory.filter(item => item.quantity <= item.minStock).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              残り {item.quantity} {item.unit}
                            </span>
                          </div>
                          <Button size="sm" variant="outline">
                            発注
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* メンテナンス予定アラート */}
              {inventory.filter(item => item.nextMaintenance).length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      メンテナンス予定
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inventory.filter(item => item.nextMaintenance).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              予定: {item.nextMaintenance}
                            </span>
                          </div>
                          <Button size="sm" variant="outline">
                            メンテナンス開始
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* アイテム詳細・編集ダイアログ */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'アイテム編集' : '新規アイテム追加'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>アイテム名</Label>
                  <Input defaultValue={selectedItem?.name} />
                </div>
                <div>
                  <Label>カテゴリ</Label>
                  <Select defaultValue={selectedItem?.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prop">小道具</SelectItem>
                      <SelectItem value="costume">衣装</SelectItem>
                      <SelectItem value="document">資料</SelectItem>
                      <SelectItem value="equipment">機材</SelectItem>
                      <SelectItem value="consumable">消耗品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>サブカテゴリ</Label>
                  <Input defaultValue={selectedItem?.subcategory} />
                </div>
                <div>
                  <Label>数量</Label>
                  <Input type="number" defaultValue={selectedItem?.quantity} />
                </div>
                <div>
                  <Label>単位</Label>
                  <Input defaultValue={selectedItem?.unit} />
                </div>
                <div>
                  <Label>最小在庫数</Label>
                  <Input type="number" defaultValue={selectedItem?.minStock} />
                </div>
                <div>
                  <Label>保管場所</Label>
                  <Input defaultValue={selectedItem?.currentLocation} />
                </div>
                <div>
                  <Label>ステータス</Label>
                  <Select defaultValue={selectedItem?.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">利用可能</SelectItem>
                      <SelectItem value="in-use">使用中</SelectItem>
                      <SelectItem value="maintenance">メンテナンス</SelectItem>
                      <SelectItem value="lost">紛失</SelectItem>
                      <SelectItem value="retired">退役</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>備考</Label>
                <Textarea defaultValue={selectedItem?.notes} />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={() => {
                  if (selectedItem) {
                    handleSaveItem(selectedItem);
                    setIsDialogOpen(false);
                  }
                }}>
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}