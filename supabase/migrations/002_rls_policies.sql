-- Row Level Security policies
-- All tables are restricted to authenticated users only
-- (shared single account for the couple)

-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE utensils ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_utensils ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_notes ENABLE ROW LEVEL SECURITY;

-- Authenticated users have full access to all tables
CREATE POLICY "Authenticated full access" ON recipes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON ingredients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON tags
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON utensils
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_tags
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_utensils
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_ingredients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_steps
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_nutrition
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON import_errors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON shopping_lists
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON shopping_list_recipes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_favorites
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON recipe_notes
  FOR ALL USING (auth.role() = 'authenticated');
