import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { useEditHistory, EditHistoryEntry } from '../contexts/EditHistoryContext';
import { Clock, User, Edit, Plus, Trash2, Eye } from 'lucide-react';

const actionColors = {
  'create': 'bg-green-100 text-green-800',
  'update': 'bg-blue-100 text-blue-800',
  'delete': 'bg-red-100 text-red-800'
};

const actionLabels = {
  'create': '新規作成',
  'update': '更新',
  'delete': '削除'
};

const actionIcons = {
  'create': Plus,
  'update': Edit,
  'delete': Trash2
};

const categoryColors = {
  'staff': 'bg-purple-100 text-purple-800',
  'scenario': 'bg-orange-100 text-orange-800',
  'schedule': 'bg-blue-100 text-blue-800',
  'reservation': 'bg-green-100 text-green-800',
  'sales': 'bg-yellow-100 text-yellow-800',
  'customer': 'bg-pink-100 text-pink-800',
  'inventory': 'bg-indigo-100 text-indigo-800'
};

const categoryLabels = {
  'staff': 'スタッフ',
  'scenario': 'シナリオ',
  'schedule': 'スケジュール',
  'reservation': '予約',
  'sales': '売上',
  'customer': '顧客',
  'inventory': '在庫'
};

interface CompactEditHistoryProps {
  category?: EditHistoryEntry['category'];
  title?: string;
}

export function CompactEditHistory({ 
  category,
  title = "最近の編集履歴"
}: CompactEditHistoryProps) {
  const { editHistory, getHistoryByCategory } = useEditHistory();
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);
  
  const recentHistory = category 
    ? getHistoryByCategory(category).slice(0, 3)
    : editHistory.slice(0, 3);

  const allHistory = category 
    ? getHistoryByCategory(category)
    : editHistory;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {title}
        </h4>
        <Dialog open={isFullHistoryOpen} onOpenChange={setIsFullHistoryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              全て見る
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>編集履歴一覧 {category && `- ${categoryLabels[category]}`}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-3">
                {allHistory.length > 0 ? (
                  allHistory.map((entry) => {
                    const ActionIcon = actionIcons[entry.action];
                    return (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <ActionIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={actionColors[entry.action]}>
                                {actionLabels[entry.action]}
                              </Badge>
                              {!category && (
                                <Badge className={categoryColors[entry.category]}>
                                  {categoryLabels[entry.category]}
                                </Badge>
                              )}
                              <span className="text-sm font-medium">{entry.target}</span>
                            </div>
                            
                            <p className="text-sm mb-3">{entry.summary}</p>
                            
                            <div className="space-y-1">
                              {entry.changes.map((change, index) => (
                                <div key={index} className="text-xs text-muted-foreground">
                                  <span className="font-medium">{change.field}:</span>
                                  {change.oldValue && (
                                    <span className="ml-1">
                                      <span className="line-through text-red-600">{change.oldValue}</span>
                                      {' → '}
                                    </span>
                                  )}
                                  <span className="text-green-600">{change.newValue}</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                              <User className="w-3 h-3" />
                              <span>{entry.user}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{formatTimestamp(entry.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    編集履歴はありません
                  </p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-1">
        {recentHistory.length > 0 ? (
          recentHistory.map((entry) => {
            const ActionIcon = actionIcons[entry.action];
            return (
              <div 
                key={entry.id} 
                className="flex items-center gap-2 py-1 text-xs hover:bg-muted/50 rounded px-1"
                style={{ height: '30px' }}
              >
                <ActionIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <Badge className={`${actionColors[entry.action]} text-xs px-1.5 py-0.5 text-[10px]`}>
                  {actionLabels[entry.action]}
                </Badge>
                {!category && (
                  <Badge className={`${categoryColors[entry.category]} text-xs px-1.5 py-0.5 text-[10px]`}>
                    {categoryLabels[entry.category]}
                  </Badge>
                )}
                <span className="truncate flex-1 text-xs">{entry.summary}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
            );
          })
        ) : (
          <div 
            className="flex items-center justify-center text-xs text-muted-foreground"
            style={{ height: '90px' }}
          >
            編集履歴はありません
          </div>
        )}
      </div>
    </div>
  );
}