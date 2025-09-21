-- scenariosテーブルの重複カラムを確認するSQL

-- 1. 現在のテーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'scenarios'
ORDER BY 
    column_name;

-- 2. 類似した名前のカラムを検索
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'scenarios'
    AND (
        LOWER(column_name) LIKE '%license%' OR
        LOWER(column_name) LIKE '%participation%' OR
        LOWER(column_name) LIKE '%player%' OR
        LOWER(column_name) LIKE '%count%' OR
        LOWER(column_name) LIKE '%play%' OR
        LOWER(column_name) LIKE '%fee%'
    )
ORDER BY 
    column_name;
