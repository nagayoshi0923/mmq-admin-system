import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useSupabase } from '../contexts/SupabaseContext';

export interface UseSupabaseDataOptions<T> {
  table: string;
  select?: string;
  filter?: { column: string; value: any; operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in' };
  orderBy?: { column: string; ascending?: boolean };
  realtime?: boolean;
  fallbackKey?: string; // localStorageのキー
}

export function useSupabaseData<T>(options: UseSupabaseDataOptions<T>) {
  const { isConnected, enableRealtime } = useSupabase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // localStorageからのフォールバックデータ取得
  const getFallbackData = useCallback((): T[] => {
    if (!options.fallbackKey) return [];
    
    try {
      const stored = localStorage.getItem(options.fallbackKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn(`Failed to parse localStorage data for ${options.fallbackKey}:`, error);
      return [];
    }
  }, [options.fallbackKey]);

  // データ取得関数
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !isConnected) {
      // Supabase未接続時はlocalStorageから取得
      const fallbackData = getFallbackData();
      setData(fallbackData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query: any = supabase.from(options.table);

      // SELECT句の設定
      if (options.select) {
        query = query.select(options.select);
      } else {
        query = query.select('*');
      }

      // フィルター条件の設定
      if (options.filter) {
        const { column, value, operator = 'eq' } = options.filter;
        switch (operator) {
          case 'eq':
            query = query.eq(column, value);
            break;
          case 'neq':
            query = query.neq(column, value);
            break;
          case 'gt':
            query = query.gt(column, value);
            break;
          case 'lt':
            query = query.lt(column, value);
            break;
          case 'gte':
            query = query.gte(column, value);
            break;
          case 'lte':
            query = query.lte(column, value);
            break;
          case 'like':
            query = query.like(column, value);
            break;
          case 'in':
            query = query.in(column, value);
            break;
        }
      }

      // ソート条件の設定
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData(fetchedData || []);
      
    } catch (err) {
      console.error(`Error fetching data from ${options.table}:`, err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      
      // エラー時はフォールバックデータを使用
      const fallbackData = getFallbackData();
      setData(fallbackData);
      
    } finally {
      setLoading(false);
    }
  }, [options, isConnected, getFallbackData]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!isConnected || !enableRealtime || !options.realtime) {
      return;
    }

    const channel = supabase
      .channel(`realtime_${options.table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
        },
        (payload) => {
          console.log(`Realtime update for ${options.table}:`, payload);
          fetchData(); // データを再取得
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConnected, enableRealtime, options.realtime, options.table, fetchData]);

  // 初回データ取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // データ挿入
  const insert = useCallback(async (newData: Partial<T>) => {
    if (!isConnected) {
      throw new Error('Supabaseに接続されていません');
    }

    const { data: insertedData, error } = await supabase
      .from(options.table)
      .insert(newData)
      .select();

    if (error) {
      throw error;
    }

    return insertedData;
  }, [options.table, isConnected]);

  // データ更新
  const update = useCallback(async (id: string, updateData: Partial<T>) => {
    if (!isConnected) {
      throw new Error('Supabaseに接続されていません');
    }

    const { data: updatedData, error } = await supabase
      .from(options.table)
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return updatedData;
  }, [options.table, isConnected]);

  // データ削除
  const remove = useCallback(async (id: string) => {
    if (!isConnected) {
      throw new Error('Supabaseに接続されていません');
    }

    const { error } = await supabase
      .from(options.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }, [options.table, isConnected]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove,
    isConnected
  };
}