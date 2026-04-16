'use server'

import { createShoppingList, deleteShoppingList, removeRecipeFromList, updateListYields } from '@/lib/queries/shopping-lists'
import { revalidatePath } from 'next/cache'

export async function createShoppingListAction(name: string, recipeIds: string[]): Promise<string> {
  return createShoppingList(name, recipeIds)
}

export async function deleteShoppingListAction(id: string) {
  await deleteShoppingList(id)
  revalidatePath('/lista')
}

export async function removeRecipeAction(listId: string, recipeId: string) {
  await removeRecipeFromList(listId, recipeId)
  revalidatePath(`/lista/${listId}`)
}

export async function updateYieldsAction(listId: string, yields: 2 | 4) {
  await updateListYields(listId, yields)
  revalidatePath(`/lista/${listId}`)
}
