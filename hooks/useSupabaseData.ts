import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseData<T>(options: {
  table: string;
  realtime?: boolean;
  fallbackKey?: string;
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    // 実装は必要に応じて追加
  };

  useEffect(() => {
    // 基本的な実装
    setLoading(false);
  }, []);

  return { data, loading, error, refetch };
}
