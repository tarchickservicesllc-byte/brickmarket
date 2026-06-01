import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit
  const theme = searchParams.get('theme')
  const condition = searchParams.get('condition')
  const search = searchParams.get('search')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')

  let query = supabase
    .from('listings')
    .select(`
      *,
      lego_set:lego_sets(id, name, set_number, theme, image_url),
      seller:profiles!listings_seller_id_fkey(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (condition) query = query.eq('condition', condition)
  if (minPrice) query = query.gte('price', parseFloat(minPrice))
  if (maxPrice) query = query.lte('price', parseFloat(maxPrice))

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ listings: data, total: count, page, limit })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { set_id, title, description, price, condition, is_trade_ok, trade_wants, images, location } = body

  if (!set_id || !title || !price || !condition) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { data, error } = await service.from('listings').insert({
    seller_id: user.id,
    set_id,
    title,
    description: description ?? null,
    price: parseFloat(price),
    condition,
    is_trade_ok: is_trade_ok ?? false,
    trade_wants: trade_wants ?? null,
    images: images ?? [],
    location: location ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ listing: data }, { status: 201 })
}
