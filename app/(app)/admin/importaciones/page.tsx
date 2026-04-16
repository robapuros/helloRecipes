import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, Plus } from 'lucide-react'
import type { ImportError } from '@/types/database.types'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: errors } = await supabase
    .from('import_errors')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const totalErrors = errors?.length ?? 0

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión del catálogo de recetas</p>
        </div>
        <Link
          href="/admin/recetas/nueva"
          className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nueva receta
        </Link>
      </div>

      {/* Import errors section */}
      <div>
        <h2 className="font-semibold mb-4">
          Errores de importación
          {totalErrors > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {totalErrors}
            </span>
          )}
        </h2>

        {totalErrors === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-semibold mb-1">Sin errores</h3>
            <p className="text-sm text-muted-foreground">Todas las recetas importadas correctamente.</p>
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
