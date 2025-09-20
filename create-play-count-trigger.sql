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
BEGIN
    -- 対象のシナリオIDを決定
    -- INSERT/UPDATEの場合はNEWから、DELETEの場合はOLDから取得
    target_scenario_id := COALESCE(NEW.scenario_id, OLD.scenario_id);
    
    -- シナリオIDが存在する場合のみ更新
    IF target_scenario_id IS NOT NULL THEN
        -- 該当シナリオの公演数を再計算して更新
        UPDATE scenarios 
        SET play_count = (
            SELECT COUNT(*) 
            FROM schedule_events 
            WHERE scenario_id = target_scenario_id
            AND is_cancelled = false
        )
        WHERE id = target_scenario_id;
        
        -- ログ出力（デバッグ用）
        RAISE NOTICE 'Updated play_count for scenario_id: %', target_scenario_id;
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
UPDATE scenarios 
SET play_count = (
    SELECT COUNT(*) 
    FROM schedule_events 
    WHERE scenario_id = scenarios.id
    AND is_cancelled = false
);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Play count trigger created and existing data initialized successfully';
END $$;
