import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Store, Plus } from 'lucide-react';
import { useStores } from '../contexts/StoreContext';

export function StoreManager() {
  const { stores } = useStores();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>店舗管理</h2>
        <div className="flex gap-4 items-center">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規店舗追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            店舗一覧 ({stores.length}店舗)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{store.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {store.address} • 収容{store.capacity}名 • {store.rooms}部屋
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