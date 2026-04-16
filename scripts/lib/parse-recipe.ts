import type { HFRecipe } from '../../types/hellofresh'
import { parseTimeMinutes } from '../../lib/utils/time'

/**
 * Parsed, normalized recipe data ready for database insertion.
 */
export interface ParsedRecipe {
  hf_id: string
  name: string
  slug: string
  description: string | null
  headline: string | null
  total_time_min: number | null
  prep_time_min: number | null
  difficulty: number | null
  image_path: string | null  // original HF path, used for image download
  average_rating: number | null
  ratings_count: number | null
  cuisines: string[]

  tags: Array<{
    hf_id: string
    name: string
    slug: string
    type: string | null
    color_handle: string | null
    display_label: boolean
  }>

  utensils: Array<{
    hf_id: string
    name: string
    type: string | null
  }>

  ingredients: Array<{
    hf_id: string
    name: string
    slug: string | null
    type: string | null
    image_path: string | null
    allergens: string[]
  }>

  yields: Array<{
    serving_count: number
    ingredients: Array<{
      hf_ingredient_id: string
      amount: number | null
      unit: string | null
    }>
  }>

  steps: Array<{
    index: number
    instructions_html: string
    image_path: string | null  // original HF path, used for image download
  }>

  nutrition: {
    calories: number | null
    protein_g: number | null
    fat_g: number | null
    carbs_g: number | null
    fiber_g: number | null
    sodium_mg: number | null
  } | null
}

type NutritionKey = 'calories' | 'protein_g' | 'fat_g' | 'carbs_g' | 'fiber_g' | 'sodium_mg'

const NUTRITION_NAME_MAP: Record<string, NutritionKey> = {
  'Valor energético (kcal)': 'calories',
  'Calorías': 'calories',
  'Energía': 'calories',
  'Proteínas': 'protein_g',
  'Grasas': 'fat_g',
  'Grasa': 'fat_g',
  'Hidratos de carbono': 'carbs_g',
  'Carbohidratos': 'carbs_g',
  'Fibra': 'fiber_g',
  'Sodio': 'sodium_mg',
  'Sal': 'sodium_mg',
}

export function parseRecipe(raw: HFRecipe): ParsedRecipe {
  // Parse nutrition
  let nutrition: ParsedRecipe['nutrition'] = null
  if (raw.nutrition && raw.nutrition.length > 0) {
    nutrition = {
      calories: null,
      protein_g: null,
      fat_g: null,
      carbs_g: null,
      fiber_g: null,
      sodium_mg: null,
    }
    for (const n of raw.nutrition) {
      const key = NUTRITION_NAME_MAP[n.name]
      if (key && nutrition) {
        nutrition[key] = n.amount
      }
    }
  }

  // Parse steps
  const steps: ParsedRecipe['steps'] = (raw.steps ?? []).map((step) => ({
    index: step.index,
    instructions_html:
      step.instructionsHTML ?? step.instructions ?? '',
    image_path: step.images?.[0]?.path ?? null,
  }))

  // Parse tags
  const tags: ParsedRecipe['tags'] = (raw.tags ?? []).map((tag) => ({
    hf_id: tag.id,
    name: tag.name.trim(),
    slug: tag.slug,
    type: tag.type ?? null,
    color_handle: tag.colorHandle ?? null,
    display_label: tag.displayLabel ?? false,
  }))

  // Parse utensils
  const utensils: ParsedRecipe['utensils'] = (raw.utensils ?? []).map((u) => ({
    hf_id: u.id,
    name: u.name,
    type: u.type ?? null,
  }))

  // Parse ingredients (master list)
  const ingredients: ParsedRecipe['ingredients'] = (raw.ingredients ?? []).map((ing) => ({
    hf_id: ing.id,
    name: ing.name,
    slug: ing.slug ?? null,
    type: ing.type ?? null,
    image_path: (ing as unknown as Record<string, string>).imageLink || ing.imagePath || null,
    allergens: [
      ...(ing.allergens ?? []),
      ...(ing.allergensNew ?? []),
    ].filter(Boolean),
  }))

  // Parse yields (quantities)
  const yields: ParsedRecipe['yields'] = (raw.yields ?? []).map((y) => ({
    serving_count: y.yields,
    ingredients: y.ingredients.map((yi) => ({
      hf_ingredient_id: yi.id,
      amount: yi.amount,
      unit: yi.unit,
    })),
  }))

  return {
    hf_id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? raw.descriptionHTML ?? null,
    headline: raw.headline ?? null,
    total_time_min: parseTimeMinutes(raw.totalTime),
    prep_time_min: parseTimeMinutes(raw.prepTime),
    difficulty: raw.difficulty ?? null,
    image_path: (raw as unknown as Record<string, string>).imageLink || raw.imagePath || null,
    average_rating: raw.averageRating ?? null,
    ratings_count: raw.ratingsCount ?? null,
    cuisines: raw.cuisines ?? [],
    tags,
    utensils,
    ingredients,
    yields,
    steps,
    nutrition,
  }
}
