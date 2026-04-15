import type { Metadata } from 'next'
import { ShoppingCart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Lista de la compra',
}

export default function ShoppingListPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Lista de la compra</h1>
      <p className="text-muted-foreground">
        La función de lista de la compra estará disponible en el Sprint 4.
        <br />
        Podrás seleccionar recetas y generar una lista automáticamente.
      </p>
    </div>
  )
}
