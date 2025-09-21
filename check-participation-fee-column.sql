-- participationFeeカラムの存在確認SQL

-- 1. 大文字小文字を区別せずにparticipationFee関連のカラムを検索
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
    AND LOWER(column_name) LIKE '%participation%'
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
    ordinal_position;
