import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle } from 'lucide-react'
import type { ImportError } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Importaciones — Admin',
}

export default async function ImportErrorsPage() {
  const supabase = await createClient()
  const { data: errors } = await supabase
    .from('import_errors')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolved } = await supabase
    .from('import_errors')
    .select('count')

  const totalErrors = errors?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Errores de importación</h1>
        <p className="text-muted-foreground mt-1">
          Recetas que no se pudieron importar automáticamente.
        </p>
      </div>

      {totalErrors === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-semibold mb-1">¡Sin errores!</h2>
          <p className="text-muted-foreground">Todas las recetas se importaron correctamente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors?.map((err: ImportError) => (
            <div
              key={err.id}
              className="flex items-start gap-4 bg-card border border-border rounded-xl p-4"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {err.hf_recipe_name ?? err.hf_recipe_id ?? 'Receta desconocida'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {err.error_type && (
                    <span className="font-medium text-foreground">[{err.error_type}] </span>
                  )}
                  {err.error_message}
                </p>
                {err.hf_recipe_url && (
                  <a
                    href={err.hf_recipe_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver en HelloFresh →
                  </a>
                )}
              </div>
              <ResolveButton id={err.id} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-6 bg-card rounded-2xl border border-border">
        <h2 className="font-bold mb-3">Añadir receta manualmente</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Si una receta no se pudo importar, puedes añadirla manualmente aquí.
          Esta función completa estará disponible en el Sprint 4.
        </p>
        <button
          disabled
          className="text-sm px-4 py-2 rounded-lg bg-primary/20 text-primary font-medium cursor-not-allowed"
        >
          Añadir receta (Sprint 4)
        </button>
      </div>
    </div>
  )
}

function ResolveButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        await supabase
          .from('import_errors')
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .eq('id', id)
      }}
    >
      <button
        type="submit"
        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors shrink-0"
      >
        Resolver
      </button>
    </form>
  )
}
