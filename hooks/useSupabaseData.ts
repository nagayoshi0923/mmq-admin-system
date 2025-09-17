import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseDataOptions {
  table: string;
  realtime?: boolean;
  filter?: (query: any) => any;
  fallbackKey?: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
}

interface UseSupabaseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  insert: (item: Omit<T, 'id'>) => Promise<{ data: T | null; error: string | null }>;
  update: (id: string, updates: Partial<T>) => Promise<{ data: T | null; error: string | null }>;
  delete: (id: string) => Promise<{ error: string | null }>;
  upsert: (item: T) => Promise<{ data: T | null; error: string | null }>;
}

export function useSupabaseData<T extends { id: string }>(
  options: UseSupabaseDataOptions
): UseSupabaseDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // データ取得関数
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // タイムアウト設定（10秒）
    const timeoutId = setTimeout(() => {
      setError('データの読み込みがタイムアウトしました。ネットワーク接続を確認してください。');
      setLoading(false);
    }, 10000);

    try {
      // Supabaseが設定されていない場合はローカルストレージから取得
      if (!isSupabaseConfigured()) {
        console.warn(`Supabase未設定: ${options.table}テーブルのデータをローカルストレージから取得します`);
        if (options.fallbackKey) {
          const localData = localStorage.getItem(options.fallbackKey);
          if (localData) {
            const parsed = JSON.parse(localData);
            setData(Array.isArray(parsed) ? parsed : []);
          }
        }
        setError('Supabase未設定 - ローカルデータを使用中');
        setLoading(false);
        return;
      }

      // Supabaseクエリを構築
      let query = supabase
        .from(options.table)
        .select(options.select || '*');

      // フィルターを適用
      if (options.filter) {
        query = options.filter(query);
      }

      // ソートを適用
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      console.log(`Supabaseからデータを取得中: ${options.table}`);
      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) {
        console.error(`Supabaseクエリエラー (${options.table}):`, fetchError);
        throw fetchError;
      }

      console.log(`データ取得成功 (${options.table}):`, fetchedData?.length || 0, '件');

      setData((fetchedData as unknown as T[]) || []);
      
      // ローカルストレージにもバックアップ保存
      if (options.fallbackKey && fetchedData) {
        localStorage.setItem(options.fallbackKey, JSON.stringify(fetchedData));
      }

    } catch (err: any) {
      console.error(`Error fetching data from ${options.table}:`, err.message);
      setError(err.message);
      
      // エラー時はローカルストレージから復元を試行
      if (options.fallbackKey) {
        try {
          const localData = localStorage.getItem(options.fallbackKey);
          if (localData) {
            const parsed = JSON.parse(localData);
            setData(Array.isArray(parsed) ? parsed : []);
            setError(`Supabase接続エラー。ローカルデータを表示中: ${err.message}`);
          }
        } catch (localErr) {
          console.error('ローカルデータの復元に失敗:', localErr);
        }
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [options.table, options.filter, options.fallbackKey, options.select, options.orderBy]);

  // データ挿入
  const insert = useCallback(async (item: Omit<T, 'id'>) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase未設定' };
    }

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from(options.table)
        .insert(item)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // 手動でローカル状態を更新（リアルタイム同期の遅延対策）
      setData(prev => {
        // 既に存在する場合は重複を防ぐ
        const exists = prev.some(item => item.id === insertedData.id);
        if (exists) {
          return prev;
        }
        return [...prev, insertedData as unknown as T];
      });
      
      // ローカルストレージも更新
      if (options.fallbackKey) {
        const updatedData = [...data, insertedData];
        localStorage.setItem(options.fallbackKey, JSON.stringify(updatedData));
      }

      return { data: insertedData, error: null };
    } catch (err: any) {
      console.error(`Error inserting data to ${options.table}:`, err.message);
      return { data: null, error: err.message };
    }
  }, [options.table, options.fallbackKey, data]);

  // データ更新
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase未設定' };
    }

    try {
      const { data: updatedData, error: updateError } = await supabase
        .from(options.table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 手動でローカル状態を更新（リアルタイム同期の遅延対策）
      setData(prev => prev.map(item => item.id === id ? updatedData as unknown as T : item));
      
      // ローカルストレージも更新
      if (options.fallbackKey) {
        const updatedDataArray = data.map(item => item.id === id ? updatedData : item);
        localStorage.setItem(options.fallbackKey, JSON.stringify(updatedDataArray));
      }

      return { data: updatedData, error: null };
    } catch (err: any) {
      console.error(`Error updating data in ${options.table}:`, err.message);
      return { data: null, error: err.message };
    }
  }, [options.table, options.fallbackKey, data]);

  // データ削除
  const deleteItem = useCallback(async (id: string) => {
    console.log(`🗑️ Attempting to delete from ${options.table} with id:`, id);
    
    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase未設定');
      return { error: 'Supabase未設定' };
    }

    try {
      console.log(`🔄 Executing DELETE query for ${options.table}...`);
      const { error: deleteError, count } = await supabase
        .from(options.table)
        .delete({ count: 'exact' })
        .eq('id', id);

      if (deleteError) {
        console.error(`❌ Supabase DELETE error for ${options.table}:`, deleteError);
        throw deleteError;
      }

      console.log(`✅ Supabase DELETE successful for ${options.table}, affected rows:`, count);
      
      if (count === 0) {
        console.warn(`⚠️ No rows were deleted. ID ${id} may not exist in ${options.table}`);
      }

      // 手動でローカル状態を更新（リアルタイム同期の遅延対策）
      setData(prev => {
        const filtered = prev.filter(item => item.id !== id);
        console.log(`🔄 Local state updated: ${prev.length} -> ${filtered.length} items`);
        return filtered;
      });
      
      // ローカルストレージも更新
      if (options.fallbackKey) {
        const updatedData = data.filter(item => item.id !== id);
        localStorage.setItem(options.fallbackKey, JSON.stringify(updatedData));
        console.log(`💾 Local storage updated for ${options.fallbackKey}`);
      }

      return { error: null };
    } catch (err: any) {
      console.error(`❌ Error deleting data from ${options.table}:`, err.message);
      return { error: err.message };
    }
  }, [options.table, options.fallbackKey, data]);

  // データアップサート（挿入または更新）
  const upsert = useCallback(async (item: T) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase未設定' };
    }

    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from(options.table)
        .upsert(item)
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      // ローカル状態を更新
      setData(prev => {
        const existingIndex = prev.findIndex(existing => existing.id === item.id);
        if (existingIndex >= 0) {
          // 更新
          const updated = [...prev];
          updated[existingIndex] = upsertedData as unknown as T;
          return updated;
        } else {
          // 挿入
          return [...prev, upsertedData as unknown as T];
        }
      });
      
      // ローカルストレージも更新
      if (options.fallbackKey) {
        const existingIndex = data.findIndex(existing => existing.id === item.id);
        let updatedData;
        if (existingIndex >= 0) {
          updatedData = [...data];
          updatedData[existingIndex] = upsertedData;
        } else {
          updatedData = [...data, upsertedData];
        }
        localStorage.setItem(options.fallbackKey, JSON.stringify(updatedData));
      }

      return { data: upsertedData, error: null };
    } catch (err: any) {
      console.error(`Error upserting data to ${options.table}:`, err.message);
      return { data: null, error: err.message };
    }
  }, [options.table, options.fallbackKey, data]);

  // リアルタイム購読の設定
  useEffect(() => {
    if (options.realtime && isSupabaseConfigured()) {
      const channel = supabase
        .channel(`${options.table}-changes`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: options.table 
          }, 
          (payload) => {
            console.log(`🔄 Realtime change in ${options.table}:`, payload.eventType, payload);
            
            switch (payload.eventType) {
              case 'INSERT':
                console.log(`➕ INSERT: Adding new item with id ${payload.new.id}`);
                setData(prev => {
                  // 重複チェック
                  const exists = prev.some(item => item.id === payload.new.id);
                  if (exists) {
                    console.log(`⚠️ Item ${payload.new.id} already exists, skipping INSERT`);
                    return prev;
                  }
                  return [...prev, payload.new as T];
                });
                break;
              case 'UPDATE':
                console.log(`✏️ UPDATE: Updating item with id ${payload.new.id}`);
                setData(prev => prev.map(item => 
                  item.id === payload.new.id ? payload.new as T : item
                ));
                break;
              case 'DELETE':
                console.log(`🗑️ DELETE: Removing item with id ${payload.old.id}`);
                setData(prev => {
                  const filtered = prev.filter(item => item.id !== payload.old.id);
                  console.log(`🗑️ DELETE: Filtered ${prev.length} -> ${filtered.length} items`);
                  return filtered;
                });
                break;
              default:
                console.log(`❓ Unknown event type: ${(payload as any).eventType}`);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Realtime subscription status for ${options.table}:`, status);
        });

      setRealtimeChannel(channel);
      console.log(`🚀 Started realtime subscription for ${options.table}`);

      return () => {
        channel.unsubscribe();
        setRealtimeChannel(null);
      };
    }
  }, [options.realtime, options.table, isSupabaseConfigured()]);

  // 初期データ取得
  useEffect(() => {
    fetchData();
  }, [options.table]); // fetchDataではなくtableのみに依存

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    delete: deleteItem,
    upsert
  };
}