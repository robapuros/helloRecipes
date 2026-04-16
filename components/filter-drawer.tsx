'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FilterControls } from '@/components/filter-controls'
import type { FilterState } from '@/components/filter-controls'

interface FilterDrawerProps {
  tagsByType: Record<string, Array<{ id: string; name: string; slug: string; count: number }>>
  currentFilters: FilterState
  activeCount: number
}

export function FilterDrawer({ tagsByType, currentFilters, activeCount }: FilterDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:border-primary hover:text-primary transition-colors bg-background"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
            {activeCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl overflow-y-auto px-4 pb-8 pt-2">
        <SheetHeader className="px-0 pb-2">
          <div className="mx-auto w-10 h-1 rounded-full bg-border mb-3" />
          <SheetTitle>Filtrar recetas</SheetTitle>
        </SheetHeader>

        <FilterControls
          tagsByType={tagsByType}
          currentFilters={currentFilters}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
