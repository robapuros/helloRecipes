import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const missingVars = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🍳</div>
          <h1 className="text-2xl font-bold text-foreground">HelloRecipes</h1>
          <p className="text-sm text-muted-foreground">
            Accede para ver vuestras recetas favoritas
          </p>
        </div>

        {/* Env var diagnostic — only visible when vars are missing */}
        {missingVars.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm space-y-1">
            <p className="font-semibold text-destructive">Faltan variables de entorno en Vercel:</p>
            {missingVars.map((v) => (
              <p key={v as string} className="font-mono text-xs text-destructive">{v as string}</p>
            ))}
            <p className="text-muted-foreground text-xs mt-2">
              Ve a Vercel → Settings → Environment Variables y añádelas. Luego haz redeploy.
            </p>
          </div>
        )}

        {/* Login form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
