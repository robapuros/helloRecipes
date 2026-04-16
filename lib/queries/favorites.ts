import { createClient } from '@/lib/supabase/server'

export async function getFavoriteIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('recipe_favorites').select('recipe_id')
  return (data ?? []).map((r: { recipe_id: string }) => r.recipe_id)
}

export async function toggleFavorite(recipeId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipe_favorites')
    .select('recipe_id')
    .eq('recipe_id', recipeId)
    .maybeSingle()

  if (data) {
    await supabase.from('recipe_favorites').delete().eq('recipe_id', recipeId)
    return false
  } else {
    await supabase.from('recipe_favorites').insert({ recipe_id: recipeId })
    return true
  }
}
