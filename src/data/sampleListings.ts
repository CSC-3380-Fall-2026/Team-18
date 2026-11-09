// Fake listings for building the UI before real Supabase data is wired up.
// The shape matches the columns in the Supabase `listings` table, plus seller info
// that will come from the `profiles` table later.

export type Seller = {
  name: string
  initials: string
  rating: number
  trades: number
  verified: boolean
}

export type Listing = {
  id: number | string
  title: string
  price: number
  pickup: string
  tag: string
  icon: string
  photo?: string | null
  condition: string
  seller: Seller
}

export const sampleListings: Listing[] = [
  {
    id: 1,
    title: 'LSU Joe Burrow Jersey #9',
    price: 50,
    pickup: 'The Quad',
    tag: 'Tailgate Ready',
    icon: '🏈',
    condition: 'New',
    seller: { name: 'Jordan M.', initials: 'JM', rating: 4.9, trades: 12, verified: true },
  },
  {
    id: 2,
    title: 'CSC 3380 Textbook',
    price: 35,
    pickup: 'Middleton Library',
    tag: 'Back to School',
    icon: '📚',
    condition: 'Like new',
    seller: { name: 'Aaliyah R.', initials: 'AR', rating: 4.7, trades: 5, verified: true },
  },
  {
    id: 3,
    title: 'Mini Fridge',
    price: 40,
    pickup: 'East Campus Apts',
    tag: 'Move-Out Day',
    icon: '🧊',
    condition: 'Good',
    seller: { name: 'Marcus T.', initials: 'MT', rating: 4.5, trades: 8, verified: true },
  },
  {
    id: 4,
    title: 'Desk Lamp',
    price: 12,
    pickup: 'Pentagon Dorms',
    tag: 'Move-In Day',
    icon: '💡',
    condition: 'Good',
    seller: { name: 'Sofia L.', initials: 'SL', rating: 4.8, trades: 3, verified: false },
  },
  {
    id: 5,
    title: 'TI-84 Calculator',
    price: 45,
    pickup: 'Patrick F. Taylor Hall',
    tag: 'Back to School',
    icon: '🧮',
    condition: 'Like new',
    seller: { name: 'Devin K.', initials: 'DK', rating: 5.0, trades: 20, verified: true },
  },
]

export const seasonalTags = ['Tailgate Ready', 'Back to School', 'Move-In Day', 'Move-Out Day']

// Each season gets its own ambient color, like a console theme shifting per game
export const tagAccents: Record<string, string> = {
  'Tailgate Ready': '#fdd023',
  'Back to School': '#2f6bff',
  'Move-In Day': '#00ad97',
  'Move-Out Day': '#7b3fe4',
}
