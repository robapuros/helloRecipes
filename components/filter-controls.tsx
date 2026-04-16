'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

export interface FilterState {
  search?: string
  maxTime?: number
  difficulty?: number[]
  tagSlugs?: string[]
}

interface FilterControlsProps {
  tagsByType: Record<string, Array<{ id: string; name: string; slug: string; count: number }>>
  currentFilters: FilterState
  onClose?: () => void
}

const TIME_OPTIONS = [15, 25, 35, 45, 60]

const DIFFICULTY_OPTIONS = [
  { value: 0, label: 'Fácil' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Difícil' },
  { value: 3, label: 'Experto' },
]

const TAG_TYPE_LABELS: Record<string, string> = {
  'meal-type': 'Tipo de comida',
  cuisine: 'Cocina',
  preference: 'Preferencias',
  feature: 'Características',
  diet: 'Dieta',
  other: 'Más categorías',
}

export function FilterControls({ tagsByType, currentFilters, onClose }: FilterControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildParams = useCallback(
    (overrides: Partial<{
      q: string | null
      maxTime: number | null
      difficulty: number[]
      tags: string[]
    }>) => {
      const p = new URLSearchParams(searchParams.toString())

      if ('q' in overrides) {
        if (overrides.q) p.set('q', overrides.q)
        else p.delete('q')
      }
      if ('maxTime' in overrides) {
        if (overrides.maxTime != null) p.set('maxTime', String(overrides.maxTime))
        else p.delete('maxTime')
      }
      if ('difficulty' in overrides) {
        p.delete('difficulty')
        overrides.difficulty?.forEach((d) => p.append('difficulty', String(d)))
      }
      if ('tags' in overrides) {
        p.delete('tags')
        overrides.tags?.forEach((s) => p.append('tags', s))
      }
      return p
    },
    [searchParams],
  )

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString()
      router.push(qs ? `/?${qs}` : '/')
      onClose?.()
    },
    [router, onClose],
  )

  const toggleTime = (t: number) => {
    const isActive = currentFilters.maxTime === t
    navigate(buildParams({ maxTime: isActive ? null : t }))
  }

  const toggleDifficulty = (d: number) => {
    const current = currentFilters.difficulty ?? []
    const next = current.includes(d) ? current.filter((v) => v !== d) : [...current, d]
    navigate(buildParams({ difficulty: next }))
  }

  const toggleTag = (slug: string) => {
    const current = currentFilters.tagSlugs ?? []
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    navigate(buildParams({ tags: next }))
  }

  const clearAll = () => navigate(new URLSearchParams())

  const hasActiveFilters =
    !!currentFilters.search ||
    !!currentFilters.maxTime ||
    (currentFilters.difficulty?.length ?? 0) > 0 ||
    (currentFilters.tagSlugs?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Filtros
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar todo
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Buscar
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
            navigate(buildParams({ q: q || null }))
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              name="q"
              defaultValue={currentFilters.search}
              placeholder="Busca una receta..."
              className="pl-8 h-8 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-8 px-3 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 shrink-0"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Max time */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tiempo máximo
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((t) => {
            const isActive = currentFilters.maxTime === t
            return (
              <button
                key={t}
                onClick={() => toggleTime(t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary hover:text-primary'
                }`}
              >
                {t === 60 ? '+60 min' : `${t} min`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Dificultad
        </p>
        <div className="space-y-1.5">
          {DIFFICULTY_OPTIONS.map(({ value, label }) => {
            const isActive = (currentFilters.difficulty ?? []).includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleDifficulty(value)}
                className={`w-full flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 transition-colors text-left ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-primary border-primary' : 'border-input'
                  }`}
                >
                  {isActive && <span className="text-primary-foreground text-[10px]">✓</span>}
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tags by type */}
      {Object.entries(tagsByType)
        .filter(([, tags]) => tags.some((t) => t.count > 0))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, typeTags]) => {
          const visibleTags = typeTags.filter((t) => t.count > 0).slice(0, 8)
          if (visibleTags.length === 0) return null
          return (
            <div key={type} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {TAG_TYPE_LABELS[type] ?? type}
              </p>
              <div className="space-y-1">
                {visibleTags.map((tag) => {
                  const isActive = (currentFilters.tagSlugs ?? []).includes(tag.slug)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className={`w-full flex items-center justify-between text-sm rounded-lg px-2 py-1.5 transition-colors text-left ${
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-primary border-primary' : 'border-input'
                          }`}
                        >
                          {isActive && (
                            <span className="text-primary-foreground text-[10px]">✓</span>
                          )}
                        </span>
                        {tag.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{tag.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
    </div>
  )
}
