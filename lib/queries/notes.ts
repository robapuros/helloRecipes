import { createClient } from '@/lib/supabase/server'

export async function getNoteByRecipeId(recipeId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipe_notes')
    .select('content')
    .eq('recipe_id', recipeId)
    .maybeSingle()
  return data?.content ?? null
}

export async function upsertNote(recipeId: string, content: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('recipe_notes').upsert(
    { recipe_id: recipeId, content, updated_at: new Date().toISOString() },
    { onConflict: 'recipe_id' },
  )
}
