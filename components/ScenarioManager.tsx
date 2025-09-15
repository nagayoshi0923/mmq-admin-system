import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { useScenarios } from '../contexts/ScenarioContext';

export function ScenarioManager() {
  const { scenarios } = useScenarios();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>シナリオ管理</h2>
        <div className="flex gap-4 items-center">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規シナリオ追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            シナリオ一覧 ({scenarios.length}件)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{scenario.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {scenario.author} • {scenario.duration}分 • 難易度{scenario.difficulty}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  編集
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}