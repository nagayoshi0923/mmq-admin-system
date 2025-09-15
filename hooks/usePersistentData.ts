import { useState, useEffect, useRef } from 'react';
import { dataStorage } from '../utils/dataStorage';

interface UsePersistentDataOptions<T> {
  key: string;
  defaultValue: T;
  saveOnChange?: boolean;
  debounceMs?: number;
  enableBackup?: boolean;
}

/**
 * データを永続化するカスタムフック
 * コンポーネントの再マウント時でもデータを保持する
 */
export function usePersistentData<T>({
  key,
  defaultValue,
  saveOnChange = true,
  debounceMs = 500,
  enableBackup = true
}: UsePersistentDataOptions<T>) {
  
  const [data, setData] = useState<T>(() => {
    // 初期値をlocalStorageから読み込み
    const saved = dataStorage.loadData<T>(key, defaultValue);
    return saved || defaultValue;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // データ保存の実行
  const saveData = (newData: T) => {
    try {
      setError(null);
      dataStorage.saveData(key, newData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ保存に失敗しました';
      setError(errorMessage);
      console.error(`データ保存エラー (${key}):`, err);
    }
  };

  // デバウンス付きでデータを保存
  const debouncedSave = (newData: T) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveData(newData);
    }, debounceMs);
  };

  // データ更新関数
  const updateData = (newData: T | ((prevData: T) => T)) => {
    setData(prevData => {
      const updatedData = typeof newData === 'function' ? (newData as Function)(prevData) : newData;
      
      if (saveOnChange) {
        debouncedSave(updatedData);
      }
      
      return updatedData;
    });
  };

  // 手動でデータを保存
  const manualSave = () => {
    saveData(data);
  };

  // データを強制的に再読み込み
  const reload = () => {
    setIsLoading(true);
    try {
      const saved = dataStorage.loadData<T>(key, defaultValue);
      setData(saved || defaultValue);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ読み込みに失敗しました';
      setError(errorMessage);
      console.error(`データ読み込みエラー (${key}):`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // データをリセット
  const reset = () => {
    setData(defaultValue);
    if (saveOnChange) {
      saveData(defaultValue);
    }
  };

  // 最終保存時刻を取得
  const getLastSavedTime = () => {
    return dataStorage.getLastSavedTime(key);
  };

  // コンポーネントのアンマウント時に保存
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveData(data);
      }
    };
  }, [data, key]);

  return {
    data,
    updateData,
    manualSave,
    reload,
    reset,
    isLoading,
    error,
    getLastSavedTime,
    hasUnsavedChanges: saveTimeoutRef.current !== undefined
  };
}

/**
 * リスト形式のデータに特化したカスタムフック
 */
export function usePersistentList<T extends { id: string }>({
  key,
  defaultValue = [] as T[],
  saveOnChange = true,
  debounceMs = 500
}: Omit<UsePersistentDataOptions<T[]>, 'defaultValue'> & { defaultValue?: T[] }) {
  
  const {
    data: items,
    updateData,
    manualSave,
    reload,
    reset,
    isLoading,
    error,
    getLastSavedTime,
    hasUnsavedChanges
  } = usePersistentData({
    key,
    defaultValue,
    saveOnChange,
    debounceMs
  });

  // アイテムを追加
  const addItem = (item: T) => {
    updateData(prevItems => [...prevItems, item]);
  };

  // アイテムを更新
  const updateItem = (id: string, updatedItem: Partial<T>) => {
    updateData(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, ...updatedItem } : item
      )
    );
  };

  // アイテムを削除
  const removeItem = (id: string) => {
    updateData(prevItems => prevItems.filter(item => item.id !== id));
  };

  // アイテムを検索
  const findItem = (id: string) => {
    return items.find(item => item.id === id);
  };

  // リスト全体を置き換え
  const replaceItems = (newItems: T[]) => {
    updateData(newItems);
  };

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    findItem,
    replaceItems,
    manualSave,
    reload,
    reset,
    isLoading,
    error,
    getLastSavedTime,
    hasUnsavedChanges,
    count: items.length
  };
}

/**
 * 複数のキーでデータを同期するカスタムフック
 */
export function usePersistentSync<T>(keys: string[], defaultValue: T) {
  const [syncedData, setSyncedData] = useState<Record<string, T>>(() => {
    const initial: Record<string, T> = {};
    keys.forEach(key => {
      initial[key] = dataStorage.loadData<T>(key, defaultValue) || defaultValue;
    });
    return initial;
  });

  const updateSyncedData = (key: string, newData: T) => {
    setSyncedData(prev => ({
      ...prev,
      [key]: newData
    }));
    dataStorage.saveData(key, newData);
  };

  const syncAll = () => {
    keys.forEach(key => {
      const data = dataStorage.loadData<T>(key, defaultValue);
      if (data) {
        setSyncedData(prev => ({
          ...prev,
          [key]: data
        }));
      }
    });
  };

  return {
    syncedData,
    updateSyncedData,
    syncAll
  };
}