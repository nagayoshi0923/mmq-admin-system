-- cleanup-remaining-duplicates.sql
-- 残りの重複カラムを整理するSQLスクリプト

-- 1. requiredprops -> required_props へのデータ移行とカラム削除
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='requiredprops') THEN
        -- データを移行
        UPDATE scenarios 
        SET required_props = COALESCE(required_props, requiredprops)
        WHERE requiredprops IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN requiredprops;
        RAISE NOTICE 'Column requiredprops migrated to required_props and dropped';
    END IF;
END $$;

-- 2. hasprereading -> has_pre_reading へのデータ移行とカラム削除
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='hasprereading') THEN
        -- データを移行
        UPDATE scenarios 
        SET has_pre_reading = COALESCE(has_pre_reading, hasprereading)
        WHERE hasprereading IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN hasprereading;
        RAISE NOTICE 'Column hasprereading migrated to has_pre_reading and dropped';
    END IF;
END $$;

-- 3. productioncost -> production_cost へのデータ移行とカラム削除
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='productioncost') THEN
        -- データを移行
        UPDATE scenarios 
        SET production_cost = COALESCE(production_cost, productioncost)
        WHERE productioncost IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN productioncost;
        RAISE NOTICE 'Column productioncost migrated to production_cost and dropped';
    END IF;
END $$;

-- 4. 不足しているカラムを追加
DO $$ BEGIN
    -- gm_fee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='gm_fee') THEN
        ALTER TABLE scenarios ADD COLUMN gm_fee INTEGER DEFAULT 0;
        RAISE NOTICE 'Column gm_fee added';
    END IF;
    
    -- miscellaneous_expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='miscellaneous_expenses') THEN
        ALTER TABLE scenarios ADD COLUMN miscellaneous_expenses INTEGER DEFAULT 0;
        RAISE NOTICE 'Column miscellaneous_expenses added';
    END IF;
    
    -- license_rate_override
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='license_rate_override') THEN
        ALTER TABLE scenarios ADD COLUMN license_rate_override INTEGER DEFAULT 0;
        RAISE NOTICE 'Column license_rate_override added';
    END IF;
    
    -- participation_fee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='participation_fee') THEN
        ALTER TABLE scenarios ADD COLUMN participation_fee INTEGER DEFAULT 0;
        RAISE NOTICE 'Column participation_fee added';
    END IF;
END $$;

-- 5. テーブル構造を確認
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE 'Current scenarios table structure:';
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'scenarios'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable, 
            column_info.column_default;
    END LOOP;
END $$;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Duplicate column cleanup completed successfully.';
END $$;
