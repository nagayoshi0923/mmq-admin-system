-- gmFee関連のカラムを作成してから移行するSQL

-- 1. まず必要なカラムを作成
DO $$ BEGIN
    -- gmFeeカラムを作成（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'gmFee'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "gmFee" INTEGER DEFAULT 0;
        RAISE NOTICE 'gmFee column created';
    ELSE
        RAISE NOTICE 'gmFee column already exists';
    END IF;
END $$;

-- 2. licenseRateOverrideカラムを作成（存在しない場合のみ）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenseRateOverride'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "licenseRateOverride" INTEGER DEFAULT 0;
        RAISE NOTICE 'licenseRateOverride column created';
    ELSE
        RAISE NOTICE 'licenseRateOverride column already exists';
    END IF;
END $$;

-- 3. データを移行
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
    
    -- gmfeeからgmFeeにデータを移行
    IF gmfee_exists THEN
        UPDATE scenarios 
        SET "gmFee" = gmfee 
        WHERE gmfee IS NOT NULL;
        
        ALTER TABLE scenarios DROP COLUMN gmfee;
        RAISE NOTICE 'gmfee data migrated to gmFee and old column removed';
    ELSE
        RAISE NOTICE 'gmfee column does not exist, skipping migration';
    END IF;
    
    -- licenserateoverrideからlicenseRateOverrideにデータを移行
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

-- 4. 最終確認
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
    RAISE NOTICE 'GM fee columns creation and migration completed successfully.';
END $$;
