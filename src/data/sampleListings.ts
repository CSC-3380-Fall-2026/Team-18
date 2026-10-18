export type Listing = {
  id: number
  title: string
  price: number
  pickup: string
  tag: string
}

export const sampleListings: Listing[] = [
  { id: 1, title: 'LSU Joe Burrow Jersey #9', price: 50, pickup: 'The Quad', tag: 'Tailgate Ready' },
  { id: 2, title: 'CSC 3380 Textbook', price: 35, pickup: 'Middleton Library', tag: 'Back to School' },
  { id: 3, title: 'Mini Fridge', price: 40, pickup: 'East Campus Apts', tag: 'Move-Out Day' },
  { id: 4, title: 'Desk Lamp', price: 12, pickup: 'Pentagon Dorms', tag: 'Move-In Day' },
  { id: 5, title: 'TI-84 Calculator', price: 45, pickup: 'Patrick F. Taylor Hall', tag: 'Back to School' },
]

export const seasonalTags = ['Tailgate Ready', 'Back to School', 'Move-In Day', 'Move-Out Day']


export const tagAccents: Record<string, string> = {
  'Tailgate Ready': '#fdd023',
  'Back to School': '#2f6bff',
  'Move-In Day': '#00ad97',
  'Move-Out Day': '#7b3fe4',
}
