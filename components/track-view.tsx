'use client'

import { useEffect } from 'react'

interface TrackViewProps {
  recipeId: string
  slug: string
  name: string
  imageUrl: string | null
}

const STORAGE_KEY = 'hr:recently-viewed'
const MAX_ITEMS = 10

interface RecentRecipe {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  viewedAt: number
}

export function TrackView({ recipeId, slug, name, imageUrl }: TrackViewProps) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const existing: RecentRecipe[] = raw ? JSON.parse(raw) : []

      // Remove if already present, then prepend
      const filtered = existing.filter((r) => r.id !== recipeId)
      const updated = [
        { id: recipeId, slug, name, imageUrl, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Ignore storage errors
    }
  }, [recipeId, slug, name, imageUrl])

  return null
}
