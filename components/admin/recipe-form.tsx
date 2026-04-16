'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Search, X } from 'lucide-react'
import { createRecipeAction } from '@/app/actions/admin'
import type { ManualRecipeInput } from '@/app/actions/admin'

interface Tag { id: string; name: string; slug: string; type: string | null }
interface Utensil { id: string; name: string }
interface IngredientHit { id: string; name: string; type: string | null }

interface IngredientRow {
  ingredient_id: string
  name: string
  amount2: string
  unit2: string
  amount4: string
  unit4: string
}

interface Step { instructions: string }

const DIFFICULTIES = [
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
  other: 'Otros',
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface RecipeFormProps {
  tags: Tag[]
  utensils: Utensil[]
}

export function RecipeForm({ tags, utensils }: RecipeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Basic fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  // Steps
  const [steps, setSteps] = useState<Step[]>([{ instructions: '' }])

  // Ingredients
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([])
  const [ingSearch, setIngSearch] = useState('')
  const [ingResults, setIngResults] = useState<IngredientHit[]>([])
  const [ingLoading, setIngLoading] = useState(false)

  // Tags & Utensils
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedUtensilIds, setSelectedUtensilIds] = useState<string[]>([])

  // Nutrition
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fiber, setFiber] = useState('')
  const [sodium, setSodium] = useState('')

  // Ingredient search with debounce
  const searchIngredients = useCallback(async (q: string) => {
    if (q.length < 2) { setIngResults([]); return }
    setIngLoading(true)
    try {
      const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}`)
      setIngResults(await res.json())
    } finally {
      setIngLoading(false)
    }
  }, [])

  const handleIngSearchChange = (val: string) => {
    setIngSearch(val)
    searchIngredients(val)
  }

  const addIngredient = (hit: IngredientHit) => {
    if (ingredientRows.some((r) => r.ingredient_id === hit.id)) return
    setIngredientRows((prev) => [
      ...prev,
      { ingredient_id: hit.id, name: hit.name, amount2: '', unit2: '', amount4: '', unit4: '' },
    ])
    setIngSearch('')
    setIngResults([])
  }

  const removeIngredient = (id: string) =>
    setIngredientRows((prev) => prev.filter((r) => r.ingredient_id !== id))

  const updateIngRow = (id: string, field: keyof IngredientRow, val: string) =>
    setIngredientRows((prev) =>
      prev.map((r) => (r.ingredient_id === id ? { ...r, [field]: val } : r)),
    )

  const addStep = () => setSteps((prev) => [...prev, { instructions: '' }])
  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i))
  const updateStep = (i: number, val: string) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { instructions: val } : s)))

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const toggleUtensil = (id: string) =>
    setSelectedUtensilIds((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id])

  const tagsByType = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const key = tag.type ?? 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(tag)
    return acc
  }, {})

  const handleSubmit = () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    if (steps.every((s) => !s.instructions.trim())) { setError('Añade al menos un paso'); return }
    setError(null)

    const numOrNull = (s: string) => (s.trim() ? Number(s) : null)

    const input: ManualRecipeInput = {
      name: name.trim(),
      slug: slugManual ? slug : slugify(name),
      headline,
      description,
      total_time_min: numOrNull(totalTime),
      prep_time_min: numOrNull(prepTime),
      difficulty,
      image_url: imageUrl,
      steps,
      ingredientRows: ingredientRows.map((r) => ({
        ingredient_id: r.ingredient_id,
        name: r.name,
        amount2: numOrNull(r.amount2),
        unit2: r.unit2,
        amount4: numOrNull(r.amount4),
        unit4: r.unit4,
      })),
      tagIds: selectedTagIds,
      utensilIds: selectedUtensilIds,
      nutrition:
        calories || protein || fat || carbs || fiber || sodium
          ? {
              calories: numOrNull(calories),
              protein_g: numOrNull(protein),
              fat_g: numOrNull(fat),
              carbs_g: numOrNull(carbs),
              fiber_g: numOrNull(fiber),
              sodium_mg: numOrNull(sodium),
            }
          : null,
    }

    startTransition(async () => {
      const result = await createRecipeAction(input)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Basic info ── */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-bold text-base">Información básica</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Nombre <span className="text-destructive">*</span></label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!slugManual) setSlug(slugify(e.target.value))
              }}
              placeholder="Pollo al limón con patatas"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Slug */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
              placeholder="pollo-al-limon-con-patatas"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Headline */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Subtítulo</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Una receta fácil y deliciosa para toda la familia"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada de la receta..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Times */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tiempo total (min)</label>
            <input
              type="number"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              placeholder="35"
              min={1}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tiempo de preparación (min)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="15"
              min={1}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dificultad</label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDifficulty(difficulty === value ? null : value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    difficulty === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL de la imagen</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-bold text-base">Pasos de preparación <span className="text-destructive">*</span></h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-1">
                {i + 1}
              </div>
              <textarea
                value={step.instructions}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={`Describe el paso ${i + 1}...`}
                rows={3}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="self-start mt-1 p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="w-4 h-4" />
          Añadir paso
        </button>
      </section>

      {/* ── Ingredients ── */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-bold text-base">Ingredientes</h2>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={ingSearch}
              onChange={(e) => handleIngSearchChange(e.target.value)}
              placeholder="Buscar ingrediente..."
              autoComplete="off"
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            {ingLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          </div>
          {ingResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-56 overflow-y-auto">
              {ingResults.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => addIngredient(hit)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                >
                  <span className="font-medium">{hit.name}</span>
                  {hit.type && <span className="text-xs text-muted-foreground ml-auto">{hit.type}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected ingredients */}
        {ingredientRows.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px_32px] gap-2 text-xs text-muted-foreground px-1">
              <span>Ingrediente</span>
              <span>Cant. ×2</span>
              <span>Unidad ×2</span>
              <span>Cant. ×4</span>
              <span>Unidad ×4</span>
              <span />
            </div>
            {ingredientRows.map((row) => (
              <div key={row.ingredient_id} className="grid grid-cols-[1fr_80px_80px_80px_80px_32px] gap-2 items-center">
                <span className="text-sm truncate">{row.name}</span>
                <input
                  type="number"
                  value={row.amount2}
                  onChange={(e) => updateIngRow(row.ingredient_id, 'amount2', e.target.value)}
                  placeholder="—"
                  min={0}
                  step="any"
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={row.unit2}
                  onChange={(e) => updateIngRow(row.ingredient_id, 'unit2', e.target.value)}
                  placeholder="g, ml…"
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="number"
                  value={row.amount4}
                  onChange={(e) => updateIngRow(row.ingredient_id, 'amount4', e.target.value)}
                  placeholder="—"
                  min={0}
                  step="any"
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={row.unit4}
                  onChange={(e) => updateIngRow(row.ingredient_id, 'unit4', e.target.value)}
                  placeholder="g, ml…"
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(row.ingredient_id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {ingredientRows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Busca y añade ingredientes del catálogo existente.
          </p>
        )}
      </section>

      {/* ── Tags & Utensils ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Tags */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-bold text-base">Categorías</h2>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {Object.entries(tagsByType).map(([type, typeTags]) => (
              <div key={type}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  {TAG_TYPE_LABELS[type] ?? type}
                </p>
                <div className="space-y-1">
                  {typeTags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`w-full flex items-center gap-2 text-sm rounded-lg px-2 py-1 transition-colors text-left ${
                          active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-primary border-primary' : 'border-input'}`}>
                          {active && <span className="text-primary-foreground text-[9px]">✓</span>}
                        </span>
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Utensils */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-bold text-base">Utensilios</h2>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {utensils.map((u) => {
              const active = selectedUtensilIds.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUtensil(u.id)}
                  className={`w-full flex items-center gap-2 text-sm rounded-lg px-2 py-1 transition-colors text-left ${
                    active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-primary border-primary' : 'border-input'}`}>
                    {active && <span className="text-primary-foreground text-[9px]">✓</span>}
                  </span>
                  {u.name}
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* ── Nutrition ── */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-bold text-base">Valores nutricionales <span className="text-muted-foreground font-normal text-sm">(por ración, opcional)</span></h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Calorías (kcal)', value: calories, set: setCalories },
            { label: 'Proteínas (g)', value: protein, set: setProtein },
            { label: 'Grasas (g)', value: fat, set: setFat },
            { label: 'Carbohidratos (g)', value: carbs, set: setCarbs },
            { label: 'Fibra (g)', value: fiber, set: setFiber },
            { label: 'Sodio (mg)', value: sodium, set: setSodium },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="—"
                min={0}
                step="any"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending ? 'Guardando…' : 'Guardar receta'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
