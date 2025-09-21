-- 制作費項目リストカラムを追加
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS production_cost_items JSONB DEFAULT '[]';
UPDATE scenarios SET production_cost_items = '[]' WHERE production_cost_items IS NULL;
ALTER TABLE scenarios ALTER COLUMN production_cost_items SET NOT NULL;
