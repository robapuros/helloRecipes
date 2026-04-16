import { createClient } from '@/lib/supabase/server'
import type { RecipeCardData, RecipeWithRelations } from '@/types/database.types'

export interface RecipeFilters {
  search?: string
  maxTime?: number
  difficulty?: number[]
  tagSlugs?: string[]
  ingredientIds?: string[]
  ingredientMode?: 'all' | 'any'
  utensilIds?: string[]
  favoritesOnly?: boolean
}

export async function getRecipes(filters: RecipeFilters = {}): Promise<RecipeCardData[]> {
  const supabase = await createClient()

  // --- Step 0: fetch favorites for the current session ---
  const { data: favData } = await supabase.from('recipe_favorites').select('recipe_id')
  const favoriteSet = new Set((favData ?? []).map((r: { recipe_id: string }) => r.recipe_id))

  // --- Step 1: collect allowed recipe ID sets from RPC-based filters ---

  const idSets: string[][] = []

  // Favorites-only filter
  if (filters.favoritesOnly) {
    if (favoriteSet.size === 0) return []
    idSets.push([...favoriteSet])
  }

  // Full-text search via RPC
  if (filters.search) {
    const { data } = await supabase.rpc('search_recipes', {
      query_text: filters.search,
    })
    idSets.push((data ?? []).map((r: { id: string }) => r.id))
  }

  // Ingredient filter via RPC
  let matchCountMap: Map<string, { match: number; total: number }> | null = null
  if (filters.ingredientIds && filters.ingredientIds.length > 0) {
    const rpcFn =
      filters.ingredientMode === 'any'
        ? 'recipes_with_any_ingredient'
        : 'recipes_with_all_ingredients'
    const { data: rpcData } = await supabase.rpc(rpcFn, {
      ingredient_ids: filters.ingredientIds,
      serving_size: 2,
    })
    idSets.push((rpcData ?? []).map((r: { id: string }) => r.id))

    // Fetch match counts for badge display
    const { data: countData } = await supabase.rpc('recipes_with_ingredient_match_count', {
      ingredient_ids: filters.ingredientIds,
      serving_size: 2,
    })
    matchCountMap = new Map(
      (countData ?? []).map(
        (r: { recipe_id: string; match_count: number; total_count: number }) => [
          r.recipe_id,
          { match: Number(r.match_count), total: Number(r.total_count) },
        ],
      ),
    )
  }

  // Utensil filter
  if (filters.utensilIds && filters.utensilIds.length > 0) {
    const { data } = await supabase
      .from('recipe_utensils')
      .select('recipe_id')
      .in('utensil_id', filters.utensilIds)
    const ids = [...new Set((data ?? []).map((r) => r.recipe_id))]
    idSets.push(ids)
  }

  // --- Step 2: intersect all ID sets ---
  let allowedIds: string[] | null = null
  if (idSets.length > 0) {
    allowedIds = idSets.reduce((acc, ids) => acc.filter((id) => ids.includes(id)))
    // If intersection is empty, return early
    if (allowedIds.length === 0) return []
  }

  // --- Step 3: main query with scalar filters ---
  let query = supabase
    .from('recipes')
    .select(
      `
      id, name, slug, headline, total_time_min, difficulty, image_url, average_rating,
      recipe_tags (
        tags ( id, name, slug, type, color_handle )
      )
    `,
    )
    .order('name')
    .limit(5000) // PostgREST default cap is 1000 — raise it well above expected collection size

  if (allowedIds) {
    query = query.in('id', allowedIds)
  }
  if (filters.maxTime) {
    query = query.lte('total_time_min', filters.maxTime)
  }
  if (filters.difficulty && filters.difficulty.length > 0) {
    query = query.in('difficulty', filters.difficulty)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  // --- Step 4: JS-level tag filtering & shape results ---
  let results = (data ?? []).map((r) => ({
    ...r,
    tags:
      r.recipe_tags?.flatMap((rt: { tags: unknown }) =>
        Array.isArray(rt.tags) ? rt.tags : rt.tags ? [rt.tags] : [],
      ) ?? [],
    matchCount: matchCountMap?.get(r.id)?.match,
    totalCount: matchCountMap?.get(r.id)?.total,
    isFavorite: favoriteSet.has(r.id),
  })) as RecipeCardData[]

  if (filters.tagSlugs && filters.tagSlugs.length > 0) {
    results = results.filter((r) =>
      filters.tagSlugs!.some((slug) => r.tags.some((t) => t.slug === slug)),
    )
  }

  return results
}

export async function getRecipeBySlug(slug: string): Promise<RecipeWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recipes')
    .select(
      `
      *,
      recipe_tags ( tags (*) ),
      recipe_utensils ( utensils (*) ),
      recipe_steps ( * ),
      recipe_nutrition ( * ),
      recipe_ingredients (
        *,
        ingredients (*)
      )
    `,
    )
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Error fetching recipe by slug:', error)
    return null
  }

  return {
    ...data,
    tags:
      data.recipe_tags?.flatMap((rt: { tags: unknown }) =>
        Array.isArray(rt.tags) ? rt.tags : rt.tags ? [rt.tags] : [],
      ) ?? [],
    utensils:
      data.recipe_utensils?.flatMap((ru: { utensils: unknown }) =>
        Array.isArray(ru.utensils) ? ru.utensils : ru.utensils ? [ru.utensils] : [],
      ) ?? [],
    steps: data.recipe_steps ?? [],
    nutrition: data.recipe_nutrition ?? null,
    // Supabase returns the joined table as `ingredients` (table name).
    // Remap to `ingredient` (singular) to match our RecipeWithRelations type.
    recipe_ingredients: (data.recipe_ingredients ?? []).map(
      (ri: Record<string, unknown>) => ({ ...ri, ingredient: ri.ingredients }),
    ),
  } as RecipeWithRelations
}

export async function getAllRecipeSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('recipes').select('slug')
  return (data ?? []).map((r) => r.slug)
}

export async function getTagsWithCounts(): Promise<
  Array<{ id: string; name: string; slug: string; type: string | null; count: number }>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, type, recipe_tags(count)')
    .order('name')

  if (error || !data) return []

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    type: t.type,
    count: (t.recipe_tags as unknown as Array<{ count: number }>)?.[0]?.count ?? 0,
  }))
}

export async function getAllUtensils(): Promise<
  Array<{ id: string; name: string; type: string | null }>
> {
  const supabase = await createClient()
  const { data } = await supabase.from('utensils').select('id, name, type').order('name')
  return data ?? []
}
