import { SupabaseClient } from '@supabase/supabase-js'
import type { ParsedRecipe } from './parse-recipe'
import { uploadImage } from './upload-image'

interface UpsertResult {
  success: boolean
  recipeId?: string
  error?: string
}

export async function upsertRecipe(
  supabase: SupabaseClient,
  parsed: ParsedRecipe,
): Promise<UpsertResult> {
  try {
    // 1. Upload hero image
    const imageUrl = await uploadImage(
      supabase,
      parsed.image_path,
      `recipes/${parsed.hf_id}/hero.jpg`,
    )

    // 2. Upsert tags
    const tagIdMap: Record<string, string> = {}
    for (const tag of parsed.tags) {
      const { data, error } = await supabase
        .from('tags')
        .upsert(
          {
            hf_id: tag.hf_id,
            name: tag.name,
            slug: tag.slug,
            type: tag.type,
            color_handle: tag.color_handle,
            display_label: tag.display_label,
          },
          { onConflict: 'hf_id' },
        )
        .select('id')
        .single()
      if (error) throw new Error(`Tag upsert failed: ${error.message}`)
      tagIdMap[tag.hf_id] = data.id
    }

    // 3. Upsert utensils
    const utensilIdMap: Record<string, string> = {}
    for (const utensil of parsed.utensils) {
      const { data, error } = await supabase
        .from('utensils')
        .upsert(
          { hf_id: utensil.hf_id, name: utensil.name, type: utensil.type },
          { onConflict: 'hf_id' },
        )
        .select('id')
        .single()
      if (error) throw new Error(`Utensil upsert failed: ${error.message}`)
      utensilIdMap[utensil.hf_id] = data.id
    }

    // 4. Upsert ingredients (master list)
    const ingredientIdMap: Record<string, string> = {}
    for (const ing of parsed.ingredients) {
      // Upload ingredient image
      const ingImageUrl = await uploadImage(
        supabase,
        ing.image_path,
        `ingredients/${ing.hf_id}.jpg`,
      )
      const { data, error } = await supabase
        .from('ingredients')
        .upsert(
          {
            hf_id: ing.hf_id,
            name: ing.name,
            slug: ing.slug,
            type: ing.type,
            image_url: ingImageUrl,
            allergens: ing.allergens,
          },
          { onConflict: 'hf_id' },
        )
        .select('id')
        .single()
      if (error) throw new Error(`Ingredient upsert failed: ${error.message}`)
      ingredientIdMap[ing.hf_id] = data.id
    }

    // 5. Upsert recipe core
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .upsert(
        {
          hf_id: parsed.hf_id,
          name: parsed.name,
          slug: parsed.slug,
          description: parsed.description,
          headline: parsed.headline,
          total_time_min: parsed.total_time_min,
          prep_time_min: parsed.prep_time_min,
          difficulty: parsed.difficulty,
          image_url: imageUrl,
          average_rating: parsed.average_rating,
          ratings_count: parsed.ratings_count,
          cuisines: parsed.cuisines,
        },
        { onConflict: 'hf_id' },
      )
      .select('id')
      .single()
    if (recipeError) throw new Error(`Recipe upsert failed: ${recipeError.message}`)
    const recipeId = recipe.id

    // 6. Upsert recipe_tags
    if (parsed.tags.length > 0) {
      const tagRows = parsed.tags
        .filter((t) => tagIdMap[t.hf_id])
        .map((t) => ({ recipe_id: recipeId, tag_id: tagIdMap[t.hf_id] }))
      const { error } = await supabase
        .from('recipe_tags')
        .upsert(tagRows, { onConflict: 'recipe_id,tag_id' })
      if (error) throw new Error(`Recipe tags upsert failed: ${error.message}`)
    }

    // 7. Upsert recipe_utensils
    if (parsed.utensils.length > 0) {
      const utensilRows = parsed.utensils
        .filter((u) => utensilIdMap[u.hf_id])
        .map((u) => ({ recipe_id: recipeId, utensil_id: utensilIdMap[u.hf_id] }))
      const { error } = await supabase
        .from('recipe_utensils')
        .upsert(utensilRows, { onConflict: 'recipe_id,utensil_id' })
      if (error) throw new Error(`Recipe utensils upsert failed: ${error.message}`)
    }

    // 8. Upsert recipe_ingredients (with quantities per yield)
    for (const yieldGroup of parsed.yields) {
      const ingredientRows = yieldGroup.ingredients
        .filter((yi) => ingredientIdMap[yi.hf_ingredient_id])
        .map((yi) => ({
          recipe_id: recipeId,
          ingredient_id: ingredientIdMap[yi.hf_ingredient_id],
          yields: yieldGroup.serving_count,
          amount: yi.amount,
          unit: yi.unit,
        }))
      if (ingredientRows.length > 0) {
        const { error } = await supabase
          .from('recipe_ingredients')
          .upsert(ingredientRows, { onConflict: 'recipe_id,ingredient_id,yields' })
        if (error) throw new Error(`Recipe ingredients upsert failed: ${error.message}`)
      }
    }

    // 9. Upsert recipe_steps with images
    for (const step of parsed.steps) {
      const stepImageUrl = await uploadImage(
        supabase,
        step.image_path,
        `recipes/${parsed.hf_id}/step-${step.index}.jpg`,
      )
      const { error } = await supabase
        .from('recipe_steps')
        .upsert(
          {
            recipe_id: recipeId,
            step_index: step.index,
            instructions_html: step.instructions_html,
            image_url: stepImageUrl,
          },
          { onConflict: 'recipe_id,step_index' },
        )
      if (error) throw new Error(`Recipe step upsert failed: ${error.message}`)
    }

    // 10. Upsert recipe_nutrition
    if (parsed.nutrition) {
      const { error } = await supabase
        .from('recipe_nutrition')
        .upsert(
          { recipe_id: recipeId, ...parsed.nutrition, yields: 2 },
          { onConflict: 'recipe_id' },
        )
      if (error) throw new Error(`Recipe nutrition upsert failed: ${error.message}`)
    }

    return { success: true, recipeId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
