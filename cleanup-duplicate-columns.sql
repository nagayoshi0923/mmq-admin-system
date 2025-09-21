-- scenariosテーブルの重複カラムを整理するSQL

-- 1. ライセンス関連の重複を解決
-- license_amountのデータをlicenseAmountに移行してから削除
DO $$ BEGIN
    -- データを移行（license_amountがnullでない場合）
    UPDATE scenarios 
    SET "licenseAmount" = license_amount 
    WHERE license_amount IS NOT NULL 
    AND "licenseAmount" = 0;
    
    -- 古いカラムを削除
    ALTER TABLE scenarios DROP COLUMN IF EXISTS license_amount;
    
    RAISE NOTICE 'license_amount column removed, data migrated to licenseAmount';
END $$;

-- 2. 公演回数関連の重複を解決
-- play_countのデータをplayCountに移行してから削除
DO $$ BEGIN
    -- データを移行（play_countがnullでない場合）
    UPDATE scenarios 
    SET "playCount" = play_count 
    WHERE play_count IS NOT NULL 
    AND "playCount" = 0;
    
    -- 古いカラムを削除
    ALTER TABLE scenarios DROP COLUMN IF EXISTS play_count;
    
    RAISE NOTICE 'play_count column removed, data migrated to playCount';
END $$;

-- 3. 参加人数関連の重複を解決
-- player_count_min/maxのデータをplayerCountに移行してから削除
DO $$ BEGIN
    -- データを移行（player_count_min/maxがnullでない場合）
    UPDATE scenarios 
    SET "playerCount" = jsonb_build_object(
        'min', COALESCE(player_count_min, 1),
        'max', COALESCE(player_count_max, 6)
    )
    WHERE (player_count_min IS NOT NULL OR player_count_max IS NOT NULL)
    AND ("playerCount" = '{"max": 6, "min": 1}'::jsonb OR "playerCount" IS NULL);
    
    -- 古いカラムを削除
    ALTER TABLE scenarios DROP COLUMN IF EXISTS player_count_min;
    ALTER TABLE scenarios DROP COLUMN IF EXISTS player_count_max;
    
    RAISE NOTICE 'player_count_min/max columns removed, data migrated to playerCount';
END $$;

-- 4. 小文字のカラムをキャメルケースに統一
-- gmfee -> gmFee
DO $$ BEGIN
    -- データを移行
    UPDATE scenarios 
    SET "gmFee" = gmfee 
    WHERE gmfee IS NOT NULL;
    
    -- 古いカラムを削除
    ALTER TABLE scenarios DROP COLUMN IF EXISTS gmfee;
    
    RAISE NOTICE 'gmfee column removed, data migrated to gmFee';
END $$;

-- licenserateoverride -> licenseRateOverride
DO $$ BEGIN
    -- データを移行
    UPDATE scenarios 
    SET "licenseRateOverride" = licenserateoverride 
    WHERE licenserateoverride IS NOT NULL;
    
    -- 古いカラムを削除
    ALTER TABLE scenarios DROP COLUMN IF EXISTS licenserateoverride;
    
    RAISE NOTICE 'licenserateoverride column removed, data migrated to licenseRateOverride';
END $$;

-- 5. 最終確認
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
        LOWER(column_name) LIKE '%fee%' OR
        LOWER(column_name) LIKE '%gm%'
    )
ORDER BY 
    column_name;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Duplicate columns cleanup completed successfully.';
END $$;
