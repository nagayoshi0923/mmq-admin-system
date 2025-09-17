import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Clock, User, Edit, Plus, Trash2 } from 'lucide-react';
import { useEditHistory } from '../contexts/EditHistoryContext';

interface ItemEditHistoryProps {
  itemId: string;
  itemName: string;
  category: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory' | 'store';
}

export function ItemEditHistory({ itemId, itemName, category }: ItemEditHistoryProps) {
  const { editHistory } = useEditHistory();

  console.log('🔍 ItemEditHistory デバッグ情報:', {
    itemId,
    itemName,
    category,
    totalHistory: editHistory.length,
    allCategories: [...new Set(editHistory.map(e => e.category))],
    storeEntries: editHistory.filter(e => e.category === 'store')
  });

  // 特定の項目に関連する編集履歴をフィルタリング
  const itemHistory = editHistory.filter(entry => {
    const categoryMatch = entry.category === category;
    const nameMatch = entry.target.includes(itemName);
    const idMatch = entry.target.includes(itemId);
    
    console.log('📋 履歴エントリチェック:', {
      entry: entry.target,
      categoryMatch,
      nameMatch,
      idMatch,
      result: categoryMatch && (nameMatch || idMatch)
    });
    
    return categoryMatch && (nameMatch || idMatch);
  });

  console.log('✅ フィルタリング結果:', {
    matchedEntries: itemHistory.length,
    entries: itemHistory.map(e => ({ target: e.target, summary: e.summary }))
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Edit className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (itemHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            編集履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>この項目の編集履歴はありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          編集履歴
          <Badge variant="secondary">{itemHistory.length}件</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {itemName} の編集履歴
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {itemHistory.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getActionIcon(entry.action)}
                    <Badge className={getActionBadgeColor(entry.action)}>
                      {entry.action === 'create' ? '作成' :
                       entry.action === 'update' ? '更新' :
                       entry.action === 'delete' ? '削除' : entry.action}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp)}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{entry.user}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.summary}</p>
                </div>

                {entry.changes && entry.changes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      変更内容
                    </h4>
                    <div className="space-y-1">
                      {entry.changes.map((change, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium">{change.field}:</span>
                          {change.oldValue && (
                            <span className="text-red-600 line-through ml-1">
                              {change.oldValue}
                            </span>
                          )}
                          {change.oldValue && change.newValue && (
                            <span className="mx-1">→</span>
                          )}
                          <span className="text-green-600 ml-1">
                            {change.newValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}