import { create } from 'zustand'

interface SelectedRecipe {
  id: string
  name: string
  image_url: string | null
}

interface ShoppingListStore {
  selected: Map<string, SelectedRecipe>
  toggle: (recipe: SelectedRecipe) => void
  add: (recipe: SelectedRecipe) => void
  remove: (id: string) => void
  clear: () => void
  isSelected: (id: string) => boolean
  count: number
}

export const useShoppingListStore = create<ShoppingListStore>((set, get) => ({
  selected: new Map(),

  toggle: (recipe) =>
    set((s) => {
      const next = new Map(s.selected)
      if (next.has(recipe.id)) next.delete(recipe.id)
      else next.set(recipe.id, recipe)
      return { selected: next }
    }),

  add: (recipe) =>
    set((s) => {
      if (s.selected.has(recipe.id)) return s
      const next = new Map(s.selected)
      next.set(recipe.id, recipe)
      return { selected: next }
    }),

  remove: (id) =>
    set((s) => {
      const next = new Map(s.selected)
      next.delete(id)
      return { selected: next }
    }),

  clear: () => set({ selected: new Map() }),

  isSelected: (id) => get().selected.has(id),

  get count() {
    return get().selected.size
  },
}))
