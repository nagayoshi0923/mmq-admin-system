-- scenariosテーブルの現在の構造を確認するSQLスクリプト

-- テーブルの存在確認
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'scenarios';

-- カラムの詳細情報を取得
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'scenarios'
ORDER BY ordinal_position;

-- インデックスの確認
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'scenarios';

-- 制約の確認
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'scenarios'::regclass;
