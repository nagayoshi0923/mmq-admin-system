import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';

export interface EditHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'create' | 'update' | 'delete';
  target: string;
  summary: string;
  category: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory' | 'store' | 'license';
  changes: {
    field: string;
    oldValue?: string;
    newValue: string;
  }[];
}

interface EditHistoryContextType {
  editHistory: EditHistoryEntry[];
  addEditEntry: (entry: Omit<EditHistoryEntry, 'id' | 'timestamp'>) => void;
  getHistoryByCategory: (category: EditHistoryEntry['category']) => EditHistoryEntry[];
  getHistoryByItem: (itemId: string, itemName: string, category: EditHistoryEntry['category']) => EditHistoryEntry[];
  clearHistory: () => void;
}

const EditHistoryContext = createContext<EditHistoryContextType | undefined>(undefined);

// 編集履歴はSupabaseで管理

// 初期データ
const initialEditHistory: EditHistoryEntry[] = [
  {
    id: '1',
    timestamp: '2025-01-09T16:45:00Z',
    user: 'えなみん',
    action: 'create',
    target: 'しらやま - 新規スタッフ',
    summary: '新規GMスタッフを追加：しらやま',
    category: 'staff',
    changes: [
      { field: '役割', newValue: 'GM' },
      { field: '勤務可能日', newValue: '日, 月夜, 火夜, 水夜, 木夜, 土夜' },
      { field: '専門分野', newValue: 'Recollection, リトルワンダー' },
      { field: '備考', newValue: '週4日上限、プレイヤー参加は一度ご相談ください' }
    ]
  },
  {
    id: '2',
    timestamp: '2025-01-09T15:30:00Z',
    user: 'ソラ',
    action: 'update',
    target: 'れいにー - 備考',
    summary: 'れいにーの備考を更新',
    category: 'staff',
    changes: [
      { field: '備考', oldValue: '', newValue: '4月以降会社の様子見' }
    ]
  },
  {
    id: '3',
    timestamp: '2025-01-09T14:10:00Z',
    user: 'えなみん',
    action: 'update',
    target: 'りえぞー - 勤務条件',
    summary: 'りえぞーの勤務条件を更新',
    category: 'staff',
    changes: [
      { field: '出勤店舗', oldValue: '全店舗', newValue: '大宮' },
      { field: '備考', oldValue: '', newValue: '大宮店のみ公演終了22時半希望' },
      { field: 'NG曜日', oldValue: '', newValue: '水曜昼, 金曜昼, 月曜夜' }
    ]
  }
];

export function EditHistoryProvider({ children }: { children: ReactNode }) {
  // Supabaseから編集履歴データを取得
  const {
    data: supabaseEditHistory,
    loading,
    error,
    insert,
    update,
    delete: deleteEntry,
    refetch
  } = useSupabaseData<any>({
    table: 'edit_history',
    realtime: true,
    orderBy: { column: 'timestamp', ascending: false }
  });

  // Supabaseデータをアプリケーション形式に変換
  const editHistory = useMemo(() => {
    if (!Array.isArray(supabaseEditHistory)) {
      return [];
    }

    return supabaseEditHistory.map((dbEntry: any) => ({
      id: dbEntry.id,
      timestamp: dbEntry.timestamp,
      user: dbEntry.user,
      action: dbEntry.action,
      target: dbEntry.target,
      summary: dbEntry.summary,
      category: dbEntry.category,
      changes: Array.isArray(dbEntry.changes) ? dbEntry.changes : []
    }));
  }, [supabaseEditHistory]);

  const addEditEntry = async (entry: Omit<EditHistoryEntry, 'id' | 'timestamp'>) => {
    try {
      const dbEntryData = {
        user: entry.user,
        action: entry.action,
        target: entry.target,
        summary: entry.summary,
        category: entry.category,
        changes: entry.changes,
        timestamp: new Date().toISOString()
      };
      await insert(dbEntryData);
    } catch (error) {
      console.error('編集履歴追加エラー:', error);
    }
  };

  const getHistoryByCategory = (category: EditHistoryEntry['category']) => {
    return editHistory.filter(entry => entry.category === category);
  };

  const getHistoryByItem = (itemId: string, itemName: string, category: EditHistoryEntry['category']) => {
    return editHistory.filter(entry => 
      entry.category === category && 
      (entry.target.includes(itemName) || entry.target.includes(itemId))
    );
  };

  const clearHistory = async () => {
    try {
      // 全ての履歴を削除（実際の実装では注意が必要）
      console.log('編集履歴のクリア機能は安全のため無効化されています');
    } catch (error) {
      console.error('編集履歴クリアエラー:', error);
    }
  };

  return (
    <EditHistoryContext.Provider value={{ 
      editHistory, 
      addEditEntry, 
      getHistoryByCategory,
      getHistoryByItem, 
      clearHistory 
    }}>
      {children}
    </EditHistoryContext.Provider>
  );
}

export function useEditHistory() {
  const context = useContext(EditHistoryContext);
  if (context === undefined) {
    throw new Error('useEditHistory must be used within an EditHistoryProvider');
  }
  return context;
}