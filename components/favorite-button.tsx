'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavoriteAction } from '@/app/actions/favorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  recipeId: string
  initialFavorite: boolean
  /** 'card' = circular overlay button on image (default); 'inline' = text-style for meta strips */
  variant?: 'card' | 'inline'
  className?: string
}

export function FavoriteButton({
  recipeId,
  initialFavorite,
  variant = 'card',
  className,
}: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(initialFavorite)
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return
    startTransition(async () => {
      const next = await toggleFavoriteAction(recipeId)
      setIsFav(next)
    })
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium transition-colors',
          isFav ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500',
          className,
        )}
      >
        <Heart className={cn('w-4 h-4', isFav ? 'fill-rose-500' : '')} />
        <span>{isFav ? 'Favorita' : 'Guardar'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center transition-all backdrop-blur-sm shadow',
        isFav
          ? 'bg-rose-500/90 text-white opacity-100'
          : 'bg-black/30 text-white opacity-0 group-hover/selectable:opacity-100 hover:bg-rose-500/80',
        className,
      )}
    >
      <Heart className={cn('w-4 h-4', isFav ? 'fill-white' : '')} />
    </button>
  )
}
