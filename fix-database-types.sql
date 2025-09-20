-- データ型の不一致を修正するSQL
-- このファイルをSupabaseのSQL Editorで実行してください

-- 1. 既存のscenario_idカラムを削除（データがある場合は注意）
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedule_events' 
        AND column_name = 'scenario_id'
    ) THEN
        ALTER TABLE schedule_events DROP COLUMN scenario_id;
        RAISE NOTICE 'scenario_id column dropped from schedule_events table';
    END IF;
END $$;

-- 2. scenario_idカラムをUUID型で再作成
ALTER TABLE schedule_events ADD COLUMN scenario_id UUID REFERENCES scenarios(id);

-- 3. 既存データのscenario_idを更新（シナリオタイトルからマッチング）
UPDATE schedule_events 
SET scenario_id = (
    SELECT s.id 
    FROM scenarios s 
    WHERE s.title = schedule_events.scenario
    LIMIT 1
)
WHERE scenario_id IS NULL 
AND scenario IS NOT NULL 
AND scenario != '';

-- 4. scenariosテーブルにplay_countカラムを追加（存在しない場合）
DO $$ 
BEGIN
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

-- 5. 既存データの公演数を初期化
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

-- 6. 既存のトリガーと関数を削除（存在する場合）
DROP TRIGGER IF EXISTS update_scenario_play_count_trigger ON schedule_events;
DROP FUNCTION IF EXISTS update_scenario_play_count() CASCADE;

-- 7. シナリオの公演数を更新する関数を作成（UUID型対応）
CREATE OR REPLACE FUNCTION update_scenario_play_count()
RETURNS TRIGGER AS $$
DECLARE
    target_scenario_id UUID;
    target_scenario_title TEXT;
BEGIN
    -- 対象のシナリオIDとタイトルを決定
    -- INSERT/UPDATEの場合はNEWから、DELETEの場合はOLDから取得
    target_scenario_id := COALESCE(NEW.scenario_id, OLD.scenario_id);
    target_scenario_title := COALESCE(NEW.scenario, OLD.scenario);
    
    -- シナリオIDでマッチする場合
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
    
    -- シナリオタイトルでマッチする場合（scenario_idがNULLの場合）
    IF target_scenario_title IS NOT NULL THEN
        UPDATE scenarios 
        SET play_count = (
            SELECT COUNT(*) 
            FROM schedule_events 
            WHERE scenario = target_scenario_title
            AND (is_cancelled = false OR is_cancelled IS NULL)
            AND scenario_id IS NULL
        )
        WHERE title = target_scenario_title;
        
        RAISE NOTICE 'Updated play_count for scenario_title: %', target_scenario_title;
    END IF;
    
    -- トリガーの戻り値
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. トリガーを作成
CREATE TRIGGER update_scenario_play_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON schedule_events
    FOR EACH ROW 
    EXECUTE FUNCTION update_scenario_play_count();

-- 9. 結果確認
SELECT 
    'schedule_events' as table_name,
    COUNT(*) as total_events,
    COUNT(scenario_id) as events_with_scenario_id,
    COUNT(*) - COUNT(scenario_id) as events_without_scenario_id
FROM schedule_events
UNION ALL
SELECT 
    'scenarios' as table_name,
    COUNT(*) as total_scenarios,
    SUM(play_count) as total_play_count,
    AVG(play_count) as avg_play_count
FROM scenarios;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Database types fixed successfully!';
    RAISE NOTICE 'scenario_id is now UUID type with foreign key constraint';
    RAISE NOTICE 'play_count column added to scenarios';
    RAISE NOTICE 'Play count trigger created and initialized';
END $$;
