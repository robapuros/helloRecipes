import { Suspense } from 'react'
import { RecipeGrid, RecipeGridSkeleton } from '@/components/recipe-grid'
import { FilterControls } from '@/components/filter-controls'
import { FilterDrawer } from '@/components/filter-drawer'
import { getRecipes, getTagsWithCounts } from '@/lib/queries/recipes'
import type { RecipeFilters } from '@/lib/queries/recipes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Todas las recetas',
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    maxTime?: string
    difficulty?: string | string[]
    tags?: string | string[]
  }>
}

async function RecipesContent({ filters }: { filters: RecipeFilters }) {
  const recipes = await getRecipes(filters)

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        {recipes.length === 0
          ? 'No se encontraron recetas con esos filtros'
          : `${recipes.length} receta${recipes.length !== 1 ? 's' : ''}`}
      </p>
      <RecipeGrid recipes={recipes} />
    </div>
  )
}

export default async function GalleryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tags = await getTagsWithCounts()

  // Parse URL search params into filters
  const filters: RecipeFilters = {}

  if (params.q) filters.search = params.q
  if (params.maxTime) filters.maxTime = parseInt(params.maxTime)
  if (params.difficulty) {
    const raw = Array.isArray(params.difficulty) ? params.difficulty : [params.difficulty]
    filters.difficulty = raw.map(Number).filter((n) => !isNaN(n))
  }
  if (params.tags) {
    filters.tagSlugs = Array.isArray(params.tags) ? params.tags : [params.tags]
  }

  // Group tags by type for the filter UI
  const tagsByType = tags.reduce<Record<string, typeof tags>>((acc, tag) => {
    const group = tag.type ?? 'other'
    if (!acc[group]) acc[group] = []
    acc[group].push(tag)
    return acc
  }, {})

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.maxTime ? 1 : 0) +
    (filters.difficulty?.length ?? 0) +
    (filters.tagSlugs?.length ?? 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nuestras recetas</h1>
        <p className="text-muted-foreground mt-1">
          Todas las recetas HelloFresh guardadas para siempre ❤️
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-5 overflow-y-auto max-h-[calc(100dvh-7rem)]">
            <FilterControls tagsByType={tagsByType} currentFilters={filters} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button */}
          <div className="flex items-center justify-between mb-5 lg:hidden">
            <FilterDrawer
              tagsByType={tagsByType}
              currentFilters={filters}
              activeCount={activeFilterCount}
            />
            {activeFilterCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} activo{activeFilterCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <Suspense fallback={<RecipeGridSkeleton />}>
            <RecipesContent filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
