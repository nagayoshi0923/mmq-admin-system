-- 公演数カウントのデバッグ用SQL

-- 1. シナリオテーブルの構造確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scenarios' 
AND column_name LIKE '%play%'
ORDER BY ordinal_position;

-- 2. スケジュールイベントテーブルの構造確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'schedule_events' 
AND (column_name LIKE '%scenario%' OR column_name LIKE '%cancelled%')
ORDER BY ordinal_position;

-- 3. 現在のシナリオの公演数
SELECT id, title, play_count 
FROM scenarios 
ORDER BY play_count DESC 
LIMIT 10;

-- 4. スケジュールイベントのサンプルデータ
SELECT id, scenario_id, scenario, is_cancelled, start_time, end_time
FROM schedule_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. シナリオIDでマッチするイベント数（手動計算）
SELECT 
    s.id as scenario_id,
    s.title,
    s.play_count as current_play_count,
    COUNT(se.id) as actual_event_count
FROM scenarios s
LEFT JOIN schedule_events se ON (
    se.scenario_id = s.id 
    AND (se.is_cancelled = false OR se.is_cancelled IS NULL)
)
GROUP BY s.id, s.title, s.play_count
ORDER BY actual_event_count DESC
LIMIT 10;

-- 6. シナリオタイトルでマッチするイベント数（手動計算）
SELECT 
    s.id as scenario_id,
    s.title,
    s.play_count as current_play_count,
    COUNT(se.id) as actual_event_count_by_title
FROM scenarios s
LEFT JOIN schedule_events se ON (
    se.scenario = s.title 
    AND (se.is_cancelled = false OR se.is_cancelled IS NULL)
)
GROUP BY s.id, s.title, s.play_count
ORDER BY actual_event_count_by_title DESC
LIMIT 10;
