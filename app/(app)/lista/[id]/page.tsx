import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { getShoppingListById, getShoppingListIngredients } from '@/lib/queries/shopping-lists'
import { ListDetailClient } from './list-detail-client'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ yields?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const list = await getShoppingListById(id)
  return { title: list?.name ?? 'Lista de la compra' }
}

const INGREDIENT_TYPE_ORDER: Record<string, number> = {
  produce: 1, vegetable: 1, fruit: 2, protein: 3, meat: 3, fish: 3,
  dairy: 4, pantry: 5,
}
const INGREDIENT_TYPE_LABELS: Record<string, string> = {
  produce: 'Verduras y hortalizas', vegetable: 'Verduras y hortalizas',
  fruit: 'Frutas', protein: 'Proteínas', meat: 'Carnes', fish: 'Pescados',
  dairy: 'Lácteos', pantry: 'Despensa',
}

export default async function ListaDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { yields: yieldsParam } = await searchParams
  const yields = yieldsParam === '4' ? 4 : 2

  const [list, ingredients] = await Promise.all([
    getShoppingListById(id),
    getShoppingListIngredients(id, yields),
  ])

  if (!list) notFound()

  // Group ingredients by type
  const grouped = ingredients.reduce<Record<string, typeof ingredients>>((acc, ing) => {
    const key = ing.type ?? 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(ing)
    return acc
  }, {})

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) =>
      (INGREDIENT_TYPE_ORDER[a] ?? 9) - (INGREDIENT_TYPE_ORDER[b] ?? 9),
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/lista"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{list.name}</h1>
            <p className="text-sm text-muted-foreground">
              {list.recipes.length} receta{list.recipes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={undefined}
          className="print:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
          id="print-btn"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir</span>
        </button>
      </div>

      {/* Recipe thumbnails */}
      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        {list.recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recetas/${recipe.slug}`}
            className="group flex items-center gap-2 bg-card border border-border rounded-xl px-2.5 py-1.5 hover:border-primary/40 transition-colors text-sm"
          >
            {recipe.image_url && (
              <Image
                src={recipe.image_url}
                alt={recipe.name}
                width={24}
                height={24}
                className="rounded-md object-cover"
              />
            )}
            <span className="max-w-[160px] truncate">{recipe.name}</span>
          </Link>
        ))}
      </div>

      {/* Servings + copy — client interactive */}
      <ListDetailClient
        listId={id}
        currentYields={yields}
        ingredients={ingredients}
        sortedGroups={sortedGroups}
        typeLabels={INGREDIENT_TYPE_LABELS}
      />
    </div>
  )
}
