-- PostgreSQL RPC functions for advanced filtering
-- Used by the ingredient search and shopping list aggregation features

-- =========================================================
-- INGREDIENT-BASED RECIPE FILTERING
-- =========================================================

-- Returns recipes that contain ALL of the given ingredient IDs (AND logic)
CREATE OR REPLACE FUNCTION recipes_with_all_ingredients(
  ingredient_ids uuid[],
  serving_size   smallint DEFAULT 2
)
RETURNS SETOF recipes
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT r.*
  FROM recipes r
  WHERE (
    SELECT COUNT(DISTINCT ri.ingredient_id)
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id
      AND ri.ingredient_id = ANY(ingredient_ids)
      AND ri.yields = serving_size
  ) = array_length(ingredient_ids, 1)
  ORDER BY r.name;
$$;

-- Returns recipes that contain ANY of the given ingredient IDs (OR logic)
CREATE OR REPLACE FUNCTION recipes_with_any_ingredient(
  ingredient_ids uuid[],
  serving_size   smallint DEFAULT 2
)
RETURNS SETOF recipes
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT DISTINCT r.*
  FROM recipes r
  JOIN recipe_ingredients ri ON ri.recipe_id = r.id
  WHERE ri.ingredient_id = ANY(ingredient_ids)
    AND ri.yields = serving_size
  ORDER BY r.name;
$$;

-- Returns recipes with a count of how many of the given ingredients they contain
-- Used to show "Tienes X/Y ingredientes" badge on recipe cards
CREATE OR REPLACE FUNCTION recipes_with_ingredient_match_count(
  ingredient_ids uuid[],
  serving_size   smallint DEFAULT 2
)
RETURNS TABLE(
  recipe_id     uuid,
  match_count   bigint,
  total_count   bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    r.id AS recipe_id,
    COUNT(DISTINCT ri.ingredient_id) FILTER (WHERE ri.ingredient_id = ANY(ingredient_ids)) AS match_count,
    COUNT(DISTINCT ri.ingredient_id) AS total_count
  FROM recipes r
  JOIN recipe_ingredients ri ON ri.recipe_id = r.id AND ri.yields = serving_size
  GROUP BY r.id;
$$;

-- =========================================================
-- SHOPPING LIST AGGREGATION
-- =========================================================

-- Aggregates ingredients for all recipes in a shopping list
-- Combines quantities for the same ingredient + unit combination
CREATE OR REPLACE FUNCTION get_shopping_list_ingredients(
  list_id      uuid,
  serving_size smallint DEFAULT 2
)
RETURNS TABLE(
  ingredient_id  uuid,
  name           text,
  type           text,
  image_url      text,
  total_amount   numeric,
  unit           text,
  recipe_names   text[]
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    i.id            AS ingredient_id,
    i.name,
    i.type,
    i.image_url,
    SUM(ri.amount)  AS total_amount,
    ri.unit,
    array_agg(DISTINCT r.name ORDER BY r.name) AS recipe_names
  FROM shopping_list_recipes slr
  JOIN recipe_ingredients ri ON ri.recipe_id = slr.recipe_id
    AND ri.yields = serving_size
  JOIN ingredients i ON i.id = ri.ingredient_id
  JOIN recipes r ON r.id = slr.recipe_id
  WHERE slr.shopping_list_id = list_id
  GROUP BY i.id, i.name, i.type, i.image_url, ri.unit
  ORDER BY
    CASE i.type
      WHEN 'produce'    THEN 1
      WHEN 'vegetable'  THEN 1
      WHEN 'fruit'      THEN 2
      WHEN 'protein'    THEN 3
      WHEN 'meat'       THEN 3
      WHEN 'fish'       THEN 3
      WHEN 'dairy'      THEN 4
      WHEN 'pantry'     THEN 5
      ELSE 6
    END,
    i.name;
$$;

-- Full-text search across recipe names, descriptions, and ingredient names
CREATE OR REPLACE FUNCTION search_recipes(
  query_text text
)
RETURNS SETOF recipes
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT r.*
  FROM recipes r
  WHERE
    to_tsvector('spanish', coalesce(r.name,'') || ' ' || coalesce(r.description,'') || ' ' || coalesce(r.headline,''))
      @@ plainto_tsquery('spanish', query_text)
    OR r.id IN (
      SELECT DISTINCT ri.recipe_id
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE to_tsvector('spanish', i.name) @@ plainto_tsquery('spanish', query_text)
    )
  ORDER BY
    ts_rank(
      to_tsvector('spanish', coalesce(r.name,'') || ' ' || coalesce(r.description,'')),
      plainto_tsquery('spanish', query_text)
    ) DESC;
$$;
