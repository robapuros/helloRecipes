import Link from 'next/link'
import { ShoppingCart, Plus, Trash2, ChevronRight } from 'lucide-react'
import { getShoppingLists } from '@/lib/queries/shopping-lists'
import { deleteShoppingListAction } from '@/app/actions/shopping-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Listas de la compra' }

export default async function ListaIndexPage() {
  const lists = await getShoppingLists()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listas de la compra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selecciona recetas en la galería y crea una lista de ingredientes
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Sin listas todavía</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ve a la galería, selecciona recetas y pulsa &ldquo;Crear lista&rdquo;.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Ir a la galería
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {lists.map((list) => (
            <li
              key={list.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors group"
            >
              <Link href={`/lista/${list.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{list.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.recipeCount} receta{list.recipeCount !== 1 ? 's' : ''} ·{' '}
                    {new Date(list.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
              </Link>
              <form
                action={async () => {
                  'use server'
                  await deleteShoppingListAction(list.id)
                }}
              >
                <button
                  type="submit"
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                  aria-label="Eliminar lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
