import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * LocalStorageと同期するuseStateフック
 * データの保存・読み込み・エラーハンドリングを統一
 */
export const usePersistedState = <T>(
  key: string, 
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    onError?: (error: Error, operation: 'read' | 'write') => void;
  }
) => {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;
  const onError = options?.onError;
  
  // 初期値の読み込み（エラーハンドリング付き）
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserialize(item);
    } catch (error) {
      console.error(`Failed to read from localStorage (key: ${key}):`, error);
      onError?.(error as Error, 'read');
      return defaultValue;
    }
  });

  // 前回の値を保持（不要な保存を防ぐため）
  const prevValueRef = useRef<T>(state);

  // 値の更新とLocalStorageへの保存
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(prevState) 
        : value;
      
      // 値が変更されていない場合は保存をスキップ
      if (JSON.stringify(newValue) === JSON.stringify(prevValueRef.current)) {
        return prevState;
      }
      
      try {
        localStorage.setItem(key, serialize(newValue));
        prevValueRef.current = newValue;
      } catch (error) {
        console.error(`Failed to save to localStorage (key: ${key}):`, error);
        onError?.(error as Error, 'write');
        
        // 保存に失敗した場合でも状態は更新する（メモリ上では動作継続）
      }
      
      return newValue;
    });
  }, [key, serialize, onError]);

  // LocalStorageから手動で再読み込み
  const reload = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const newValue = deserialize(item);
        setState(newValue);
        prevValueRef.current = newValue;
      }
    } catch (error) {
      console.error(`Failed to reload from localStorage (key: ${key}):`, error);
      onError?.(error as Error, 'read');
    }
  }, [key, deserialize, onError]);

  // LocalStorageから削除
  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState(defaultValue);
      prevValueRef.current = defaultValue;
    } catch (error) {
      console.error(`Failed to remove from localStorage (key: ${key}):`, error);
      onError?.(error as Error, 'write');
    }
  }, [key, defaultValue, onError]);

  return [state, setValue, { reload, remove }] as const;
};

/**
 * 複数のLocalStorageキーを一括管理するフック
 */
export const usePersistedStates = <T extends Record<string, any>>(
  keys: { [K in keyof T]: { key: string; defaultValue: T[K] } }
) => {
  const states = {} as { [K in keyof T]: T[K] };
  const setters = {} as { [K in keyof T]: (value: T[K] | ((prev: T[K]) => T[K])) => void };
  const utils = {} as { [K in keyof T]: { reload: () => void; remove: () => void } };

  for (const [stateKey, config] of Object.entries(keys)) {
    const [state, setState, stateUtils] = usePersistedState(
      config.key,
      config.defaultValue
    );
    
    states[stateKey as keyof T] = state;
    setters[stateKey as keyof T] = setState;
    utils[stateKey as keyof T] = stateUtils;
  }

  return { states, setters, utils };
};

/**
 * LocalStorageの使用量を監視するフック
 */
export const useLocalStorageUsage = () => {
  const [usage, setUsage] = useState<{
    used: number;
    available: number;
    percentage: number;
  }>({ used: 0, available: 0, percentage: 0 });

  const calculateUsage = useCallback(() => {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      // LocalStorageの制限は通常5-10MB（ブラウザによって異なる）
      // 安全のため5MBとして計算
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (totalSize / maxSize) * 100;
      
      setUsage({
        used: totalSize,
        available: maxSize - totalSize,
        percentage: Math.min(percentage, 100)
      });
    } catch (error) {
      console.error('Failed to calculate localStorage usage:', error);
    }
  }, []);

  useEffect(() => {
    calculateUsage();
    
    // 定期的に使用量を更新
    const interval = setInterval(calculateUsage, 30000); // 30秒ごと
    
    return () => clearInterval(interval);
  }, [calculateUsage]);

  return { usage, refresh: calculateUsage };
};
