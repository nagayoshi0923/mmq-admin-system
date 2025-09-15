import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { useEditHistory, EditHistoryEntry } from '../contexts/EditHistoryContext';
import { Clock, User, Edit, Plus, Trash2 } from 'lucide-react';

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
  'reservation': 'bg-green-100 text-green-800'
};

const categoryLabels = {
  'staff': 'スタッフ',
  'scenario': 'シナリオ',
  'schedule': 'スケジュール',
  'reservation': '予約'
};

interface EditHistoryProps {
  title?: string;
  variant?: 'horizontal' | 'vertical';
  category?: EditHistoryEntry['category'];
  limit?: number;
}

export function EditHistory({ 
  title = "編集履歴", 
  variant = 'vertical',
  category,
  limit = 10
}: EditHistoryProps) {
  const { editHistory, getHistoryByCategory } = useEditHistory();
  
  const displayHistory = category 
    ? getHistoryByCategory(category).slice(0, limit)
    : editHistory.slice(0, limit);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (variant === 'horizontal') {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {displayHistory.length > 0 ? (
              displayHistory.slice(0, 3).map((entry) => {
                const ActionIcon = actionIcons[entry.action];
                return (
                  <div key={entry.id} className="flex items-center gap-2 p-2 rounded text-xs">
                    <ActionIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <Badge className={`${actionColors[entry.action]} text-xs px-1 py-0`}>
                      {actionLabels[entry.action]}
                    </Badge>
                    {!category && (
                      <Badge className={`${categoryColors[entry.category]} text-xs px-1 py-0`}>
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
              <p className="text-center text-muted-foreground py-2 text-xs">
                編集履歴はありません
              </p>
            )}
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
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayHistory.length > 0 ? (
            displayHistory.map((entry) => {
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
                        <span className="text-sm">{entry.target}</span>
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
      </CardContent>
    </Card>
  );
}