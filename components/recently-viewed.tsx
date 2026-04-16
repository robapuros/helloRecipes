'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'

const STORAGE_KEY = 'hr:recently-viewed'

interface RecentRecipe {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  viewedAt: number
}

export function RecentlyViewed() {
  const [recipes, setRecipes] = useState<RecentRecipe[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecipes(JSON.parse(raw))
    } catch {
      // Ignore
    }
  }, [])

  if (recipes.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Vistas recientemente
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recetas/${recipe.slug}`}
            className="shrink-0 group flex flex-col gap-1.5 w-24"
          >
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted relative">
              {recipe.imageUrl ? (
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  fill
                  sizes="96px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
            </div>
            <p className="text-xs text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {recipe.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
