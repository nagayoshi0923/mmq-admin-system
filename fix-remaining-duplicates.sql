-- 残りの重複カラムを修正するSQL

-- 1. availableGMs関連の重複を解決
DO $$ 
DECLARE
    available_gms_exists BOOLEAN;
    availablegms_exists BOOLEAN;
BEGIN
    -- available_gmsカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'available_gms'
    ) INTO available_gms_exists;
    
    -- availablegmsカラムの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'availablegms'
    ) INTO availablegms_exists;
    
    RAISE NOTICE 'available_gms exists: %, availablegms exists: %', available_gms_exists, availablegms_exists;
    
    -- availableGMsカラムを作成（存在しない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'availableGMs'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "availableGMs" TEXT[] DEFAULT '{}';
        RAISE NOTICE 'availableGMs column created';
    END IF;
    
    -- データを移行（available_gmsが存在する場合）
    IF available_gms_exists THEN
        UPDATE scenarios 
        SET "availableGMs" = available_gms 
        WHERE available_gms IS NOT NULL;
        
        ALTER TABLE scenarios DROP COLUMN available_gms;
        RAISE NOTICE 'available_gms data migrated to availableGMs and old column removed';
    END IF;
    
    -- データを移行（availablegmsが存在する場合）
    IF availablegms_exists THEN
        UPDATE scenarios 
        SET "availableGMs" = availablegms 
        WHERE availablegms IS NOT NULL;
        
        ALTER TABLE scenarios DROP COLUMN availablegms;
        RAISE NOTICE 'availablegms data migrated to availableGMs and old column removed';
    END IF;
END $$;

-- 2. license_amountからlicenseAmountにデータを移行
DO $$ 
DECLARE
    license_amount_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'license_amount'
    ) INTO license_amount_exists;
    
    IF license_amount_exists THEN
        -- license_amountのデータをlicenseAmountに移行（licenseAmountが0の場合のみ）
        UPDATE scenarios 
        SET "licenseAmount" = license_amount 
        WHERE license_amount IS NOT NULL 
        AND "licenseAmount" = 0;
        
        ALTER TABLE scenarios DROP COLUMN license_amount;
        RAISE NOTICE 'license_amount data migrated to licenseAmount and old column removed';
    ELSE
        RAISE NOTICE 'license_amount column does not exist, skipping migration';
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
        LOWER(column_name) LIKE '%available%' OR
        LOWER(column_name) LIKE '%license%' OR
        LOWER(column_name) LIKE '%gm%' OR
        LOWER(column_name) LIKE '%fee%'
    )
ORDER BY 
    column_name;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Remaining duplicate columns cleanup completed successfully.';
END $$;
