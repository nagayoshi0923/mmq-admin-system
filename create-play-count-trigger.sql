-- シナリオの公演数を自動更新するトリガーを作成
-- スケジュールイベントが変更されたときに、該当シナリオの公演数を自動で再計算

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS update_scenario_play_count_trigger ON schedule_events;

-- 既存の関数を削除（存在する場合）
DROP FUNCTION IF EXISTS update_scenario_play_count();

-- シナリオの公演数を更新する関数を作成
CREATE OR REPLACE FUNCTION update_scenario_play_count()
RETURNS TRIGGER AS $$
DECLARE
    target_scenario_id TEXT;
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
            AND (scenario_id IS NULL OR scenario_id = '')
        )
        WHERE title = target_scenario_title;
        
        RAISE NOTICE 'Updated play_count for scenario_title: %', target_scenario_title;
    END IF;
    
    -- トリガーの戻り値
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
CREATE TRIGGER update_scenario_play_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON schedule_events
    FOR EACH ROW 
    EXECUTE FUNCTION update_scenario_play_count();

-- 既存データの公演数を初期化
-- 全シナリオの公演数を現在のスケジュールイベントから計算

-- まずplay_countカラムを追加（存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scenarios' 
        AND column_name = 'play_count'
    ) THEN
        ALTER TABLE scenarios ADD COLUMN play_count INTEGER DEFAULT 0;
        RAISE NOTICE 'play_count column added to scenarios table';
    END IF;
END $$;

-- シナリオIDでマッチするイベント数を計算
UPDATE scenarios 
SET play_count = (
    SELECT COUNT(*) 
    FROM schedule_events 
    WHERE scenario_id = scenarios.id
    AND (is_cancelled = false OR is_cancelled IS NULL)
);

-- シナリオタイトルでマッチするイベント数を計算（scenario_idがNULLの場合）
UPDATE scenarios 
SET play_count = (
    SELECT COUNT(*) 
    FROM schedule_events 
    WHERE scenario = scenarios.title
    AND (is_cancelled = false OR is_cancelled IS NULL)
    AND (scenario_id IS NULL OR scenario_id = '')
)
WHERE play_count = 0;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Play count trigger created and existing data initialized successfully';
END $$;
