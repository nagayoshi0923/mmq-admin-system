-- 既存のscenariosテーブルに不足しているカラムを追加

-- player_countカラムを追加（既存のテーブルにない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'player_count') THEN
        ALTER TABLE scenarios ADD COLUMN player_count JSONB DEFAULT '{"min": 3, "max": 6}';
    END IF;
END $$;

-- その他の不足しているカラムを追加
DO $$ 
BEGIN
    -- production_costカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'production_cost') THEN
        ALTER TABLE scenarios ADD COLUMN production_cost INTEGER DEFAULT 0;
    END IF;
    
    -- depreciationカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'depreciation') THEN
        ALTER TABLE scenarios ADD COLUMN depreciation INTEGER DEFAULT 0;
    END IF;
    
    -- revenueカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'revenue') THEN
        ALTER TABLE scenarios ADD COLUMN revenue INTEGER DEFAULT 0;
    END IF;
    
    -- gm_feeカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'gm_fee') THEN
        ALTER TABLE scenarios ADD COLUMN gm_fee INTEGER DEFAULT 0;
    END IF;
    
    -- miscellaneous_expensesカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'miscellaneous_expenses') THEN
        ALTER TABLE scenarios ADD COLUMN miscellaneous_expenses INTEGER DEFAULT 0;
    END IF;
    
    -- license_rate_overrideカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'license_rate_override') THEN
        ALTER TABLE scenarios ADD COLUMN license_rate_override DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- has_pre_readingカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'has_pre_reading') THEN
        ALTER TABLE scenarios ADD COLUMN has_pre_reading BOOLEAN DEFAULT false;
    END IF;
    
    -- release_dateカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'release_date') THEN
        ALTER TABLE scenarios ADD COLUMN release_date DATE;
    END IF;
    
    -- genreカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'genre') THEN
        ALTER TABLE scenarios ADD COLUMN genre TEXT[] DEFAULT '{}';
    END IF;
    
    -- required_propsカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'required_props') THEN
        ALTER TABLE scenarios ADD COLUMN required_props TEXT[] DEFAULT '{}';
    END IF;
    
    -- available_gmsカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'available_gms') THEN
        ALTER TABLE scenarios ADD COLUMN available_gms TEXT[] DEFAULT '{}';
    END IF;
    
    -- ratingカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'rating') THEN
        ALTER TABLE scenarios ADD COLUMN rating DECIMAL(3,1) DEFAULT 4.0;
    END IF;
    
    -- play_countカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'play_count') THEN
        ALTER TABLE scenarios ADD COLUMN play_count INTEGER DEFAULT 0;
    END IF;
    
    -- statusカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'status') THEN
        ALTER TABLE scenarios ADD COLUMN status TEXT DEFAULT 'available';
    END IF;
    
    -- difficultyカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'difficulty') THEN
        ALTER TABLE scenarios ADD COLUMN difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5);
    END IF;
    
    -- durationカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'duration') THEN
        ALTER TABLE scenarios ADD COLUMN duration INTEGER;
    END IF;
    
    -- license_amountカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'license_amount') THEN
        ALTER TABLE scenarios ADD COLUMN license_amount INTEGER DEFAULT 2500;
    END IF;
    
    -- authorカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'author') THEN
        ALTER TABLE scenarios ADD COLUMN author TEXT;
    END IF;
    
    -- descriptionカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'description') THEN
        ALTER TABLE scenarios ADD COLUMN description TEXT;
    END IF;
    
    -- notesカラム
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scenarios' AND column_name = 'notes') THEN
        ALTER TABLE scenarios ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 制約を追加
DO $$ 
BEGIN
    -- statusカラムにCHECK制約を追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'scenarios_status_check') THEN
        ALTER TABLE scenarios ADD CONSTRAINT scenarios_status_check 
        CHECK (status IN ('available', 'unavailable', 'archived'));
    END IF;
    
    -- difficultyカラムにCHECK制約を追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'scenarios_difficulty_check') THEN
        ALTER TABLE scenarios ADD CONSTRAINT scenarios_difficulty_check 
        CHECK (difficulty >= 1 AND difficulty <= 5);
    END IF;
END $$;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_scenarios_title ON scenarios(title);
CREATE INDEX IF NOT EXISTS idx_scenarios_author ON scenarios(author);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at);

-- コメントを追加
COMMENT ON TABLE scenarios IS 'シナリオ管理テーブル';
COMMENT ON COLUMN scenarios.player_count IS 'プレイ人数（最小・最大）';
COMMENT ON COLUMN scenarios.production_cost IS '制作費（円）';
COMMENT ON COLUMN scenarios.depreciation IS '減価償却（円）';
COMMENT ON COLUMN scenarios.revenue IS '売上（円）';
COMMENT ON COLUMN scenarios.gm_fee IS 'GM代（円）';
COMMENT ON COLUMN scenarios.miscellaneous_expenses IS '雑費（円）';
COMMENT ON COLUMN scenarios.license_rate_override IS 'ライセンス率の例外（%）';
