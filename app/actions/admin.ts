'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface ManualRecipeInput {
  name: string
  slug: string
  headline: string
  description: string
  total_time_min: number | null
  prep_time_min: number | null
  difficulty: number | null
  image_url: string
  steps: Array<{ instructions: string }>
  ingredientRows: Array<{
    ingredient_id: string
    name: string
    amount2: number | null
    unit2: string
    amount4: number | null
    unit4: string
  }>
  tagIds: string[]
  utensilIds: string[]
  nutrition: {
    calories: number | null
    protein_g: number | null
    fat_g: number | null
    carbs_g: number | null
    fiber_g: number | null
    sodium_mg: number | null
  } | null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function generateSlugAction(name: string): Promise<string> {
  return slugify(name)
}

export async function createRecipeAction(input: ManualRecipeInput): Promise<{ error?: string }> {
  const supabase = await createClient()

  const slug = slugify(input.slug || input.name)
  const hfId = `manual-${slug}-${Date.now()}`

  // 1. Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      hf_id: hfId,
      name: input.name.trim(),
      slug,
      headline: input.headline.trim() || null,
      description: input.description.trim() || null,
      total_time_min: input.total_time_min,
      prep_time_min: input.prep_time_min,
      difficulty: input.difficulty,
      image_url: input.image_url.trim() || null,
    })
    .select('id')
    .single()

  if (recipeError || !recipe) {
    return { error: recipeError?.message ?? 'Error al crear la receta' }
  }
  const recipeId = recipe.id

  // 2. Insert steps
  if (input.steps.length > 0) {
    const stepRows = input.steps
      .filter((s) => s.instructions.trim())
      .map((s, i) => ({
        recipe_id: recipeId,
        step_index: i + 1,
        instructions_html: `<p>${s.instructions.trim().replace(/\n/g, '</p><p>')}</p>`,
        image_url: null,
      }))
    if (stepRows.length > 0) {
      const { error } = await supabase.from('recipe_steps').insert(stepRows)
      if (error) return { error: `Error en pasos: ${error.message}` }
    }
  }

  // 3. Insert recipe_ingredients for yields 2 and 4
  if (input.ingredientRows.length > 0) {
    const ingRows = input.ingredientRows.flatMap((row) => [
      {
        recipe_id: recipeId,
        ingredient_id: row.ingredient_id,
        yields: 2,
        amount: row.amount2,
        unit: row.unit2.trim() || null,
      },
      {
        recipe_id: recipeId,
        ingredient_id: row.ingredient_id,
        yields: 4,
        amount: row.amount4,
        unit: row.unit4.trim() || null,
      },
    ])
    const { error } = await supabase.from('recipe_ingredients').insert(ingRows)
    if (error) return { error: `Error en ingredientes: ${error.message}` }
  }

  // 4. Insert recipe_tags
  if (input.tagIds.length > 0) {
    const { error } = await supabase
      .from('recipe_tags')
      .insert(input.tagIds.map((tag_id) => ({ recipe_id: recipeId, tag_id })))
    if (error) return { error: `Error en etiquetas: ${error.message}` }
  }

  // 5. Insert recipe_utensils
  if (input.utensilIds.length > 0) {
    const { error } = await supabase
      .from('recipe_utensils')
      .insert(input.utensilIds.map((utensil_id) => ({ recipe_id: recipeId, utensil_id })))
    if (error) return { error: `Error en utensilios: ${error.message}` }
  }

  // 6. Insert nutrition
  if (input.nutrition) {
    const hasAny = Object.values(input.nutrition).some((v) => v !== null)
    if (hasAny) {
      const { error } = await supabase
        .from('recipe_nutrition')
        .insert({ recipe_id: recipeId, ...input.nutrition, yields: 2 })
      if (error) return { error: `Error en nutrición: ${error.message}` }
    }
  }

  revalidatePath('/')
  redirect(`/recetas/${slug}`)
}
