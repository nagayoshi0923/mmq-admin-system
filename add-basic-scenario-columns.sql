-- scenariosテーブルに基本的なカラムを追加するSQLスクリプト

-- 1. licenseAmountカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'licenseAmount'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN licenseAmount INTEGER DEFAULT 0;
        RAISE NOTICE 'licenseAmount column added to scenarios table';
    ELSE
        RAISE NOTICE 'licenseAmount column already exists in scenarios table';
    END IF;
END $$;

-- 2. playerCountカラムを追加（JSON型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'playerCount'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN playerCount JSONB DEFAULT '{"min": 1, "max": 6}';
        RAISE NOTICE 'playerCount column added to scenarios table';
    ELSE
        RAISE NOTICE 'playerCount column already exists in scenarios table';
    END IF;
END $$;

-- 3. difficultyカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN difficulty INTEGER DEFAULT 3;
        RAISE NOTICE 'difficulty column added to scenarios table';
    ELSE
        RAISE NOTICE 'difficulty column already exists in scenarios table';
    END IF;
END $$;

-- 4. ratingカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN rating INTEGER DEFAULT 0;
        RAISE NOTICE 'rating column added to scenarios table';
    ELSE
        RAISE NOTICE 'rating column already exists in scenarios table';
    END IF;
END $$;

-- 5. playCountカラムを追加（INTEGER型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'playCount'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN playCount INTEGER DEFAULT 0;
        RAISE NOTICE 'playCount column added to scenarios table';
    ELSE
        RAISE NOTICE 'playCount column already exists in scenarios table';
    END IF;
END $$;

-- 6. statusカラムを追加（TEXT型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN status TEXT DEFAULT 'available';
        RAISE NOTICE 'status column added to scenarios table';
    ELSE
        RAISE NOTICE 'status column already exists in scenarios table';
    END IF;
END $$;

-- 7. notesカラムを追加（TEXT型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN notes TEXT;
        RAISE NOTICE 'notes column added to scenarios table';
    ELSE
        RAISE NOTICE 'notes column already exists in scenarios table';
    END IF;
END $$;

-- 8. releaseDateカラムを追加（DATE型）
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenarios'
        AND column_name = 'releaseDate'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN releaseDate DATE;
        RAISE NOTICE 'releaseDate column added to scenarios table';
    ELSE
        RAISE NOTICE 'releaseDate column already exists in scenarios table';
    END IF;
END $$;

-- 9. participationFeeカラムを追加（INTEGER型）
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
    RAISE NOTICE 'Basic scenario columns addition completed successfully.';
END $$;
