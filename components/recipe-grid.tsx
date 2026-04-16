import { SelectableRecipeCard } from '@/components/recipe-select-overlay'
import { Skeleton } from '@/components/ui/skeleton'
import type { RecipeCardData } from '@/types/database.types'

interface RecipeGridProps {
  recipes: RecipeCardData[]
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No se encontraron recetas</h3>
        <p className="text-muted-foreground max-w-sm">
          Prueba a ajustar los filtros o busca con otras palabras.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {recipes.map((recipe) => (
        <SelectableRecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}

export function RecipeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border/50">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
