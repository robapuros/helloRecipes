import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Clock, Star, ChefHat, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ServingsToggle } from '@/components/servings-toggle'
import { RecipeStickyHeader } from '@/components/recipe-sticky-header'
import { RecipeNotes } from '@/components/recipe-notes'
import { TrackView } from '@/components/track-view'
import { FavoriteButton } from '@/components/favorite-button'
import { getRecipeBySlug } from '@/lib/queries/recipes'
import { getNoteByRecipeId } from '@/lib/queries/notes'
import { getFavoriteIds } from '@/lib/queries/favorites'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatTime, timeColor } from '@/lib/utils/time'
import { difficultyLabel, difficultyColor } from '@/lib/utils/difficulty'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import type { RecipeIngredient, Ingredient } from '@/types/database.types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  const supabase = createAdminClient()
  const { data } = await supabase.from('recipes').select('slug')
  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  if (!recipe) return {}
  return {
    title: recipe.name,
    description: recipe.headline ?? recipe.description?.slice(0, 155) ?? undefined,
  }
}

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  if (!recipe) notFound()

  const [note, favoriteIds] = await Promise.all([
    getNoteByRecipeId(recipe.id).catch(() => null),
    getFavoriteIds().catch((): string[] => []),
  ])
  const isFavorite = favoriteIds.includes(recipe.id)

  const steps = (recipe.steps ?? []).sort((a, b) => a.step_index - b.step_index)

  type RIWithIngredient = RecipeIngredient & { ingredient: Ingredient }
  const allIngredients = (recipe.recipe_ingredients ?? []) as RIWithIngredient[]
  const ingredients2 = allIngredients.filter((ri) => ri.yields === 2)
  const ingredients4 = allIngredients.filter((ri) => ri.yields === 4)

  const nutrition = Array.isArray(recipe.nutrition) ? recipe.nutrition[0] : recipe.nutrition

  return (
    <>
      {/* Track this page view in localStorage (client only) */}
      <TrackView
        recipeId={recipe.id}
        slug={recipe.slug}
        name={recipe.name}
        imageUrl={recipe.image_url}
      />

      {/* Sticky header — appears on scroll */}
      <RecipeStickyHeader
        recipeId={recipe.id}
        name={recipe.name}
        imageUrl={recipe.image_url}
        totalTimeMin={recipe.total_time_min}
      />

      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[300px] bg-muted">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {/* Back */}
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Recetas
        </Link>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            {recipe.headline && (
              <p className="text-white/75 text-sm mb-1">{recipe.headline}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">
              {recipe.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-border">
          {recipe.total_time_min && (
            <div className={cn('flex items-center gap-1.5 text-sm font-medium', timeColor(recipe.total_time_min))}>
              <Clock className="w-4 h-4" />
              {formatTime(recipe.total_time_min)}
            </div>
          )}
          {recipe.difficulty !== null && recipe.difficulty !== undefined && (
            <div className={cn('flex items-center gap-1.5 text-sm font-medium', difficultyColor(recipe.difficulty))}>
              <ChefHat className="w-4 h-4" />
              {difficultyLabel(recipe.difficulty)}
            </div>
          )}
          {!!recipe.average_rating && recipe.average_rating > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-500">
              <Star className="w-4 h-4 fill-amber-400" />
              {recipe.average_rating.toFixed(1)}
              {recipe.ratings_count ? (
                <span className="text-muted-foreground font-normal">({recipe.ratings_count})</span>
              ) : null}
            </div>
          )}
          {/* Cuisine tags */}
          {recipe.tags
            ?.filter((t) => t.type === 'cuisine' || t.type === 'meal-type')
            .slice(0, 3)
            .map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
          {/* Favorite button */}
          <FavoriteButton
            recipeId={recipe.id}
            initialFavorite={isFavorite}
            variant="inline"
            className="ml-auto"
          />
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-muted-foreground leading-relaxed mb-8 text-sm sm:text-base">
            {recipe.description}
          </p>
        )}

        {/* Two-column layout — on mobile ingredients appear first (order-1), steps second (order-2) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* Left: Steps — shown second on mobile */}
          <div className="space-y-8 order-2 lg:order-1">
            <h2 className="text-lg font-bold">Preparación</h2>
            {steps.length === 0 && (
              <p className="text-muted-foreground text-sm">No hay pasos disponibles.</p>
            )}
            {steps.map((step) => (
              <div key={step.id} className="flex gap-4">
                {/* Step number bubble */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
                  {step.step_index}
                </div>
                <div className="flex-1 space-y-3 pt-1.5">
                  <div
                    className="prose prose-sm max-w-none text-foreground leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: step.instructions_html }}
                  />
                  {step.image_url && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mt-3">
                      <Image
                        src={step.image_url}
                        alt={`Paso ${step.step_index}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Ingredients + Utensils + Nutrition — shown first on mobile */}
          <div className="space-y-5 order-1 lg:order-2 lg:sticky lg:top-24">

            {/* Ingredients with servings toggle */}
            <ServingsToggle
              ingredients2={ingredients2}
              ingredients4={ingredients4}
            />

            {/* Utensils */}
            {recipe.utensils && recipe.utensils.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="font-bold text-sm">Utensilios</h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.utensils.map((u) => (
                    <Badge key={u.id} variant="outline" className="text-xs gap-1.5">
                      {u.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition */}
            {nutrition && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-bold text-sm">Valores nutricionales</h2>
                  <span className="text-xs text-muted-foreground">por ración</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Calorías', value: nutrition.calories, unit: 'kcal' },
                    { label: 'Proteínas', value: nutrition.protein_g, unit: 'g' },
                    { label: 'Grasas', value: nutrition.fat_g, unit: 'g' },
                    { label: 'Carbohidratos', value: nutrition.carbs_g, unit: 'g' },
                    { label: 'Fibra', value: nutrition.fiber_g, unit: 'g' },
                    { label: 'Sodio', value: nutrition.sodium_mg, unit: 'mg' },
                  ]
                    .filter(({ value }) => value != null)
                    .map(({ label, value, unit }) => (
                      <div key={label} className="bg-muted/50 rounded-xl p-2.5">
                        <p className="text-[10px] text-muted-foreground leading-tight mb-0.5">{label}</p>
                        <p className="font-bold text-sm leading-tight">
                          {value}
                          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal notes */}
        <RecipeNotes recipeId={recipe.id} initialNote={note} />

        {/* Tags footer */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border">
            <Separator className="mb-5" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Categorías</p>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <Link key={tag.id} href={`/?tags=${tag.slug}`}>
                  <Badge
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer text-xs"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
