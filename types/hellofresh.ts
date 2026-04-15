// Raw HelloFresh API types — matches the structure from hellofresh.es JSON data

export interface HFTag {
  id: string
  type: string
  slug: string
  name: string
  colorHandle?: string
  preferences?: string[]
  displayLabel?: boolean
}

export interface HFIngredient {
  id: string
  uuid?: string
  type?: string
  name: string
  slug?: string
  shipped?: boolean
  imagePath?: string
  familyId?: string
  allergens?: string[]
  allergensNew?: string[]
}

export interface HFYieldIngredient {
  id: string
  amount: number | null
  unit: string | null
}

export interface HFYield {
  id?: string
  yields: number
  ingredients: HFYieldIngredient[]
}

export interface HFStepImage {
  path: string
  link?: string
  caption?: string
  id?: string
}

export interface HFStep {
  id?: string
  index: number
  instructions?: string
  instructionsHTML?: string
  instructionsMarkdown?: string
  images?: HFStepImage[]
  videos?: unknown[]
}

export interface HFUtensil {
  id: string
  type?: string
  name: string
}

export interface HFNutrition {
  id?: string
  type?: string
  name: string
  unit: string
  amount: number
}

export interface HFLabel {
  id?: string
  text?: string
  type?: string
  handle?: string
}

export interface HFRecipe {
  id: string
  recipeId?: string
  uuid?: string
  name: string
  slug: string
  description?: string
  descriptionHTML?: string
  descriptionMarkdown?: string
  headline?: string
  seoName?: string
  seoDescription?: string
  canonical?: string
  canonicalLink?: string
  websiteUrl?: string

  // Time & difficulty
  totalTime?: string
  prepTime?: string
  difficulty?: number

  // Servings
  servingSize?: number

  // Media
  imagePath?: string
  videoMetadata?: unknown

  // Classification
  cuisines?: string[]
  tags?: HFTag[]
  labels?: HFLabel[]
  allergens?: string[]
  allergensNew?: string[]

  // Content
  ingredients?: HFIngredient[]
  yields?: HFYield[]
  steps?: HFStep[]
  utensils?: HFUtensil[]
  nutrition?: HFNutrition[]

  // Ratings & metadata
  averageRating?: number
  ratingsCount?: number
  favoritesCount?: number
  country?: string
  languageCode?: string
  active?: boolean
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
  tier?: string
  uniqueRecipeCode?: string
  clonedFrom?: string
}

export interface HFRecipesResponse {
  recipes?: HFRecipe[]
  items?: HFRecipe[]
  data?: {
    recipes?: HFRecipe[]
    items?: HFRecipe[]
  }
  // Next.js data format
  pageProps?: {
    recipes?: HFRecipe[]
    items?: HFRecipe[]
    savedRecipes?: HFRecipe[]
  }
}
