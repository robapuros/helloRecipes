import Link from 'next/link'
import { ChefHat, ShoppingCart, Settings } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity">
            <ChefHat className="w-6 h-6" />
            <span>HelloRecipes</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/lista"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Lista de la compra</span>
            </Link>
            <Link
              href="/admin/importaciones"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <p>HelloRecipes — Conservando nuestras recetas favoritas 💚</p>
      </footer>
    </div>
  )
}
