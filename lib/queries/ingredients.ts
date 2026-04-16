import { createClient } from '@/lib/supabase/server'

export async function searchIngredients(query: string, limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, type, image_url')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)

  if (error) return []
  return data ?? []
}

export async function getAllIngredients() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredients')
    .select('id, name, type')
    .order('name')
  return data ?? []
}
