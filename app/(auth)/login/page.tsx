import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
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

        {/* Login form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
