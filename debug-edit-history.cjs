const { createClient } = require('@supabase/supabase-js');

// Supabase設定（実際の値に置き換えてください）
const supabaseUrl = 'https://lgyhbagdfdyycerijtmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneWhiYWdkZmR5eWNlcmlqdG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjA5ODMsImV4cCI6MjA3Mjg5Njk4M30.J4o6O65dr4EwM4Ak1fq5qE479EFMpLT4rOxuHQfRQC4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEditHistory() {
  console.log('🔍 編集履歴デバッグ開始...\n');

  // 1. Supabase接続テスト
  console.log('1️⃣ Supabase接続テスト');
  try {
    const { data, error } = await supabase.from('staff').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase接続エラー:', error);
      return;
    }
    console.log('✅ Supabase接続成功\n');
  } catch (error) {
    console.error('❌ Supabase接続失敗:', error);
    return;
  }

  // 2. edit_historyテーブルの存在確認
  console.log('2️⃣ edit_historyテーブルの存在確認');
  try {
    const { data, error } = await supabase
      .from('edit_history')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ edit_historyテーブルアクセスエラー:', error);
      
      // テーブル作成を試行
      console.log('🔧 edit_historyテーブルを作成中...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS edit_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          "user" TEXT NOT NULL,
          action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
          target TEXT NOT NULL,
          summary TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('staff', 'scenario', 'schedule', 'reservation', 'sales', 'customer', 'inventory', 'store')),
          changes JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // RLS設定
      const rlsSQL = `
        ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
        CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON edit_history FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow anonymous read access" ON edit_history FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS "Allow anonymous write access" ON edit_history FOR INSERT USING (true);
        CREATE POLICY IF NOT EXISTS "Allow anonymous update access" ON edit_history FOR UPDATE USING (true);
        CREATE POLICY IF NOT EXISTS "Allow anonymous delete access" ON edit_history FOR DELETE USING (true);
      `;
      
      console.log('SQL実行結果は手動で確認してください');
      console.log('テーブル作成SQL:', createTableSQL);
      console.log('RLS設定SQL:', rlsSQL);
    } else {
      console.log('✅ edit_historyテーブル存在確認完了\n');
    }
  } catch (error) {
    console.error('❌ テーブル確認エラー:', error);
  }

  // 3. 既存データの確認
  console.log('3️⃣ 既存の編集履歴データ確認');
  try {
    const { data, error } = await supabase
      .from('edit_history')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('❌ データ取得エラー:', error);
    } else {
      console.log(`📊 既存履歴データ: ${data.length}件`);
      console.log('カテゴリ別内訳:');
      const categories = {};
      data.forEach(entry => {
        categories[entry.category] = (categories[entry.category] || 0) + 1;
      });
      console.table(categories);
      
      if (data.length > 0) {
        console.log('\n最新の履歴エントリ:');
        console.table(data.slice(0, 3));
      }
    }
  } catch (error) {
    console.error('❌ データ確認エラー:', error);
  }

  // 4. テスト履歴エントリの挿入
  console.log('\n4️⃣ テスト履歴エントリの挿入');
  const testEntry = {
    user: 'デバッグテスト',
    action: 'update',
    target: 'テストシナリオ キット#1',
    summary: 'テスト店舗Aからテスト店舗Bに移動（デバッグ用）',
    category: 'store',
    changes: [
      {
        field: '所在店舗',
        oldValue: 'テスト店舗A',
        newValue: 'テスト店舗B'
      }
    ],
    timestamp: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('edit_history')
      .insert(testEntry)
      .select();
    
    if (error) {
      console.error('❌ テスト履歴挿入エラー:', error);
      console.log('エラー詳細:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ テスト履歴挿入成功:', data);
    }
  } catch (error) {
    console.error('❌ テスト履歴挿入失敗:', error);
  }

  // 5. store カテゴリのデータ確認
  console.log('\n5️⃣ store カテゴリの履歴データ確認');
  try {
    const { data, error } = await supabase
      .from('edit_history')
      .select('*')
      .eq('category', 'store')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('❌ store カテゴリデータ取得エラー:', error);
    } else {
      console.log(`📊 store カテゴリの履歴: ${data.length}件`);
      if (data.length > 0) {
        console.table(data);
      }
    }
  } catch (error) {
    console.error('❌ store カテゴリ確認エラー:', error);
  }

  // 6. テーブル構造の確認
  console.log('\n6️⃣ edit_historyテーブル構造の確認');
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'edit_history')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('❌ テーブル構造確認エラー:', error);
    } else {
      console.log('📋 テーブル構造:');
      console.table(data);
    }
  } catch (error) {
    console.error('❌ テーブル構造確認失敗:', error);
  }

  console.log('\n🔍 デバッグ完了');
}

debugEditHistory();
