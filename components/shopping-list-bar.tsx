'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingCart, X, ChefHat, Loader2 } from 'lucide-react'
import { useShoppingListStore } from '@/store/shopping-list'
import { Button } from '@/components/ui/button'
import { createShoppingListAction } from '@/app/actions/shopping-list'

export function ShoppingListBar() {
  const { selected, remove, clear } = useShoppingListStore()
  const [listName, setListName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const recipes = Array.from(selected.values())
  const count = selected.size

  if (count === 0) return null

  const handleCreate = () => {
    const name = listName.trim() || `Lista ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
    startTransition(async () => {
      const id = await createShoppingListAction(name, recipes.map((r) => r.id))
      clear()
      setShowNameInput(false)
      setListName('')
      router.push(`/lista/${id}`)
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Recipe thumbnails row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/50 overflow-x-auto no-scrollbar">
          <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
          <div className="flex gap-1.5 flex-1 min-w-0">
            {recipes.map((r) => (
              <div key={r.id} className="relative shrink-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted">
                  {r.image_url ? (
                    <Image src={r.image_url} alt={r.name} width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                  )}
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={clear} className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Limpiar
          </button>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <p className="flex-1 text-sm font-medium">
            <span className="text-primary font-bold">{count}</span>{' '}
            receta{count !== 1 ? 's' : ''} seleccionada{count !== 1 ? 's' : ''}
          </p>

          {showNameInput ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder={`Lista del ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                className="flex-1 h-8 text-sm px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button size="sm" onClick={handleCreate} disabled={isPending} className="h-8 shrink-0">
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
              </Button>
              <button onClick={() => setShowNameInput(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setShowNameInput(true)} className="gap-1.5 h-8 shrink-0">
              <ChefHat className="w-3.5 h-3.5" />
              Crear lista
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
