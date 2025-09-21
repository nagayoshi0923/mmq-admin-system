-- gmFeeカラムの移行を修正するSQL

-- 1. まずgmFee関連のカラムを確認
DO $$ 
DECLARE
    gmfee_exists BOOLEAN;
    gmFee_exists BOOLEAN;
BEGIN
    -- gmfeeカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'gmfee'
    ) INTO gmfee_exists;
    
    -- gmFeeカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'gmFee'
    ) INTO gmFee_exists;
    
    RAISE NOTICE 'gmfee exists: %, gmFee exists: %', gmfee_exists, gmFee_exists;
    
    -- gmfeeが存在し、gmFeeが存在しない場合
    IF gmfee_exists AND NOT gmFee_exists THEN
        -- gmFeeカラムを作成
        ALTER TABLE scenarios ADD COLUMN "gmFee" INTEGER DEFAULT 0;
        RAISE NOTICE 'gmFee column created';
        
        -- データを移行
        UPDATE scenarios 
        SET "gmFee" = gmfee 
        WHERE gmfee IS NOT NULL;
        
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN gmfee;
        
        RAISE NOTICE 'gmfee data migrated to gmFee and old column removed';
    ELSIF gmFee_exists THEN
        RAISE NOTICE 'gmFee column already exists';
    ELSE
        RAISE NOTICE 'Neither gmfee nor gmFee column exists';
    END IF;
END $$;

-- 2. 同様にlicenseRateOverrideも確認・修正
DO $$ 
DECLARE
    licenserateoverride_exists BOOLEAN;
    licenseRateOverride_exists BOOLEAN;
BEGIN
    -- licenserateoverrideカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenserateoverride'
    ) INTO licenserateoverride_exists;
    
    -- licenseRateOverrideカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenseRateOverride'
    ) INTO licenseRateOverride_exists;
    
    RAISE NOTICE 'licenserateoverride exists: %, licenseRateOverride exists: %', licenserateoverride_exists, licenseRateOverride_exists;
    
    -- licenserateoverrideが存在し、licenseRateOverrideが存在しない場合
    IF licenserateoverride_exists AND NOT licenseRateOverride_exists THEN
        -- licenseRateOverrideカラムを作成
        ALTER TABLE scenarios ADD COLUMN "licenseRateOverride" INTEGER DEFAULT 0;
        RAISE NOTICE 'licenseRateOverride column created';
        
        -- データを移行
        UPDATE scenarios 
        SET "licenseRateOverride" = licenserateoverride 
        WHERE licenserateoverride IS NOT NULL;
        
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN licenserateoverride;
        
        RAISE NOTICE 'licenserateoverride data migrated to licenseRateOverride and old column removed';
    ELSIF licenseRateOverride_exists THEN
        RAISE NOTICE 'licenseRateOverride column already exists';
    ELSE
        RAISE NOTICE 'Neither licenserateoverride nor licenseRateOverride column exists';
    END IF;
END $$;

-- 3. 最終確認
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
    RAISE NOTICE 'GM fee column migration completed successfully.';
END $$;
