import { useEditHistory, EditHistoryEntry } from '../contexts/EditHistoryContext';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock, User, Edit, Plus, Trash2 } from 'lucide-react';

interface ItemEditHistoryProps {
  itemId: string;
  itemName: string;
  category: EditHistoryEntry['category'];
  maxEntries?: number;
}

export function ItemEditHistory({ itemId, itemName, category, maxEntries = 5 }: ItemEditHistoryProps) {
  const { getHistoryByItem } = useEditHistory();
  
  const history = getHistoryByItem(itemId, itemName, category).slice(0, maxEntries);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            編集履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">編集履歴はありません。</p>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: EditHistoryEntry['action']) => {
    switch (action) {
      case 'create':
        return <Plus className="w-3 h-3 text-green-600" />;
      case 'update':
        return <Edit className="w-3 h-3 text-blue-600" />;
      case 'delete':
        return <Trash2 className="w-3 h-3 text-red-600" />;
      default:
        return <Edit className="w-3 h-3" />;
    }
  };

  const getActionColor = (action: EditHistoryEntry['action']) => {
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

  const getActionText = (action: EditHistoryEntry['action']) => {
    switch (action) {
      case 'create':
        return '作成';
      case 'update':
        return '更新';
      case 'delete':
        return '削除';
      default:
        return '変更';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          編集履歴
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getActionIcon(entry.action)}
                <Badge className={getActionColor(entry.action)}>
                  {getActionText(entry.action)}
                </Badge>
                <span className="text-sm font-medium">{entry.summary}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {entry.user}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {formatDate(entry.timestamp)}
            </div>

            {entry.changes.length > 0 && (
              <div className="space-y-1">
                {entry.changes.map((change, index) => (
                  <div key={index} className="text-xs bg-muted/50 rounded px-2 py-1">
                    <span className="font-medium">{change.field}:</span>{' '}
                    {change.oldValue && (
                      <span className="text-red-600 line-through">{change.oldValue}</span>
                    )}
                    {change.oldValue && ' → '}
                    <span className="text-green-600">{change.newValue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {history.length === maxEntries && (
          <p className="text-xs text-muted-foreground text-center">
            最新{maxEntries}件を表示中
          </p>
        )}
      </CardContent>
    </Card>
  );
}