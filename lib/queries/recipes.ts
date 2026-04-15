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
}

export async function getRecipes(filters: RecipeFilters = {}): Promise<RecipeCardData[]> {
  const supabase = await createClient()

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

  // Filter by tags (done in JS since Supabase nested filtering is limited)
  let results = (data ?? []).map((r) => ({
    ...r,
    tags: r.recipe_tags?.flatMap((rt: { tags: unknown }) =>
      Array.isArray(rt.tags) ? rt.tags : rt.tags ? [rt.tags] : [],
    ) ?? [],
  })) as RecipeCardData[]

  if (filters.tagSlugs && filters.tagSlugs.length > 0) {
    results = results.filter((r) =>
      filters.tagSlugs!.every((slug) => r.tags.some((t) => t.slug === slug)),
    )
  }

  // Full-text search (basic — server-side for now, Sprint 3 uses RPC)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.headline ?? '').toLowerCase().includes(q),
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
    tags: data.recipe_tags?.flatMap((rt: { tags: unknown }) =>
      Array.isArray(rt.tags) ? rt.tags : rt.tags ? [rt.tags] : [],
    ) ?? [],
    utensils: data.recipe_utensils?.flatMap((ru: { utensils: unknown }) =>
      Array.isArray(ru.utensils) ? ru.utensils : ru.utensils ? [ru.utensils] : [],
    ) ?? [],
    steps: data.recipe_steps ?? [],
    nutrition: data.recipe_nutrition ?? null,
    recipe_ingredients: data.recipe_ingredients ?? [],
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
