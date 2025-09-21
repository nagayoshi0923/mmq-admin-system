-- 現在のscenariosテーブルの構造を確認するSQL

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
    ordinal_position;
