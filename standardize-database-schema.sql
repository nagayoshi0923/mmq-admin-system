-- standardize-database-schema.sql
-- データベースのカラム名をスネークケースに統一するSQLスクリプト

-- 1. 既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS update_scenario_play_count_trigger ON schedule_events;
DROP FUNCTION IF EXISTS update_scenario_play_count() CASCADE;

-- 2. scenariosテーブルのカラム名をスネークケースに統一
-- まず、新しいカラムを追加（存在しない場合のみ）

-- licenseAmount -> license_amount
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='licenseAmount') THEN
        -- まず新しいカラムを作成
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='license_amount') THEN
            ALTER TABLE scenarios ADD COLUMN license_amount INTEGER DEFAULT 2500;
            RAISE NOTICE 'Column license_amount created';
        END IF;
        -- データを移行
        UPDATE scenarios SET license_amount = COALESCE(license_amount, "licenseAmount") WHERE "licenseAmount" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "licenseAmount";
        RAISE NOTICE 'Column licenseAmount renamed to license_amount';
    END IF;
END $$;

-- playCount -> play_count
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='playCount') THEN
        -- まず新しいカラムを作成
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='play_count') THEN
            ALTER TABLE scenarios ADD COLUMN play_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Column play_count created';
        END IF;
        -- データを移行
        UPDATE scenarios SET play_count = COALESCE(play_count, "playCount") WHERE "playCount" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "playCount";
        RAISE NOTICE 'Column playCount renamed to play_count';
    END IF;
END $$;

-- playerCount -> player_count_min, player_count_max
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='playerCount') THEN
        -- JSONBから値を抽出して移行
        UPDATE scenarios SET 
            player_count_min = COALESCE(player_count_min, CAST("playerCount"->>'min' AS INTEGER)),
            player_count_max = COALESCE(player_count_max, CAST("playerCount"->>'max' AS INTEGER))
        WHERE "playerCount" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "playerCount";
        RAISE NOTICE 'Column playerCount converted to player_count_min and player_count_max';
    END IF;
END $$;

-- availableGMs -> available_gms
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='availableGMs') THEN
        -- まず新しいカラムを作成
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='available_gms') THEN
            ALTER TABLE scenarios ADD COLUMN available_gms TEXT[] DEFAULT '{}';
            RAISE NOTICE 'Column available_gms created';
        END IF;
        -- データを移行
        UPDATE scenarios SET available_gms = COALESCE(available_gms, "availableGMs") WHERE "availableGMs" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "availableGMs";
        RAISE NOTICE 'Column availableGMs renamed to available_gms';
    END IF;
END $$;

-- requiredProps -> required_props
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='requiredProps') THEN
        -- データを移行
        UPDATE scenarios SET required_props = COALESCE(required_props, "requiredProps") WHERE "requiredProps" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "requiredProps";
        RAISE NOTICE 'Column requiredProps renamed to required_props';
    END IF;
END $$;

-- hasPreReading -> has_pre_reading
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='hasPreReading') THEN
        -- データを移行
        UPDATE scenarios SET has_pre_reading = COALESCE(has_pre_reading, "hasPreReading") WHERE "hasPreReading" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "hasPreReading";
        RAISE NOTICE 'Column hasPreReading renamed to has_pre_reading';
    END IF;
END $$;

-- productionCost -> production_cost
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='productionCost') THEN
        -- データを移行
        UPDATE scenarios SET production_cost = COALESCE(production_cost, "productionCost") WHERE "productionCost" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "productionCost";
        RAISE NOTICE 'Column productionCost renamed to production_cost';
    END IF;
END $$;

-- gmFee -> gm_fee
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='gmFee') THEN
        -- データを移行
        UPDATE scenarios SET gm_fee = COALESCE(gm_fee, "gmFee") WHERE "gmFee" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "gmFee";
        RAISE NOTICE 'Column gmFee renamed to gm_fee';
    END IF;
END $$;

-- miscellaneousExpenses -> miscellaneous_expenses
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='miscellaneousExpenses') THEN
        -- データを移行
        UPDATE scenarios SET miscellaneous_expenses = COALESCE(miscellaneous_expenses, "miscellaneousExpenses") WHERE "miscellaneousExpenses" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "miscellaneousExpenses";
        RAISE NOTICE 'Column miscellaneousExpenses renamed to miscellaneous_expenses';
    END IF;
