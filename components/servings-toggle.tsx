'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { RecipeIngredient, Ingredient } from '@/types/database.types'

type IngredientWithDetails = RecipeIngredient & { ingredient: Ingredient }

interface ServingsToggleProps {
  ingredients2: IngredientWithDetails[]
  ingredients4: IngredientWithDetails[]
}

export function ServingsToggle({ ingredients2, ingredients4 }: ServingsToggleProps) {
  const [servings, setServings] = useState<2 | 4>(2)
  const ingredients = servings === 2 ? ingredients2 : ingredients4

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Ingredientes</h2>
        {/* Servings toggle */}
        <div className="flex items-center rounded-full border border-border overflow-hidden text-sm">
          {([2, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => setServings(n)}
              className={`px-3 py-1 transition-colors font-medium ${
                servings === n
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary text-muted-foreground'
              }`}
            >
              {n} pers.
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-0.5">
        {ingredients.map((ri) => (
          <li
            key={ri.id}
            className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0 gap-3"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              {ri.ingredient?.image_url ? (
                <Image
                  src={ri.ingredient.image_url}
                  alt={ri.ingredient.name ?? ''}
                  width={28}
                  height={28}
                  className="rounded-full object-cover bg-muted shrink-0"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-muted shrink-0" />
              )}
              <span className="truncate">{ri.ingredient?.name ?? ''}</span>
            </span>
            <span className="text-muted-foreground tabular-nums whitespace-nowrap shrink-0">
              {ri.amount != null ? `${ri.amount} ${ri.unit ?? ''}`.trim() : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
