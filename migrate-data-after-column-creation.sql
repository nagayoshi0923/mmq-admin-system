-- カラム作成後のデータ移行SQL

-- ステップ1: 古いカラムの存在を確認
DO $$ 
DECLARE
    gmfee_exists BOOLEAN;
    licenserateoverride_exists BOOLEAN;
BEGIN
    -- gmfeeカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'gmfee'
    ) INTO gmfee_exists;
    
    -- licenserateoverrideカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenserateoverride'
    ) INTO licenserateoverride_exists;
    
    RAISE NOTICE 'gmfee exists: %, licenserateoverride exists: %', gmfee_exists, licenserateoverride_exists;
END $$;

-- ステップ2: gmfeeからgmFeeにデータを移行（存在する場合のみ）
DO $$ 
DECLARE
    gmfee_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'gmfee'
    ) INTO gmfee_exists;
    
    IF gmfee_exists THEN
        UPDATE scenarios 
        SET "gmFee" = gmfee 
        WHERE gmfee IS NOT NULL;
        
        ALTER TABLE scenarios DROP COLUMN gmfee;
        RAISE NOTICE 'gmfee data migrated to gmFee and old column removed';
    ELSE
        RAISE NOTICE 'gmfee column does not exist, skipping migration';
    END IF;
END $$;

-- ステップ3: licenserateoverrideからlicenseRateOverrideにデータを移行（存在する場合のみ）
DO $$ 
DECLARE
    licenserateoverride_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenserateoverride'
    ) INTO licenserateoverride_exists;
    
    IF licenserateoverride_exists THEN
        UPDATE scenarios 
        SET "licenseRateOverride" = licenserateoverride 
        WHERE licenserateoverride IS NOT NULL;
        
        ALTER TABLE scenarios DROP COLUMN licenserateoverride;
        RAISE NOTICE 'licenserateoverride data migrated to licenseRateOverride and old column removed';
    ELSE
        RAISE NOTICE 'licenserateoverride column does not exist, skipping migration';
    END IF;
END $$;

-- ステップ4: 最終確認
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

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Data migration completed successfully.';
END $$;
