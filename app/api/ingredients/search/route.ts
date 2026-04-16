import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, image_url')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)

  if (error) return NextResponse.json([])
  return NextResponse.json(data ?? [])
}
