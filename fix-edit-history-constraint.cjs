const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lgyhbagdfdyycerijtmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneWhiYWdkZmR5eWNlcmlqdG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjA5ODMsImV4cCI6MjA3Mjg5Njk4M30.J4o6O65dr4EwM4Ak1fq5qE479EFMpLT4rOxuHQfRQC4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEditHistoryConstraint() {
  console.log('🔧 edit_historyテーブルのCHECK制約を修正中...\n');

  // 現在の制約を確認
  console.log('1️⃣ 現在の制約を確認');
  try {
    // 制約の削除を試行（RPC関数を使用）
    console.log('2️⃣ 古いCHECK制約を削除中...');
    
    // 直接SQLを実行するためのRPC関数を作成する必要があります
    // 代わりに、アプリケーション側で対処します
    
    console.log('⚠️ Supabase AnonymousキーではDDL操作ができません');
    console.log('📋 以下のSQLをSupabaseダッシュボードのSQL Editorで実行してください:\n');
    
    const sql = `
-- 1. 既存のCHECK制約を削除
ALTER TABLE edit_history DROP CONSTRAINT IF EXISTS edit_history_category_check;

-- 2. 新しいCHECK制約を追加（'store'を含む）
ALTER TABLE edit_history ADD CONSTRAINT edit_history_category_check 
CHECK (category IN ('staff', 'scenario', 'schedule', 'reservation', 'sales', 'customer', 'inventory', 'store'));

-- 3. 確認用クエリ
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'edit_history_category_check';
`;
    
    console.log(sql);
    console.log('\n📌 上記SQLを実行後、以下のテストを実行してください:');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// テスト関数
async function testStoreCategory() {
  console.log('\n🧪 store カテゴリのテスト');
  
  const testEntry = {
    user: 'テストユーザー',
    action: 'update',
    target: 'テストシナリオ キット#1',
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

  try {
    const { data, error } = await supabase
      .from('edit_history')
      .insert(testEntry)
      .select();
    
    if (error) {
      console.error('❌ テスト失敗:', error);
    } else {
      console.log('✅ テスト成功:', data);
      
      // テストデータを削除
      if (data && data[0]) {
        await supabase
          .from('edit_history')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️ テストデータを削除しました');
      }
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
  }
}

async function main() {
  await fixEditHistoryConstraint();
  
  console.log('\n⏳ SQL実行後にテストを実行する場合は、以下のコマンドを実行してください:');
  console.log('node -e "require(\'./fix-edit-history-constraint.cjs\').testStoreCategory()"');
}

// エクスポート
module.exports = { testStoreCategory };

main();
