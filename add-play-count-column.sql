-- scenariosテーブルにplay_countカラムを追加（存在しない場合）

-- play_countカラムを追加
DO $$ 
BEGIN
    -- play_countカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scenarios' 
        AND column_name = 'play_count'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN play_count INTEGER DEFAULT 0;
        RAISE NOTICE 'play_count column added to scenarios table';
    ELSE
        RAISE NOTICE 'play_count column already exists in scenarios table';
    END IF;
END $$;

-- 既存データの公演数を初期化
UPDATE scenarios 
SET play_count = (
    SELECT COUNT(*) 
    FROM schedule_events 
    WHERE scenario_id = scenarios.id
    AND (is_cancelled = false OR is_cancelled IS NULL)
);

-- シナリオタイトルでもマッチングする場合の初期化（scenario_idがNULLの場合）
UPDATE scenarios 
SET play_count = (
    SELECT COUNT(*) 
    FROM schedule_events 
    WHERE scenario = scenarios.title
    AND (is_cancelled = false OR is_cancelled IS NULL)
    AND scenario_id IS NULL
)
WHERE play_count = 0;

-- 結果確認
SELECT 
    COUNT(*) as total_scenarios,
    SUM(play_count) as total_play_count,
    AVG(play_count) as avg_play_count
FROM scenarios;
