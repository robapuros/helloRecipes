'use server'

import { toggleFavorite } from '@/lib/queries/favorites'
import { revalidatePath } from 'next/cache'

export async function toggleFavoriteAction(recipeId: string): Promise<boolean> {
  const isFav = await toggleFavorite(recipeId)
  revalidatePath('/')
  return isFav
}
