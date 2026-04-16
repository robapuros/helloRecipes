import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Clock, Star, ChefHat, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getRecipeBySlug } from '@/lib/queries/recipes'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatTime, timeColor } from '@/lib/utils/time'
import { difficultyLabel, difficultyColor } from '@/lib/utils/difficulty'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const revalidate = 3600 // ISR: revalidate every hour

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Skip static generation if Supabase is not configured (e.g. first deploy)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }
  // Use admin client (no cookies) since generateStaticParams runs at build time
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
    description: recipe.headline ?? recipe.description ?? undefined,
  }
}

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)

  if (!recipe) notFound()

  const steps = (recipe.steps ?? []).sort((a, b) => a.step_index - b.step_index)
  const ingredients2 = (recipe.recipe_ingredients ?? []).filter((ri) => ri.yields === 2)
  const nutrition = Array.isArray(recipe.nutrition) ? recipe.nutrition[0] : recipe.nutrition

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-[45vh] min-h-[280px] bg-muted">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Recetas
        </Link>

        {/* Recipe name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            {recipe.headline && (
              <p className="text-white/80 text-sm mb-1">{recipe.headline}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{recipe.name}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Meta strip */}
        <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
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
          {recipe.average_rating && recipe.average_rating > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-500">
              <Star className="w-4 h-4 fill-amber-400" />
              {recipe.average_rating.toFixed(1)} ({recipe.ratings_count} valoraciones)
            </div>
          )}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-muted-foreground leading-relaxed mb-8">{recipe.description}</p>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Steps */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Pasos</h2>
            {steps.map((step) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step.step_index}
                </div>
                <div className="flex-1 space-y-3 pt-0.5">
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: step.instructions_html }}
                  />
                  {step.image_url && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
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

          {/* Sidebar: ingredients + nutrition */}
          <div className="space-y-6">
            {/* Ingredients */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="font-bold">Ingredientes</h2>
              <p className="text-xs text-muted-foreground">Para 2 personas</p>
              <ul className="space-y-2">
                {ingredients2.map((ri) => (
                  <li
                    key={ri.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0"
                  >
                    <span className="flex items-center gap-2">
                      {(ri as { ingredient?: { image_url?: string; name?: string } }).ingredient?.image_url && (
                        <Image
                          src={(ri as { ingredient: { image_url: string } }).ingredient.image_url}
                          alt={(ri as { ingredient: { name?: string } }).ingredient.name ?? ''}
                          width={24}
                          height={24}
                          className="rounded-full object-cover bg-muted"
                        />
                      )}
                      {(ri as { ingredient?: { name?: string } }).ingredient?.name ?? ''}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {ri.amount != null ? `${ri.amount} ${ri.unit ?? ''}`.trim() : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Utensils */}
            {recipe.utensils && recipe.utensils.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="font-bold">Utensilios</h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.utensils.map((u) => (
                    <Badge key={u.id} variant="secondary" className="text-xs">
                      {u.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition */}
            {nutrition && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="font-bold">Información nutricional</h2>
                <p className="text-xs text-muted-foreground">Por ración (2 personas)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
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
                      <div key={label} className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-semibold">
                          {value}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <Separator className="mb-4" />
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <Link key={tag.id} href={`/?tags=${tag.slug}`}>
                  <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
