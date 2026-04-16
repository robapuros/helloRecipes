'use client'

import { useEffect, useState } from 'react'
import { Clock, ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils/time'
import { useShoppingListStore } from '@/store/shopping-list'

interface RecipeStickyHeaderProps {
  recipeId: string
  name: string
  imageUrl: string | null
  totalTimeMin: number | null
}

export function RecipeStickyHeader({ recipeId, name, imageUrl, totalTimeMin }: RecipeStickyHeaderProps) {
  const [visible, setVisible] = useState(false)
  const { isSelected, toggle } = useShoppingListStore()
  const selected = isSelected(recipeId)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
        <p className="font-semibold text-sm truncate">{name}</p>
        <div className="flex items-center gap-3 shrink-0">
          {totalTimeMin && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(totalTimeMin)}
            </span>
          )}
          <Button
            size="sm"
            variant={selected ? 'default' : 'outline'}
            className="h-7 text-xs gap-1.5"
            onClick={() => toggle({ id: recipeId, name, image_url: imageUrl })}
          >
            {selected ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{selected ? 'En la lista' : 'Añadir a lista'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
