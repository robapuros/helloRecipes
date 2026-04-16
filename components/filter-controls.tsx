'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, Soup, UtensilsCrossed, Package } from 'lucide-react'
import { IngredientSearch } from '@/components/ingredient-search'
import type { SelectedIngredient } from '@/components/ingredient-search'

export interface FilterState {
  search?: string
  maxTime?: number
  difficulty?: number[]
  tagSlugs?: string[]
  ingredientIds?: string[]
  ingredientMode?: 'all' | 'any'
  utensilIds?: string[]
}

interface FilterControlsProps {
  tagsByType: Record<string, Array<{ id: string; name: string; slug: string; count: number }>>
  utensils: Array<{ id: string; name: string; type: string | null; count: number }>
  currentFilters: FilterState
  initialIngredients?: SelectedIngredient[]
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

// Style presets: tag slugs commonly used in HelloFresh ES
const STYLE_PRESETS = [
  {
    id: 'cuchara',
    label: 'Con cuchara',
    icon: Soup,
    tagSlugs: ['sopas-y-cremas', 'sopa', 'crema', 'estofado', 'curry'],
  },
  {
    id: 'tenedor',
    label: 'Con tenedor',
    icon: UtensilsCrossed,
    tagSlugs: ['pasta', 'ensalada', 'arroz', 'carne', 'pescado'],
  },
  {
    id: 'taper',
    label: 'Para táper',
    icon: Package,
    tagSlugs: ['especial-para-taper', 'para-taper', 'taper', 'meal-prep'],
  },
]

export function FilterControls({
  tagsByType,
  utensils,
  currentFilters,
  initialIngredients = [],
  onClose,
}: FilterControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Local ingredient state (managed here, synced to URL)
  const [selectedIngredients, setSelectedIngredients] =
    useState<SelectedIngredient[]>(initialIngredients)

  const buildParams = useCallback(
    (
      overrides: Partial<{
        q: string | null
        maxTime: number | null
        difficulty: number[]
        tags: string[]
        ingredientIds: string[]
        ingredientMode: 'all' | 'any'
        utensilIds: string[]
      }>,
    ) => {
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
      if ('ingredientIds' in overrides) {
        p.delete('ingredientIds')
        overrides.ingredientIds?.forEach((id) => p.append('ingredientIds', id))
      }
      if ('ingredientMode' in overrides) {
        if (overrides.ingredientMode && overrides.ingredientMode !== 'all') {
          p.set('ingredientMode', overrides.ingredientMode)
        } else {
          p.delete('ingredientMode')
        }
      }
      if ('utensilIds' in overrides) {
        p.delete('utensilIds')
        overrides.utensilIds?.forEach((id) => p.append('utensilIds', id))
      }
      return p
    },
    [searchParams],
  )

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `/?${qs}` : '/')
      })
      onClose?.()
    },
    [router, onClose],
  )

  const toggleTime = (t: number) => {
    navigate(buildParams({ maxTime: currentFilters.maxTime === t ? null : t }))
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

  const toggleUtensil = (id: string) => {
    const current = currentFilters.utensilIds ?? []
    const next = current.includes(id) ? current.filter((u) => u !== id) : [...current, id]
    navigate(buildParams({ utensilIds: next }))
  }

  const handleIngredientSelect = (ing: SelectedIngredient) => {
    const next = [...selectedIngredients, ing]
    setSelectedIngredients(next)
    navigate(
      buildParams({
        ingredientIds: next.map((i) => i.id),
        ingredientMode: currentFilters.ingredientMode,
      }),
    )
  }

  const handleIngredientRemove = (id: string) => {
    const next = selectedIngredients.filter((i) => i.id !== id)
    setSelectedIngredients(next)
    navigate(
      buildParams({
        ingredientIds: next.map((i) => i.id),
        ingredientMode: next.length > 0 ? currentFilters.ingredientMode : undefined,
      }),
    )
  }

  const handleModeChange = (mode: 'all' | 'any') => {
    navigate(buildParams({ ingredientMode: mode }))
  }

  const applyStylePreset = (preset: (typeof STYLE_PRESETS)[number]) => {
    // Toggle: if all preset tags already active, clear them; otherwise set them
    const current = currentFilters.tagSlugs ?? []
    const presetActive = preset.tagSlugs.some((s) => current.includes(s))
    const next = presetActive
      ? current.filter((s) => !preset.tagSlugs.includes(s))
      : [...current.filter((s) => !STYLE_PRESETS.flatMap((p) => p.tagSlugs).includes(s)), ...preset.tagSlugs]
    navigate(buildParams({ tags: next }))
  }

  const clearAll = () => {
    setSelectedIngredients([])
    navigate(new URLSearchParams())
  }

  const hasActiveFilters =
    !!currentFilters.search ||
    !!currentFilters.maxTime ||
    (currentFilters.difficulty?.length ?? 0) > 0 ||
    (currentFilters.tagSlugs?.length ?? 0) > 0 ||
    (currentFilters.ingredientIds?.length ?? 0) > 0 ||
    (currentFilters.utensilIds?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
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
              autoComplete="off"
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

      {/* Estilo de plato */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Estilo de plato
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((preset) => {
            const Icon = preset.icon
            const isActive = preset.tagSlugs.some((s) =>
              (currentFilters.tagSlugs ?? []).includes(s),
            )
            return (
              <button
                key={preset.id}
                onClick={() => applyStylePreset(preset)}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary hover:text-primary'
                }`}
              >
                <Icon className="w-3 h-3" />
                {preset.label}
              </button>
            )
          })}
        </div>
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

      {/* Ingredient search */}
      <IngredientSearch
        selected={selectedIngredients}
        mode={currentFilters.ingredientMode ?? 'all'}
        onSelect={handleIngredientSelect}
        onRemove={handleIngredientRemove}
        onModeChange={handleModeChange}
      />

      {/* Utensils */}
      {utensils.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Utensilios
          </p>
          <div className="space-y-1.5">
            {utensils.slice(0, 10).map((u) => {
              const isActive = (currentFilters.utensilIds ?? []).includes(u.id)
              return (
                <button
                  key={u.id}
                  onClick={() => toggleUtensil(u.id)}
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
                    {u.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{u.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tags by type */}
      {Object.entries(tagsByType)
        .filter(([, tags]) => tags.some((t) => t.count > 0))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, typeTags]) => {
          const visible = typeTags.filter((t) => t.count > 0).slice(0, 8)
          if (visible.length === 0) return null
          return (
            <div key={type} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {TAG_TYPE_LABELS[type] ?? type}
              </p>
              <div className="space-y-1">
                {visible.map((tag) => {
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
