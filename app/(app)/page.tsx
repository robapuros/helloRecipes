import { Suspense } from 'react'
import { RecipeGrid, RecipeGridSkeleton } from '@/components/recipe-grid'
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
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <FilterPanel tagsByType={tagsByType} currentFilters={filters} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter header */}
          <div className="flex items-center justify-between mb-5 lg:hidden">
            <MobileFilterButton
              tagsByType={tagsByType}
              currentFilters={filters}
              activeCount={activeFilterCount}
            />
          </div>

          <Suspense fallback={<RecipeGridSkeleton />}>
            <RecipesContent filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Filter Panel (sidebar)
// ──────────────────────────────────────────────

function FilterPanel({
  tagsByType,
  currentFilters,
}: {
  tagsByType: Record<string, Array<{ id: string; name: string; slug: string; count: number }>>
  currentFilters: RecipeFilters
}) {
  return (
    <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Filtros
        </h2>
        {(currentFilters.tagSlugs?.length ||
          currentFilters.maxTime ||
          currentFilters.difficulty?.length) ? (
          <a
            href="/"
            className="text-xs text-primary hover:underline"
          >
            Limpiar todo
          </a>
        ) : null}
      </div>

      {/* Search */}
      <SearchFilter currentSearch={currentFilters.search} />

      {/* Max time */}
      <TimeFilter currentMax={currentFilters.maxTime} />

      {/* Difficulty */}
      <DifficultyFilter current={currentFilters.difficulty ?? []} />

      {/* Tags by type */}
      {Object.entries(tagsByType)
        .filter(([, tags]) => tags.length > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, typeTags]) => (
          <TagFilterGroup
            key={type}
            type={type}
            tags={typeTags}
            selectedSlugs={currentFilters.tagSlugs ?? []}
          />
        ))}
    </div>
  )
}

function SearchFilter({ currentSearch }: { currentSearch?: string }) {
  return (
    <form method="GET" action="/" className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Buscar
      </label>
      <div className="flex gap-2">
        <input
          name="q"
          defaultValue={currentSearch}
          placeholder="Busca una receta..."
          className="flex-1 h-8 text-sm px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-8 px-3 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
        >
          →
        </button>
      </div>
    </form>
  )
}

function TimeFilter({ currentMax }: { currentMax?: number }) {
  const options = [15, 25, 35, 45, 60]
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Tiempo máximo
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((t) => {
          const isActive = currentMax === t
          const params = new URLSearchParams()
          if (!isActive) params.set('maxTime', String(t))
          return (
            <a
              key={t}
              href={isActive ? '/' : `?maxTime=${t}`}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary hover:text-primary'
              }`}
            >
              {t === 60 ? '+60 min' : `${t} min`}
            </a>
          )
        })}
      </div>
    </div>
  )
}

const DIFFICULTY_OPTIONS = [
  { value: 0, label: 'Fácil' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Difícil' },
  { value: 3, label: 'Experto' },
]

function DifficultyFilter({ current }: { current: number[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Dificultad
      </p>
      <div className="space-y-1.5">
        {DIFFICULTY_OPTIONS.map(({ value, label }) => {
          const isActive = current.includes(value)
          const newDiff = isActive
            ? current.filter((d) => d !== value)
            : [...current, value]
          const param = newDiff.length > 0 ? `?${newDiff.map((d) => `difficulty=${d}`).join('&')}` : '/'
          return (
            <a
              key={value}
              href={param}
              className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  isActive ? 'bg-primary border-primary' : 'border-input'
                }`}
              >
                {isActive && <span className="text-primary-foreground text-[10px]">✓</span>}
              </span>
              {label}
            </a>
          )
        })}
      </div>
    </div>
  )
}

const TAG_TYPE_LABELS: Record<string, string> = {
  'meal-type': 'Tipo de comida',
  cuisine: 'Cocina',
  preference: 'Preferencias',
  feature: 'Características',
  diet: 'Dieta',
  other: 'Más categorías',
}

function TagFilterGroup({
  type,
  tags,
  selectedSlugs,
}: {
  type: string
  tags: Array<{ id: string; name: string; slug: string; count: number }>
  selectedSlugs: string[]
}) {
  const label = TAG_TYPE_LABELS[type] ?? type

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="space-y-1">
        {tags
          .filter((t) => t.count > 0)
          .slice(0, 8)
          .map((tag) => {
            const isActive = selectedSlugs.includes(tag.slug)
            const newSlugs = isActive
              ? selectedSlugs.filter((s) => s !== tag.slug)
              : [...selectedSlugs, tag.slug]
            const param =
              newSlugs.length > 0
                ? `?${newSlugs.map((s) => `tags=${s}`).join('&')}`
                : '/'
            return (
              <a
                key={tag.id}
                href={param}
                className={`flex items-center justify-between text-sm rounded-lg px-2 py-1 transition-colors ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary border-primary' : 'border-input'
                    }`}
                  >
                    {isActive && <span className="text-primary-foreground text-[10px]">✓</span>}
                  </span>
                  {tag.name}
                </span>
                <span className="text-xs text-muted-foreground">{tag.count}</span>
              </a>
            )
          })}
      </div>
    </div>
  )
}

// Mobile filter button — placeholder, will be enhanced in Sprint 2
function MobileFilterButton({
  activeCount,
}: {
  tagsByType: Record<string, Array<{ id: string; name: string; slug: string; count: number }>>
  currentFilters: RecipeFilters
  activeCount: number
}) {
  return (
    <a
      href="/filtros"
      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:border-primary hover:text-primary transition-colors"
    >
      <span>Filtros</span>
      {activeCount > 0 && (
        <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {activeCount}
        </span>
      )}
    </a>
  )
}
