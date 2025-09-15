import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

// ローカルストレージのキー
const EDIT_HISTORY_STORAGE_KEY = 'murder-mystery-edit-history';

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
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([]);

  // ローカルストレージから履歴を読み込み
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(EDIT_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setEditHistory(JSON.parse(savedHistory));
      } else {
        setEditHistory(initialEditHistory);
      }
    } catch (error) {
      console.error('編集履歴の読み込みに失敗しました:', error);
      setEditHistory(initialEditHistory);
    }
  }, []);

  // 履歴が変更されたらローカルストレージに保存
  useEffect(() => {
    if (editHistory.length > 0) {
      try {
        localStorage.setItem(EDIT_HISTORY_STORAGE_KEY, JSON.stringify(editHistory));
      } catch (error) {
        console.error('編集履歴の保存に失敗しました:', error);
      }
    }
  }, [editHistory]);

  const addEditEntry = (entry: Omit<EditHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: EditHistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setEditHistory(prev => [newEntry, ...prev.slice(0, 99)]); // 最新100件まで保持
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

  const clearHistory = () => {
    setEditHistory([]);
    localStorage.removeItem(EDIT_HISTORY_STORAGE_KEY);
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