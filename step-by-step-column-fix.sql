-- 段階的にカラムを修正するSQL

-- ステップ1: 現在の状況を確認
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
        LOWER(column_name) LIKE '%fee%' OR
        LOWER(column_name) LIKE '%license%'
    )
ORDER BY 
    column_name;

-- ステップ2: gmFeeカラムを作成（存在しない場合のみ）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'gmFee'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "gmFee" INTEGER DEFAULT 0;
        RAISE NOTICE 'gmFee column created successfully';
    ELSE
        RAISE NOTICE 'gmFee column already exists';
    END IF;
END $$;

-- ステップ3: licenseRateOverrideカラムを作成（存在しない場合のみ）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenseRateOverride'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "licenseRateOverride" INTEGER DEFAULT 0;
        RAISE NOTICE 'licenseRateOverride column created successfully';
    ELSE
        RAISE NOTICE 'licenseRateOverride column already exists';
    END IF;
END $$;

-- ステップ4: 作成後の状況を確認
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
        LOWER(column_name) LIKE '%fee%' OR
        LOWER(column_name) LIKE '%license%'
    )
ORDER BY 
    column_name;
