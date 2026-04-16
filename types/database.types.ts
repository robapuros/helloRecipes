// Database row types matching the Supabase schema

export interface Recipe {
  id: string
  hf_id: string
  name: string
  slug: string
  description: string | null
  headline: string | null
  total_time_min: number | null
  prep_time_min: number | null
  difficulty: number | null
  image_url: string | null
  average_rating: number | null
  ratings_count: number | null
  cuisines: string[] | null
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  hf_id: string
  name: string
  slug: string | null
  type: string | null
  image_url: string | null
  allergens: string[] | null
  created_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  yields: number
  amount: number | null
  unit: string | null
}

export interface Tag {
  id: string
  hf_id: string
  name: string
  slug: string
  type: string | null
  color_handle: string | null
  display_label: boolean
}

export interface RecipeTag {
  recipe_id: string
  tag_id: string
}

export interface Utensil {
  id: string
  hf_id: string
  name: string
  type: string | null
}

export interface RecipeUtensil {
  recipe_id: string
  utensil_id: string
}

export interface RecipeStep {
  id: string
  recipe_id: string
  step_index: number
  instructions_html: string
  image_url: string | null
}

export interface RecipeNutrition {
  id: string
  recipe_id: string
  calories: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
  sodium_mg: number | null
  yields: number
}

export interface ImportError {
  id: string
  hf_recipe_id: string | null
  hf_recipe_name: string | null
  hf_recipe_url: string | null
  error_type: string | null
  error_message: string | null
  raw_payload: unknown
  created_at: string
  resolved: boolean
  resolved_at: string | null
}

export interface ShoppingList {
  id: string
  name: string
  yields: number
  created_at: string
}

export interface ShoppingListRecipe {
  shopping_list_id: string
  recipe_id: string
}

// Enriched types used in the UI

export interface RecipeWithRelations extends Recipe {
  tags?: Tag[]
  utensils?: Utensil[]
  recipe_ingredients?: (RecipeIngredient & { ingredient: Ingredient })[]
  steps?: RecipeStep[]
  nutrition?: RecipeNutrition | null
}

export interface RecipeCardData {
  id: string
  name: string
  slug: string
  headline: string | null
  total_time_min: number | null
  difficulty: number | null
  image_url: string | null
  average_rating: number | null
  tags: Pick<Tag, 'id' | 'name' | 'slug' | 'type' | 'color_handle'>[]
  /** Only set when an ingredient filter is active */
  matchCount?: number
  /** Only set when an ingredient filter is active */
  totalCount?: number
}

export interface ShoppingListIngredient {
  ingredient_id: string
  name: string
  type: string | null
  image_url: string | null
  total_amount: number | null
  unit: string | null
  recipe_names: string[]
}
