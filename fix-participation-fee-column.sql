-- participationFeeカラムの問題を修正するSQLスクリプト

-- 1. 既存のparticipationfeeカラム（小文字）を確認
DO $$ 
DECLARE
    column_exists_lower BOOLEAN;
    column_exists_upper BOOLEAN;
BEGIN
    -- 小文字のparticipationfeeカラムが存在するかチェック
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'participationfee'
    ) INTO column_exists_lower;
    
    -- 大文字小文字混在のparticipationFeeカラムが存在するかチェック
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'participationFee'
    ) INTO column_exists_upper;
    
    -- 小文字のカラムが存在し、大文字小文字混在のカラムが存在しない場合
    IF column_exists_lower AND NOT column_exists_upper THEN
        -- 小文字のカラムを削除して、正しい名前で再作成
        ALTER TABLE scenarios DROP COLUMN participationfee;
        ALTER TABLE scenarios ADD COLUMN "participationFee" INTEGER DEFAULT 0;
        RAISE NOTICE 'participationfee column renamed to participationFee';
    -- 大文字小文字混在のカラムが既に存在する場合
    ELSIF column_exists_upper THEN
        RAISE NOTICE 'participationFee column already exists';
    -- どちらも存在しない場合
    ELSE
        ALTER TABLE scenarios ADD COLUMN "participationFee" INTEGER DEFAULT 0;
        RAISE NOTICE 'participationFee column added';
    END IF;
END $$;

-- 2. 他の基本的なカラムも同様にチェック・追加
-- licenseAmountカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'licenseAmount'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "licenseAmount" INTEGER DEFAULT 0;
        RAISE NOTICE 'licenseAmount column added';
    ELSE
        RAISE NOTICE 'licenseAmount column already exists';
    END IF;
END $$;

-- playerCountカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'playerCount'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "playerCount" JSONB DEFAULT '{"min": 1, "max": 6}';
        RAISE NOTICE 'playerCount column added';
    ELSE
        RAISE NOTICE 'playerCount column already exists';
    END IF;
END $$;

-- difficultyカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN difficulty INTEGER DEFAULT 3;
        RAISE NOTICE 'difficulty column added';
    ELSE
        RAISE NOTICE 'difficulty column already exists';
    END IF;
END $$;

-- ratingカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN rating INTEGER DEFAULT 0;
        RAISE NOTICE 'rating column added';
    ELSE
        RAISE NOTICE 'rating column already exists';
    END IF;
END $$;

-- playCountカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'playCount'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "playCount" INTEGER DEFAULT 0;
        RAISE NOTICE 'playCount column added';
    ELSE
        RAISE NOTICE 'playCount column already exists';
    END IF;
END $$;

-- statusカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN status TEXT DEFAULT 'available';
        RAISE NOTICE 'status column added';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- notesカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN notes TEXT;
        RAISE NOTICE 'notes column added';
    ELSE
        RAISE NOTICE 'notes column already exists';
    END IF;
END $$;

-- releaseDateカラム
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'scenarios'
        AND column_name = 'releaseDate'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN "releaseDate" DATE;
        RAISE NOTICE 'releaseDate column added';
    ELSE
        RAISE NOTICE 'releaseDate column already exists';
    END IF;
END $$;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Participation fee column fix completed successfully.';
END $$;
