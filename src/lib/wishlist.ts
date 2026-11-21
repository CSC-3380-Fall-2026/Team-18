import { supabase } from './supabase'
import type { Listing } from '../data/sampleListings'

export type WishlistAlert = {
  id: string
  keyword: string
  created_at: string
}

// ---------- Saved items (the ♡ button) ----------

// IDs of every listing I've saved
export async function fetchSavedIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from('saved_listings').select('listing_id')
  if (error) {
    console.error('Could not load saved items:', error.message)
    return new Set()
  }
  return new Set((data ?? []).map((row: { listing_id: string }) => row.listing_id))
}

// user_id fills itself in from the logged-in user
export async function saveListing(listingId: string) {
  return supabase.from('saved_listings').insert({ listing_id: listingId })
}

export async function unsaveListing(listingId: string) {
  return supabase.from('saved_listings').delete().eq('listing_id', listingId)
}

// ---------- Alerts ("tell me when someone posts a ___") ----------

export async function fetchAlerts(): Promise<WishlistAlert[]> {
  const { data, error } = await supabase
    .from('wishlist_alerts')
    .select('id, keyword, created_at')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('Could not load alerts:', error.message)
    return []
  }
  return (data ?? []) as WishlistAlert[]
}

export async function addAlert(keyword: string) {
  return supabase.from('wishlist_alerts').insert({ keyword: keyword.trim().toLowerCase() }).select('id, keyword, created_at').single()
}

export async function removeAlert(id: string) {
  return supabase.from('wishlist_alerts').delete().eq('id', id)
}

// Does this listing match what I'm watching for? Checks the title, tag, and category.
export function matchesAlert(listing: Pick<Listing, 'title' | 'tag' | 'category'>, keyword: string) {
  const haystack = `${listing.title} ${listing.tag} ${listing.category ?? ''}`.toLowerCase()
  return haystack.includes(keyword.toLowerCase())
}

// Is time a later than time b? Compares real times, not text, so different
// timestamp formats (database vs. browser) can't trip it up. An empty b means "never".
export function isNewer(a: string, b: string) {
  if (!b) return true
  return Date.parse(a) > Date.parse(b)
}
