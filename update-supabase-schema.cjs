const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase設定
const supabaseUrl = 'https://lgyhbagdfdyycerijtmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneWhiYWdkZmR5eWNlcmlqdG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0MTM0MjksImV4cCI6MjA1MTk4OTQyOX0.Ey_5Fz4Yl0aSgCBWvnJGYCKLJdGQGKgdHQKJdGQGKgd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEditHistorySchema() {
  try {
    console.log('🔧 edit_historyテーブルのスキーマを更新中...');
    
    // SQLファイルを読み込み
    const sqlPath = path.join(__dirname, 'update-edit-history-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // SQLを実行
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ スキーマ更新エラー:', error);
      
      // 個別にスキーマ更新を試行
      console.log('🔄 個別にスキーマ更新を試行...');
      
      // CHECK制約を削除
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE edit_history DROP CONSTRAINT IF EXISTS edit_history_category_check;"
      });
      
      if (dropError) {
        console.log('⚠️ CHECK制約削除:', dropError.message);
      }
      
      // 新しいCHECK制約を追加
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE edit_history ADD CONSTRAINT edit_history_category_check CHECK (category IN ('staff', 'scenario', 'schedule', 'reservation', 'sales', 'customer', 'inventory', 'store'));"
      });
      
      if (addError) {
        console.error('❌ CHECK制約追加エラー:', addError);
      } else {
        console.log('✅ CHECK制約を更新しました');
      }
      
    } else {
      console.log('✅ スキーマ更新完了:', data);
    }
    
    // テーブル構造を確認
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'edit_history');
      
    if (columnError) {
      console.error('❌ テーブル構造確認エラー:', columnError);
    } else {
      console.log('📋 edit_historyテーブルの構造:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// テスト用の履歴エントリを追加
async function testHistoryEntry() {
  try {
    console.log('🧪 テスト履歴エントリを追加中...');
    
    const testEntry = {
      user: 'テストユーザー',
      action: 'update',
      target: 'テストキット #1',
      summary: 'テスト店舗Aからテスト店舗Bに移動',
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
    
    const { data, error } = await supabase
      .from('edit_history')
      .insert(testEntry)
      .select();
    
    if (error) {
      console.error('❌ テスト履歴追加エラー:', error);
    } else {
      console.log('✅ テスト履歴を追加しました:', data);
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
  }
}

async function main() {
  await updateEditHistorySchema();
  await testHistoryEntry();
}

main();
