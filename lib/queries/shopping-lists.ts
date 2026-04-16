import { createClient } from '@/lib/supabase/server'
import type { ShoppingListIngredient } from '@/types/database.types'

export interface ShoppingListWithRecipes {
  id: string
  name: string
  yields: number
  created_at: string
  recipes: Array<{
    id: string
    name: string
    slug: string
    image_url: string | null
  }>
}

export async function getShoppingLists() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shopping_lists')
    .select(
      `id, name, yields, created_at,
       shopping_list_recipes ( recipe_id )`,
    )
    .order('created_at', { ascending: false })

  return (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    yields: l.yields,
    created_at: l.created_at,
    recipeCount: (l.shopping_list_recipes as Array<unknown>).length,
  }))
}

export async function getShoppingListById(
  id: string,
): Promise<ShoppingListWithRecipes | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .select(
      `id, name, yields, created_at,
       shopping_list_recipes (
         recipes ( id, name, slug, image_url )
       )`,
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    yields: data.yields,
    created_at: data.created_at,
    recipes: (data.shopping_list_recipes as Array<{ recipes: unknown }>)
      .flatMap((slr) =>
        Array.isArray(slr.recipes) ? slr.recipes : slr.recipes ? [slr.recipes] : [],
      ) as ShoppingListWithRecipes['recipes'],
  }
}

export async function getShoppingListIngredients(
  listId: string,
  servings: 2 | 4 = 2,
): Promise<ShoppingListIngredient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_shopping_list_ingredients', {
    list_id: listId,
    serving_size: servings,
  })
  if (error) {
    console.error('get_shopping_list_ingredients error:', error)
    return []
  }
  return data ?? []
}

export async function createShoppingList(
  name: string,
  recipeIds: string[],
  yields: 2 | 4 = 2,
): Promise<string> {
  const supabase = await createClient()

  const { data: list, error } = await supabase
    .from('shopping_lists')
    .insert({ name, yields })
    .select('id')
    .single()

  if (error || !list) throw new Error(error?.message ?? 'Failed to create list')

  if (recipeIds.length > 0) {
    await supabase.from('shopping_list_recipes').insert(
      recipeIds.map((recipe_id) => ({ shopping_list_id: list.id, recipe_id })),
    )
  }

  return list.id
}

export async function deleteShoppingList(id: string) {
  const supabase = await createClient()
  await supabase.from('shopping_lists').delete().eq('id', id)
}

export async function removeRecipeFromList(listId: string, recipeId: string) {
  const supabase = await createClient()
  await supabase
    .from('shopping_list_recipes')
    .delete()
    .eq('shopping_list_id', listId)
    .eq('recipe_id', recipeId)
}

export async function updateListYields(id: string, yields: 2 | 4) {
  const supabase = await createClient()
  await supabase.from('shopping_lists').update({ yields }).eq('id', id)
}
