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

export async function getIngredientsByIds(
  ids: string[],
): Promise<Array<{ id: string; name: string; image_url: string | null }>> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredients')
    .select('id, name, image_url')
    .in('id', ids)
  return data ?? []
}

export async function getUtensilsWithCounts(): Promise<
  Array<{ id: string; name: string; type: string | null; count: number }>
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('utensils')
    .select('id, name, type, recipe_utensils(count)')
    .order('name')

  if (!data) return []
  return data
    .map((u) => ({
      id: u.id,
      name: u.name,
      type: u.type,
      count:
        (u.recipe_utensils as unknown as Array<{ count: number }>)?.[0]?.count ?? 0,
    }))
    .filter((u) => u.count > 0)
    .sort((a, b) => b.count - a.count)
}
