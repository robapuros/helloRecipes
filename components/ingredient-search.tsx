'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Search, X, ChevronDown } from 'lucide-react'

export interface SelectedIngredient {
  id: string
  name: string
  image_url?: string | null
}

interface IngredientSearchProps {
  selected: SelectedIngredient[]
  mode: 'all' | 'any'
  onSelect: (ingredient: SelectedIngredient) => void
  onRemove: (id: string) => void
  onModeChange: (mode: 'all' | 'any') => void
}

export function IngredientSearch({
  selected,
  mode,
  onSelect,
  onRemove,
  onModeChange,
}: IngredientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SelectedIngredient[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/ingredients/search?q=${encodeURIComponent(q)}`)
      const data: SelectedIngredient[] = await res.json()
      const selectedIds = new Set(selected.map((s) => s.id))
      setResults(data.filter((d) => !selectedIds.has(d.id)))
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [selected])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(val), 300)
  }

  const handleSelect = (ingredient: SelectedIngredient) => {
    onSelect(ingredient)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Ingredientes que tengo
        </p>
        {selected.length > 1 && (
          <div className="flex items-center rounded-full border border-border overflow-hidden text-[11px]">
            {(['all', 'any'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`px-2 py-0.5 transition-colors font-medium ${
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {m === 'all' ? 'TODOS' : 'ALGUNO'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((ing) => (
            <span
              key={ing.id}
              className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium"
            >
              {ing.image_url && (
                <Image
                  src={ing.image_url}
                  alt={ing.name}
                  width={14}
                  height={14}
                  className="rounded-full object-cover"
                />
              )}
              {ing.name}
              <button
                onClick={() => onRemove(ing.id)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input + dropdown */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Escribe un ingrediente..."
            className="w-full h-8 pl-8 pr-7 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {loading && (
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
            <ul className="max-h-52 overflow-y-auto py-1">
              {results.map((ing) => (
                <li key={ing.id}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(ing)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted text-left"
                  >
                    {ing.image_url ? (
                      <Image
                        src={ing.image_url}
                        alt={ing.name}
                        width={20}
                        height={20}
                        className="rounded-full object-cover bg-muted shrink-0"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-muted shrink-0" />
                    )}
                    {ing.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {open && !loading && query.length >= 2 && results.length === 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg">
            <p className="px-3 py-3 text-sm text-muted-foreground text-center">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
