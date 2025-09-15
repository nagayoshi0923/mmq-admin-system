import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Code, Plus } from 'lucide-react';

export function DevelopmentManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>開発管理</h2>
        <div className="flex gap-4 items-center">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規タスク追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            開発タスク一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            開発管理機能は準備中です
          </div>
        </CardContent>
      </Card>
    </div>
  );
}