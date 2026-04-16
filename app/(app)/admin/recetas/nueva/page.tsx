import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RecipeForm } from '@/components/admin/recipe-form'
import { getTagsWithCounts } from '@/lib/queries/recipes'
import { getUtensilsWithCounts } from '@/lib/queries/ingredients'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nueva receta — Admin' }

export default async function NuevaRecetaPage() {
  const [allTags, utensils] = await Promise.all([
    getTagsWithCounts(),
    getUtensilsWithCounts(),
  ])

  // Only show tags that have at least 1 recipe, sorted by name
  const tags = allTags
    .filter((t) => t.count > 0)
    .map(({ id, name, slug, type }) => ({ id, name, slug, type }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/importaciones"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nueva receta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Añade una receta manualmente al catálogo
          </p>
        </div>
      </div>

      <RecipeForm
        tags={tags}
        utensils={utensils.map(({ id, name }) => ({ id, name }))}
      />
    </div>
  )
}
