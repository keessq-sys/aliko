const house = (name: string) => `/Frontend%20UI%20Images/HOUSES/${name}`;
const construction = (name: string) => `/Frontend%20UI%20Images/CONSTRUCTION/${name}`;

const propertySeed = [
  ['emerald-lekki-duplex', 'Emerald Lekki Duplex', 'DUPLEX', 185000000, 'Lekki Phase 1', 'Lagos', 5, 6, 620, ['IMG-20260921-WA0199.jpg', 'IMG-20260921-WA0223.jpg', 'IMG-20260921-WA0057.jpg']],
  ['maitama-grand-villa', 'Maitama Grand Villa', 'RESIDENTIAL', 780000000, 'Maitama', 'FCT Abuja', 7, 8, 1150, ['IMG-20260921-WA0228.jpg', 'IMG-20260921-WA0107.jpg', 'IMG-20260921-WA0100.jpg']],
  ['ikoyi-waterfront-home', 'Ikoyi Waterfront Home', 'RESIDENTIAL', 520000000, 'Banana Island, Ikoyi', 'Lagos', 6, 7, 900, ['IMG-20260921-WA0190.jpg', 'IMG-20260921-WA0176.jpg', 'IMG-20260921-WA0063.jpg']],
  ['guzape-hills-duplex', 'Guzape Hills Duplex', 'DUPLEX', 295000000, 'Guzape', 'FCT Abuja', 5, 6, 510, ['IMG-20260921-WA0224.jpg', 'IMG-20260921-WA0086.jpg', 'IMG-20260921-WA0101.jpg']],
  ['victoria-island-penthouse', 'Victoria Island Sky Penthouse', 'PENTHOUSE', 465000000, 'Victoria Island', 'Lagos', 4, 5, 430, ['IMG-20260921-WA0094.jpg', 'IMG-20260921-WA0102.jpg', 'IMG-20260921-WA0058.jpg']],
  ['port-harcourt-executive-home', 'Port Harcourt Executive Home', 'RESIDENTIAL', 165000000, 'Old GRA, Port Harcourt', 'Rivers', 5, 6, 580, ['IMG-20260921-WA0104.jpg', 'IMG-20260921-WA0225.jpg', 'IMG-20260921-WA0060.jpg']],
  ['asokoro-court-residence', 'Asokoro Court Residence', 'APARTMENT', 210000000, 'Asokoro', 'FCT Abuja', 4, 5, 360, ['IMG-20260921-WA0059.jpg', 'IMG-20260921-WA0211.jpg', 'IMG-20260921-WA0175.jpg']],
  ['ikeja-smart-residence', 'Ikeja Smart Residence', 'DUPLEX', 140000000, 'Ikeja GRA', 'Lagos', 4, 5, 470, ['IMG-20260921-WA0223.jpg', 'IMG-20260921-WA0199.jpg', 'IMG-20260921-WA0100.jpg']]
] as const;

export const FALLBACK_PROPERTIES = propertySeed.map((p, i) => ({
  _id: `demo-property-${i + 1}`,
  slug: p[0], title: p[1], type: p[2], price: p[3], location: p[4], state: p[5],
  bedrooms: p[6], bathrooms: p[7], parkingSpots: 3, sizeSqm: p[8], yearBuilt: 2025,
  description: 'A verified Aliko Diamond Key showcase property with premium finishes, secure access, dependable utilities and professional transaction support.',
  amenities: ['24/7 Security', 'Reliable Power', 'Fitted Kitchen', 'Parking', 'Title Verification'],
  images: p[9].map(house), status: 'AVAILABLE', isFeatured: i < 6, isActive: true,
  createdAt: Date.now() - i * 86400000, updatedAt: Date.now()
}));

export const FALLBACK_AGENTS = [
  ['Adaeze Okonkwo', 'ADK Premium Estates', '+2347047669943', ['Luxury Homes', 'Investment Advisory'], ['Lagos', 'FCT Abuja']],
  ['Ibrahim Musa', 'Northern Keys Realty', '+2347047669943', ['Verified Land', 'New Developments'], ['FCT Abuja', 'Kano']],
  ['Amaka Nwosu', 'Diamond City Partners', '+2347047669943', ['Residential Sales', 'Diaspora Clients'], ['Enugu', 'Rivers']],
  ['Tunde Adebayo', 'Coastal Property Desk', '+2347047669943', ['Commercial Property', 'Property Management'], ['Lagos', 'Oyo']]
].map((a, i) => ({
  _id: `demo-agent-${i + 1}`, fullName: a[0], agencyName: a[1], phone: a[2],
  specializations: a[3], statesOfOperation: a[4], experience: `${8 + i * 2} years`, status: 'APPROVED'
}));

export const FALLBACK_PROJECTS = [
  { _id: 'demo-project-1', name: 'Diamond Key Gardens', slug: 'diamond-key-gardens', location: 'Guzape Extension', state: 'FCT Abuja', isActive: true, heroImageUrl: construction('IMG-20260921-WA0129.jpg') },
  { _id: 'demo-project-2', name: 'Lekki Heritage Estate', slug: 'lekki-heritage-estate', location: 'Ibeju-Lekki', state: 'Lagos', isActive: true, heroImageUrl: construction('IMG-20260921-WA0134.jpg') },
  { _id: 'demo-project-3', name: 'Garden City Residences', slug: 'garden-city-residences', location: 'Port Harcourt', state: 'Rivers', isActive: true, heroImageUrl: construction('IMG-20260921-WA0131.jpg') }
];

export const FALLBACK_PLOTS = Array.from({ length: 9 }, (_, i) => {
  const project = FALLBACK_PROJECTS[i % FALLBACK_PROJECTS.length];
  return {
    _id: `demo-plot-${i + 1}`, projectId: project._id, beaconNumber: `ADK-${String(i + 1).padStart(3, '0')}`,
    plotNumber: `${i + 1}`, sizeSqm: i % 3 === 0 ? 600 : i % 3 === 1 ? 450 : 900,
    price: 18000000 + i * 3500000, titleType: 'C_OF_O', titleVerified: true,
    status: 'AVAILABLE', isFeatured: i < 3, heroImageUrl: project.heroImageUrl, project
  };
});
