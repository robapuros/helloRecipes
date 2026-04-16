'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { updateYieldsAction } from '@/app/actions/shopping-list'
import type { ShoppingListIngredient } from '@/types/database.types'

interface Props {
  listId: string
  currentYields: 2 | 4
  ingredients: ShoppingListIngredient[]
  sortedGroups: [string, ShoppingListIngredient[]][]
  typeLabels: Record<string, string>
}

export function ListDetailClient({ listId, currentYields, ingredients, sortedGroups, typeLabels }: Props) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const toggleCheck = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const handleYieldsChange = async (yields: 2 | 4) => {
    await updateYieldsAction(listId, yields)
    router.push(`/lista/${listId}?yields=${yields}`)
    router.refresh()
  }

  const handleCopy = async () => {
    const lines: string[] = []
    for (const [type, items] of sortedGroups) {
      lines.push(`\n${typeLabels[type] ?? type.toUpperCase()}`)
      for (const ing of items) {
        const amount = ing.total_amount != null ? `${ing.total_amount} ${ing.unit ?? ''}`.trim() : ''
        lines.push(`• ${ing.name}${amount ? ` — ${amount}` : ''}`)
      }
    }
    await navigator.clipboard.writeText(lines.join('\n').trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Servings toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Personas:</span>
          <div className="flex items-center rounded-full border border-border overflow-hidden text-sm">
            {([2, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => n !== currentYields && handleYieldsChange(n)}
                className={`px-3 py-1 transition-colors font-medium ${
                  currentYields === n
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar lista'}
        </button>
      </div>

      {/* Ingredient groups */}
      {sortedGroups.map(([type, items]) => (
        <div key={type} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {typeLabels[type] ?? type}
            </h2>
          </div>
          <ul className="divide-y divide-border/50">
            {items.map((ing) => {
              const key = `${ing.ingredient_id}-${ing.unit ?? ''}`
              const isChecked = checked.has(key)
              return (
                <li
                  key={key}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/30 ${
                    isChecked ? 'opacity-40' : ''
                  }`}
                  onClick={() => toggleCheck(key)}
                >
                  {/* Checkbox */}
                  <span
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked ? 'bg-primary border-primary' : 'border-input'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                  </span>

                  {/* Ingredient image */}
                  {ing.image_url ? (
                    <Image
                      src={ing.image_url}
                      alt={ing.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  )}

                  {/* Name + recipes */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isChecked ? 'line-through' : ''}`}>
                      {ing.name}
                    </p>
                    {ing.recipe_names && ing.recipe_names.length > 1 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {ing.recipe_names.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <span className="text-sm tabular-nums text-muted-foreground shrink-0 whitespace-nowrap">
                    {ing.total_amount != null
                      ? `${ing.total_amount} ${ing.unit ?? ''}`.trim()
                      : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {ingredients.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No se encontraron ingredientes para estas recetas con {currentYields} personas.
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
