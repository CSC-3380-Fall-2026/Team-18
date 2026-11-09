import { supabase } from './supabase'
import type { Listing } from '../data/sampleListings'

// Listings without a photo get an emoji stand-in for their category
const categoryIcons: Record<string, string> = {
  Textbooks: '📚',
  'Clothing & Merch': '👕',
  Electronics: '💻',
  Furniture: '🛋️',
  'Dorm & Kitchen': '🧊',
  Tickets: '🎟️',
  Other: '📦',
}

type ListingRow = {
  id: string
  title: string
  price: number
  pickup_location: string
  seasonal_tag: string | null
  category: string
  condition: string
  seller_id: string
  photos: string[] | null
}

type ProfileRow = {
  id: string
  full_name: string | null
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return letters.toUpperCase()
}

// Load every available listing (newest first) and attach each seller's name
export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price, pickup_location, seasonal_tag, category, condition, seller_id, photos')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Could not load listings:', error.message)
    return []
  }

  const rows = (data ?? []) as ListingRow[]
  if (rows.length === 0) return []

  // Look up the sellers' profiles in one request
  const sellerIds = [...new Set(rows.map((row) => row.seller_id))]
  const { data: profileData } = await supabase.from('profiles').select('id, full_name').in('id', sellerIds)
  const names = new Map(((profileData ?? []) as ProfileRow[]).map((p) => [p.id, p.full_name]))

  return rows.map((row) => {
    const name = names.get(row.seller_id) || 'LSU Student'
    return {
      id: row.id,
      title: row.title,
      price: Number(row.price),
      pickup: row.pickup_location,
      tag: row.seasonal_tag ?? row.category,
      icon: categoryIcons[row.category] ?? '📦',
      photo: row.photos?.[0] ?? null,
      condition: row.condition,
      seller: {
        name,
        initials: initialsFrom(name),
        rating: 0,
        trades: 0,
        // Only @lsu.edu emails can sign up, so every seller is a verified LSU student
        verified: true,
      },
    }
  })
}
