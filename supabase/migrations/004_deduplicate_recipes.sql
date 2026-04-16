-- Deduplicate recipes by name.
-- For each group of recipes with the same (case-insensitive, trimmed) name,
-- keep the best one: prefer higher average_rating, then more ratings_count,
-- then most recently updated.
-- All child rows (steps, ingredients, tags, etc.) cascade automatically.

DELETE FROM recipes
WHERE id NOT IN (
  SELECT DISTINCT ON (lower(trim(name))) id
  FROM recipes
  ORDER BY
    lower(trim(name)),
    average_rating   DESC NULLS LAST,
    ratings_count    DESC NULLS LAST,
    updated_at       DESC NULLS LAST
);
