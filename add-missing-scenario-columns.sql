-- scenariosテーブルに不足しているカラムを追加するSQLスクリプト

-- 1. availableGMsカラムを追加（TEXT配列型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'availableGMs'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN availableGMs TEXT[];
        RAISE NOTICE 'availableGMs column added to scenarios table';
    ELSE
        RAISE NOTICE 'availableGMs column already exists in scenarios table';
    END IF;
END $$;

-- 2. requiredPropsカラムを追加（TEXT配列型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'requiredProps'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN requiredProps TEXT[];
        RAISE NOTICE 'requiredProps column added to scenarios table';
    ELSE
        RAISE NOTICE 'requiredProps column already exists in scenarios table';
    END IF;
END $$;

-- 3. genreカラムを追加（TEXT配列型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'genre'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN genre TEXT[];
        RAISE NOTICE 'genre column added to scenarios table';
    ELSE
        RAISE NOTICE 'genre column already exists in scenarios table';
    END IF;
END $$;

-- 4. hasPreReadingカラムを追加（BOOLEAN型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'hasPreReading'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN hasPreReading BOOLEAN DEFAULT false;
        RAISE NOTICE 'hasPreReading column added to scenarios table';
    ELSE
        RAISE NOTICE 'hasPreReading column already exists in scenarios table';
    END IF;
END $$;

-- 5. productionCostカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'productionCost'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN productionCost INTEGER DEFAULT 0;
        RAISE NOTICE 'productionCost column added to scenarios table';
    ELSE
        RAISE NOTICE 'productionCost column already exists in scenarios table';
    END IF;
END $$;

-- 6. depreciationカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'depreciation'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN depreciation INTEGER DEFAULT 0;
        RAISE NOTICE 'depreciation column added to scenarios table';
    ELSE
        RAISE NOTICE 'depreciation column already exists in scenarios table';
    END IF;
END $$;

-- 7. revenueカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'revenue'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN revenue INTEGER DEFAULT 0;
        RAISE NOTICE 'revenue column added to scenarios table';
    ELSE
        RAISE NOTICE 'revenue column already exists in scenarios table';
    END IF;
END $$;

-- 8. gmFeeカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'gmFee'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN gmFee INTEGER DEFAULT 0;
        RAISE NOTICE 'gmFee column added to scenarios table';
    ELSE
        RAISE NOTICE 'gmFee column already exists in scenarios table';
    END IF;
END $$;

-- 9. miscellaneousExpensesカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'miscellaneousExpenses'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN miscellaneousExpenses INTEGER DEFAULT 0;
        RAISE NOTICE 'miscellaneousExpenses column added to scenarios table';
    ELSE
        RAISE NOTICE 'miscellaneousExpenses column already exists in scenarios table';
    END IF;
END $$;

-- 10. licenseRateOverrideカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'licenseRateOverride'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN licenseRateOverride INTEGER DEFAULT 0;
        RAISE NOTICE 'licenseRateOverride column added to scenarios table';
    ELSE
        RAISE NOTICE 'licenseRateOverride column already exists in scenarios table';
    END IF;
END $$;

-- 11. participationFeeカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'participationFee'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN participationFee INTEGER DEFAULT 0;
        RAISE NOTICE 'participationFee column added to scenarios table';
    ELSE
        RAISE NOTICE 'participationFee column already exists in scenarios table';
    END IF;
END $$;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Missing scenario columns addition completed successfully.';
END $$;