END $$;

-- licenseRateOverride -> license_rate_override
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='licenseRateOverride') THEN
        -- データを移行
        UPDATE scenarios SET license_rate_override = COALESCE(license_rate_override, "licenseRateOverride") WHERE "licenseRateOverride" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "licenseRateOverride";
        RAISE NOTICE 'Column licenseRateOverride renamed to license_rate_override';
    END IF;
END $$;

-- participationFee -> participation_fee
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='participationFee') THEN
        -- データを移行
        UPDATE scenarios SET participation_fee = COALESCE(participation_fee, "participationFee") WHERE "participationFee" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "participationFee";
        RAISE NOTICE 'Column participationFee renamed to participation_fee';
    END IF;
END $$;

-- releaseDate -> release_date
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='releaseDate') THEN
        -- データを移行
        UPDATE scenarios SET release_date = COALESCE(release_date, "releaseDate") WHERE "releaseDate" IS NOT NULL;
        -- 古いカラムを削除
        ALTER TABLE scenarios DROP COLUMN "releaseDate";
        RAISE NOTICE 'Column releaseDate renamed to release_date';
    END IF;
END $$;

-- 3. 不足しているカラムを追加（スネークケースで）
DO $$ BEGIN
    -- license_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='license_amount') THEN
        ALTER TABLE scenarios ADD COLUMN license_amount INTEGER DEFAULT 2500;
        RAISE NOTICE 'Column license_amount added';
    END IF;
    
    -- play_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='play_count') THEN
        ALTER TABLE scenarios ADD COLUMN play_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Column play_count added';
    END IF;
    
    -- player_count_min, player_count_max
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='player_count_min') THEN
        ALTER TABLE scenarios ADD COLUMN player_count_min INTEGER DEFAULT 1;
        RAISE NOTICE 'Column player_count_min added';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='player_count_max') THEN
        ALTER TABLE scenarios ADD COLUMN player_count_max INTEGER DEFAULT 6;
        RAISE NOTICE 'Column player_count_max added';
    END IF;
    
    -- available_gms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='available_gms') THEN
        ALTER TABLE scenarios ADD COLUMN available_gms TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Column available_gms added';
    END IF;
    
    -- required_props
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='required_props') THEN
        ALTER TABLE scenarios ADD COLUMN required_props TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Column required_props added';
    END IF;
    
    -- has_pre_reading
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='has_pre_reading') THEN
        ALTER TABLE scenarios ADD COLUMN has_pre_reading BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column has_pre_reading added';
    END IF;
    
    -- production_cost
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='production_cost') THEN
        ALTER TABLE scenarios ADD COLUMN production_cost INTEGER DEFAULT 0;
        RAISE NOTICE 'Column production_cost added';
    END IF;
    
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
    
    -- release_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scenarios' AND column_name='release_date') THEN
        ALTER TABLE scenarios ADD COLUMN release_date DATE;
        RAISE NOTICE 'Column release_date added';
    END IF;
END $$;

-- 4. シナリオの公演数を更新する関数を作成（スネークケース対応）
CREATE OR REPLACE FUNCTION update_scenario_play_count()
RETURNS TRIGGER AS $$
DECLARE
    target_scenario_id UUID;
BEGIN
    -- 対象のシナリオIDを決定
    target_scenario_id := COALESCE(NEW.scenario_id, OLD.scenario_id);

    -- シナリオIDが存在する場合のみ更新
    IF target_scenario_id IS NOT NULL THEN
        UPDATE scenarios
        SET play_count = (
            SELECT COUNT(*)
            FROM schedule_events
            WHERE scenario_id = target_scenario_id
            AND (is_cancelled = false OR is_cancelled IS NULL)
        )
        WHERE id = target_scenario_id;

        RAISE NOTICE 'Updated play_count for scenario_id: %', target_scenario_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. トリガーを作成
CREATE TRIGGER update_scenario_play_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION update_scenario_play_count();

-- 6. 既存データの公演数を初期化
UPDATE scenarios
SET play_count = (
    SELECT COUNT(*)
    FROM schedule_events
    WHERE scenario_id = scenarios.id
    AND (is_cancelled = false OR is_cancelled IS NULL)
);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Database schema standardized to snake_case successfully.';
END $$;
