import { NextRequest, NextResponse } from 'next/server'
import { getRecipes } from '@/lib/queries/recipes'
import type { RecipeFilters } from '@/lib/queries/recipes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams

  const filters: RecipeFilters = {}
  if (p.get('q')) filters.search = p.get('q')!
  if (p.get('maxTime')) filters.maxTime = parseInt(p.get('maxTime')!)
  const difficulty = p.getAll('difficulty').map(Number).filter((n) => !isNaN(n))
  if (difficulty.length) filters.difficulty = difficulty
  const tags = p.getAll('tags')
  if (tags.length) filters.tagSlugs = tags
  const ingredientIds = p.getAll('ingredientIds')
  if (ingredientIds.length) filters.ingredientIds = ingredientIds
  if (p.get('ingredientMode') === 'any') filters.ingredientMode = 'any'
  const utensilIds = p.getAll('utensilIds')
  if (utensilIds.length) filters.utensilIds = utensilIds
  if (p.get('favorites') === '1') filters.favoritesOnly = true

  const offset = parseInt(p.get('offset') ?? '0')
  const limit = parseInt(p.get('limit') ?? '24')

  const all = await getRecipes(filters)
  const page = all.slice(offset, offset + limit)

  return NextResponse.json({
    recipes: page,
    hasMore: offset + limit < all.length,
    total: all.length,
  })
}
