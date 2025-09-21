-- gmFee関連のカラムを確認するSQL

-- 1. gmFee関連のカラムを検索
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
        LOWER(column_name) LIKE '%gm%' OR
        LOWER(column_name) LIKE '%fee%'
    )
ORDER BY 
    column_name;

-- 2. 全てのカラムを表示（参考用）
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
