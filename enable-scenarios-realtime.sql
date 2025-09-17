-- シナリオテーブルのリアルタイム機能を有効化
-- SupabaseのSQL Editorで実行してください

-- リアルタイム機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE scenarios;

-- 権限の確認と設定
GRANT ALL ON scenarios TO anon;
GRANT ALL ON scenarios TO authenticated;

-- 削除権限の確認
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'scenarios' AND cmd = 'DELETE';
