import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const set_number = searchParams.get('set_number')
  if (!set_number) return NextResponse.json({ error: 'set_number required' }, { status: 400 })

  const { data: set } = await supabase
    .from('lego_sets')
    .select('*')
    .eq('set_number', set_number)
    .single()

  if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })

  return NextResponse.json({ set })
}
