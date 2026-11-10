// Safe, well-known spots on and around LSU where students meet to trade.
// Used by the Sell form dropdown, the Explore filter, and the campus map.
export const campusZones = [
  'The Quad',
  'Middleton Library',
  'LSU Student Union',
  'Patrick F. Taylor Hall',
  'Pentagon Dorms',
  'East Campus Apartments',
  'West Campus Apartments',
  'Nicholson Gateway',
  'UREC',
  'Tiger Stadium',
  'Off Campus',
]

// Map pin for each spot as [latitude, longitude]. "Off Campus" has no pin.
// These are close estimates: open the Map tab and click anywhere to print the exact
// coordinates in the browser console (F12), then paste a better value here.
export const zoneCoords: Record<string, [number, number]> = {
  'The Quad': [30.4137, -91.1797],
  'Middleton Library': [30.413, -91.179],
  'LSU Student Union': [30.4116, -91.1774],
  'Patrick F. Taylor Hall': [30.4076, -91.1795],
  'Pentagon Dorms': [30.417, -91.181],
  'East Campus Apartments': [30.4095, -91.1722],
  'West Campus Apartments': [30.404, -91.188],
  'Nicholson Gateway': [30.4075, -91.187],
  UREC: [30.4065, -91.1737],
  'Tiger Stadium': [30.4122, -91.1839],
}

// Center of campus, where the map starts
export const campusCenter: [number, number] = [30.4115, -91.18]

// One line about each spot, shown when you zoom into it on the map
export const zoneInfo: Record<string, string> = {
  'The Quad': 'The heart of campus. Open, busy, and easy to find between classes.',
  'Middleton Library': 'Meet at the front steps. Students are around from morning to late night.',
  'LSU Student Union': 'Food, seating, and crowds all day. The easiest indoor meetup on campus.',
  'Patrick F. Taylor Hall': 'The engineering hub. Great for calculators, laptops, and textbooks.',
  'Pentagon Dorms': 'Residential spot for move-in and move-out trades.',
  'East Campus Apartments': 'Apartment-style housing. Good for furniture and dorm gear.',
  'West Campus Apartments': 'Apartment-style housing near the lakes side of campus.',
  'Nicholson Gateway': 'Shops and apartments right on the edge of campus.',
  UREC: 'The rec center. Meet in the lobby before or after a workout.',
  'Tiger Stadium': 'Death Valley. The go-to spot for game-day and tailgate gear.',
}

export const zonePhotos: Record<string, string> = {
  'The Quad': '/spots/quad.jpg',
  'Middleton Library': '/spots/middleton.jpg',
  'LSU Student Union': '/spots/union.jpg',
  'Patrick F. Taylor Hall': '/spots/pft.jpg',
  'Pentagon Dorms': '/spots/pentagon.jpg',
  'East Campus Apartments': '/spots/east-campus.jpg',
  'West Campus Apartments': '/spots/west-campus.jpg',
  'Nicholson Gateway': '/spots/nicholson.jpg',
  UREC: '/spots/urec.jpg',
  'Tiger Stadium': '/spots/tiger-stadium.jpg',
}
