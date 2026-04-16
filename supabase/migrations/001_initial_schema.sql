-- HelloRecipes initial schema
-- Run this in the Supabase SQL editor or via `supabase db push`

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- MASTER TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS tags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hf_id        text UNIQUE NOT NULL,
  name         text NOT NULL,
  slug         text UNIQUE NOT NULL,
  type         text,
  color_handle text,
  display_label boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS utensils (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hf_id text UNIQUE NOT NULL,
  name  text NOT NULL,
  type  text
);

CREATE TABLE IF NOT EXISTS ingredients (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hf_id     text UNIQUE NOT NULL,
  name      text NOT NULL,
  slug      text,
  type      text,
  image_url text,
  allergens text[],
  created_at timestamptz DEFAULT now()
);

-- =========================================================
-- RECIPES
-- =========================================================

CREATE TABLE IF NOT EXISTS recipes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hf_id           text UNIQUE NOT NULL,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  headline        text,
  total_time_min  integer,
  prep_time_min   integer,
  difficulty      smallint CHECK (difficulty BETWEEN 0 AND 3),
  image_url       text,
  average_rating  numeric(3,2),
  ratings_count   integer,
  cuisines        text[],
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =========================================================
-- JUNCTION TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id    uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE TABLE IF NOT EXISTS recipe_utensils (
  recipe_id  uuid REFERENCES recipes(id) ON DELETE CASCADE,
  utensil_id uuid REFERENCES utensils(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, utensil_id)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  yields        smallint NOT NULL,
  amount        numeric,
  unit          text,
  UNIQUE (recipe_id, ingredient_id, yields)
);

-- =========================================================
-- RECIPE DETAIL TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS recipe_steps (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id         uuid REFERENCES recipes(id) ON DELETE CASCADE,
  step_index        smallint NOT NULL,
  instructions_html text NOT NULL,
  image_url         text,
  UNIQUE (recipe_id, step_index)
);

CREATE TABLE IF NOT EXISTS recipe_nutrition (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid REFERENCES recipes(id) ON DELETE CASCADE UNIQUE,
  calories   numeric,
  protein_g  numeric,
  fat_g      numeric,
  carbs_g    numeric,
  fiber_g    numeric,
  sodium_mg  numeric,
  yields     smallint DEFAULT 2
);

-- =========================================================
-- IMPORT ERRORS
-- =========================================================

CREATE TABLE IF NOT EXISTS import_errors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hf_recipe_id     text,
  hf_recipe_name   text,
  hf_recipe_url    text,
  error_type       text,
  error_message    text,
  raw_payload      jsonb,
  created_at       timestamptz DEFAULT now(),
  resolved         boolean DEFAULT false,
  resolved_at      timestamptz
);

-- =========================================================
-- SHOPPING LISTS
-- =========================================================

CREATE TABLE IF NOT EXISTS shopping_lists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL DEFAULT 'Lista de la compra',
  yields     smallint DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_list_recipes (
  shopping_list_id uuid REFERENCES shopping_lists(id) ON DELETE CASCADE,
  recipe_id        uuid REFERENCES recipes(id) ON DELETE CASCADE,
  PRIMARY KEY (shopping_list_id, recipe_id)
);

-- =========================================================
-- USER EXTRAS (Sprint 5)
-- =========================================================

CREATE TABLE IF NOT EXISTS recipe_favorites (
  recipe_id  uuid REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid REFERENCES recipes(id) ON DELETE CASCADE UNIQUE,
  content    text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- =========================================================
-- INDEXES
-- =========================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes(total_time_min);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- Full-text search indexes (Spanish dictionary)
CREATE INDEX IF NOT EXISTS idx_recipes_fts ON recipes USING GIN(
  to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(headline,''))
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name_fts ON ingredients USING GIN(
  to_tsvector('spanish', name)
);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
