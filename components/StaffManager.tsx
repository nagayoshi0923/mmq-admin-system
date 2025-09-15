import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Plus } from 'lucide-react';
import { useStaff } from '../contexts/StaffContext';

export function StaffManager() {
  const { staff } = useStaff();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>スタッフ管理</h2>
        <div className="flex gap-4 items-center">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規スタッフ追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            スタッフ一覧 ({staff.length}名)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role.join(', ')}</p>
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