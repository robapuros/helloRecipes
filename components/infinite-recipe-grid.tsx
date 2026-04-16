'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { SelectableRecipeCard } from '@/components/recipe-select-overlay'
import { RecipeGridSkeleton } from '@/components/recipe-grid'
import type { RecipeCardData } from '@/types/database.types'

const PAGE_SIZE = 24

interface InfiniteRecipeGridProps {
  initialRecipes: RecipeCardData[]
  initialTotal: number
}

export function InfiniteRecipeGrid({ initialRecipes, initialTotal }: InfiniteRecipeGridProps) {
  const searchParams = useSearchParams()
  const [recipes, setRecipes] = useState(initialRecipes)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialRecipes.length < initialTotal)
  const offsetRef = useRef(initialRecipes.length)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset when filters change
  useEffect(() => {
    setRecipes(initialRecipes)
    setTotal(initialTotal)
    setHasMore(initialRecipes.length < initialTotal)
    offsetRef.current = initialRecipes.length
  }, [initialRecipes, initialTotal])

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const params = new URLSearchParams(searchParams.toString())
    params.set('offset', String(offsetRef.current))
    params.set('limit', String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/recipes?${params.toString()}`)
      const data: { recipes: RecipeCardData[]; hasMore: boolean; total: number } = await res.json()
      setRecipes((prev) => [...prev, ...data.recipes])
      setHasMore(data.hasMore)
      setTotal(data.total)
      offsetRef.current += data.recipes.length
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, searchParams])

  // IntersectionObserver on the sentinel div
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchMore])

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
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {recipes.map((recipe) => (
          <SelectableRecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {/* Sentinel + loading state */}
      <div ref={sentinelRef} className="mt-8">
        {loading && <RecipeGridSkeleton count={4} />}
        {!hasMore && recipes.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            {total} receta{total !== 1 ? 's' : ''} en total
          </p>
        )}
      </div>
    </div>
  )
}
