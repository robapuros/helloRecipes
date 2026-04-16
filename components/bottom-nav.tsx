'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingCart, Settings } from 'lucide-react'
import { useShoppingListStore } from '@/store/shopping-list'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/?search=1', icon: Search, label: 'Buscar', matchHref: '/' },
  { href: '/lista', icon: ShoppingCart, label: 'Lista' },
  { href: '/admin/importaciones', icon: Settings, label: 'Admin' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { selected } = useShoppingListStore()
  const listCount = selected.size

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-14">
        {NAV_ITEMS.map(({ href, icon: Icon, label, matchHref }) => {
          const isActive = pathname === (matchHref ?? href)
          const isLista = href === '/lista'

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isLista && listCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {listCount > 9 ? '9+' : listCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
