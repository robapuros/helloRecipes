'use server'

import { upsertNote } from '@/lib/queries/notes'

export async function saveNoteAction(recipeId: string, content: string): Promise<void> {
  await upsertNote(recipeId, content)
}
