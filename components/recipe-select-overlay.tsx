'use client'

import { useShoppingListStore } from '@/store/shopping-list'
import { RecipeCard } from '@/components/recipe-card'
import type { RecipeCardData } from '@/types/database.types'

interface Props {
  recipe: RecipeCardData
}

export function SelectableRecipeCard({ recipe }: Props) {
  const { selected: selectedMap, toggle } = useShoppingListStore()
  const selected = selectedMap.has(recipe.id)

  return (
    <div className="relative group/selectable">
      <RecipeCard recipe={recipe} />
      {/* Checkbox overlay */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle({ id: recipe.id, name: recipe.name, image_url: recipe.image_url })
        }}
        aria-label={selected ? 'Quitar de la lista' : 'Añadir a la lista'}
        className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all z-10
          ${selected
            ? 'bg-primary border-primary shadow-md'
            : 'bg-white/80 border-white/60 opacity-0 group-hover/selectable:opacity-100 backdrop-blur-sm shadow'
          }`}
      >
        {selected && (
          <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
