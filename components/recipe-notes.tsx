'use client'

import { useState, useRef, useTransition } from 'react'
import { NotebookPen, Check } from 'lucide-react'
import { saveNoteAction } from '@/app/actions/notes'

interface RecipeNotesProps {
  recipeId: string
  initialNote: string | null
}

export function RecipeNotes({ recipeId, initialNote }: RecipeNotesProps) {
  const [value, setValue] = useState(initialNote ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const savedRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBlur = () => {
    const content = value.trim()
    startTransition(async () => {
      await saveNoteAction(recipeId, content)
      setSaved(true)
      if (savedRef.current) clearTimeout(savedRef.current)
      savedRef.current = setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="mt-8 pt-6 border-t border-border space-y-3">
      <div className="flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Mis notas</h2>
        {saved && !isPending && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 ml-auto">
            <Check className="w-3 h-3" />
            Guardado
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Añade notas personales sobre esta receta... (se guarda automáticamente)"
        rows={4}
        className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60 transition-colors"
      />
    </div>
  )
}
