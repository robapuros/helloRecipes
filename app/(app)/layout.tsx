import Link from 'next/link'
import { ChefHat, ShoppingCart, Settings } from 'lucide-react'
import { ShoppingListBar } from '@/components/shopping-list-bar'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity"
          >
            <ChefHat className="w-6 h-6" />
            <span>HelloRecipes</span>
          </Link>

          {/* Desktop nav only */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              href="/lista"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
            >
              <ShoppingCart className="w-4 h-4" />
              Lista de la compra
            </Link>
            <Link
              href="/admin/importaciones"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
            >
              <Settings className="w-4 h-4" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content — extra bottom padding on mobile for bottom nav */}
      <main className="flex-1 pb-16 lg:pb-0">
        {children}
      </main>

      {/* Footer — hidden on mobile (bottom nav replaces it) */}
      <footer className="hidden lg:block border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <p>HelloRecipes — Conservando nuestras recetas favoritas 💚</p>
      </footer>

      {/* Floating shopping list bar — sits above bottom nav on mobile */}
      <ShoppingListBar />

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
