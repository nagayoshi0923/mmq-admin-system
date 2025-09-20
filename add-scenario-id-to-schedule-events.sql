-- schedule_eventsテーブルにscenario_idカラムを追加

-- scenario_idカラムを追加
DO $$ 
BEGIN
    -- scenario_idカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedule_events' 
        AND column_name = 'scenario_id'
    ) THEN
        ALTER TABLE schedule_events ADD COLUMN scenario_id TEXT;
        RAISE NOTICE 'scenario_id column added to schedule_events table';
    ELSE
        RAISE NOTICE 'scenario_id column already exists in schedule_events table';
    END IF;
END $$;

-- 既存データのscenario_idを更新（シナリオタイトルからマッチング）
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

-- 結果確認
SELECT 
    COUNT(*) as total_events,
    COUNT(scenario_id) as events_with_scenario_id,
    COUNT(*) - COUNT(scenario_id) as events_without_scenario_id
FROM schedule_events;
