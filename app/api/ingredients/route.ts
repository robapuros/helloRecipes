import { NextRequest, NextResponse } from 'next/server'
import { searchIngredients } from '@/lib/queries/ingredients'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])
  const results = await searchIngredients(q, 15)
  return NextResponse.json(results)
}
