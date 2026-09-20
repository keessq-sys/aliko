import { writable, derived } from 'svelte/store';

export interface Location {
  address: string;
  lga: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  agency: string;
  rating: number;
}

export interface Property {
  id: string;
  title: string;
  type: 'residential' | 'commercial' | 'apartment' | 'land' | 'duplex' | 'penthouse';
  price: number;
  pricePerSqm?: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  sizeSqm: number;
  yearBuilt: number;
  location: Location;
  status: 'available' | 'reserved' | 'sold';
  isFeatured: boolean;
  isVerified: boolean;
  images: string[];
  amenities: string[];
  description: string;
  agent: Agent;
  tags: string[];
  createdAt: Date;
}

const A = (id: string, name: string, phone: string, email: string, agency = 'Aliko Diamond Key', rating = 4.8): Agent => ({
  id, name, phone, email,
  avatar: `https://i.pravatar.cc/150?u=${id}`,
  agency, rating
});

const AGENTS: Record<string, Agent> = {
  adaeze: A('agent-1', 'Adaeze Okonkwo', '+2348011111101', 'adaeze@adk.com', 'ADK Premium Estates', 4.9),
  michael: A('agent-2', 'Michael Okorie', '+2348011111102', 'michael@adk.com'),
  sarah: A('agent-3', 'Sarah Lawson', '+2348011111103', 'sarah@adk.com', 'ADK Coastal Division', 4.9),
  emeka: A('agent-4', 'Emeka Chukwu', '+2348011111104', 'emeka@adk.com', 'Chukwu Properties', 4.7),
  fatima: A('agent-5', 'Fatima Musa', '+2348011111105', 'fatima@adk.com', 'Musa Real Estate', 5.0),
  chidi: A('agent-6', 'Chidi Nwosu', '+2348011111106', 'chidi@adk.com')
};

export const properties = writable<Property[]>([
  {
    id: 'prop-001',
    title: 'Emerald Luxury Duplex',
    type: 'duplex',
    price: 150000000,
    bedrooms: 5,
    bathrooms: 6,
    parkingSpots: 3,
    sizeSqm: 600,
    yearBuilt: 2023,
    location: { address: '15 Diamond Avenue, Lekki Phase 1', lga: 'Eti-Osa', state: 'Lagos', lat: 6.4531, lng: 3.4655 },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p1a/800/600', 'https://picsum.photos/seed/adk-p1b/800/600', 'https://picsum.photos/seed/adk-p1c/800/600'],
    amenities: ['Pool', 'Gym', 'CCTV', 'Gateman', 'Solar', 'Smart Home'],
    description: 'A stunning 5-bedroom luxury duplex featuring modern architecture, premium finishes and breathtaking views in the heart of Lekki Phase 1 with state-of-the-art security and smart home features.',
    agent: AGENTS.michael,
    tags: ['Luxury', 'New Construction'],
    createdAt: new Date('2026-08-15')
  },
  {
    id: 'prop-002',
    title: 'Victoria Island Penthouse',
    type: 'penthouse',
    price: 450000000,
    bedrooms: 4,
    bathrooms: 4,
    parkingSpots: 2,
    sizeSqm: 400,
    yearBuilt: 2024,
    location: { address: 'Skyline Towers, Adeola Odeku, Victoria Island', lga: 'Eti-Osa', state: 'Lagos', lat: 6.4281, lng: 3.4219 },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p2a/800/600', 'https://picsum.photos/seed/adk-p2b/800/600'],
    amenities: ['Private Pool', 'Gym', 'Concierge', 'CCTV', 'Smart Home'],
    description: 'Exclusive penthouse offering panoramic views of the ocean and city skyline, finished with premium Italian marble, automated systems and a private infinity pool.',
    agent: AGENTS.sarah,
    tags: ['Penthouse', 'Ocean View'],
    createdAt: new Date('2026-07-10')
  },
  {
    id: 'prop-003',
    title: 'Maitama Executive Villa',
    type: 'residential',
    price: 850000000,
    bedrooms: 6,
    bathrooms: 7,
    parkingSpots: 6,
    sizeSqm: 1100,
    yearBuilt: 2022,
    location: { address: '8 Aso Drive, Maitama', lga: 'Maitama', state: 'FCT Abuja', lat: 9.0836, lng: 7.4938 },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p3a/800/600', 'https://picsum.photos/seed/adk-p3b/800/600'],
    amenities: ['Pool', 'Cinema', 'Gym', 'BQ', 'Generator', 'Smart Home'],
    description: 'A stately six-bedroom villa on Aso Drive with cinema room, guest BQ and landscaped grounds — the definitive Maitama address for diplomats and executives.',
    agent: AGENTS.adaeze,
    tags: ['Mansion', 'Diplomatic Zone'],
    createdAt: new Date('2026-09-01')
  },
  {
    id: 'prop-004',
    title: 'Wuse 2 Smart Apartment',
    type: 'apartment',
    price: 75000000,
    bedrooms: 3,
    bathrooms: 3,
    parkingSpots: 1,
    sizeSqm: 220,
    yearBuilt: 2024,
    location: { address: 'Aminu Kano Crescent, Wuse 2', lga: 'Municipal', state: 'FCT Abuja', lat: 9.0764, lng: 7.4712 },
    status: 'reserved',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p4a/800/600'],
    amenities: ['Gym', '24h Power', 'CCTV', 'Elevator'],
    description: 'Centrally positioned in Abuja\'s lifestyle epicentre with 24/7 backup power, full smart-home automation and high rental yields.',
    agent: AGENTS.emeka,
    tags: ['Smart Home', 'High Yield'],
    createdAt: new Date('2026-06-20')
  },
  {
    id: 'prop-005',
    title: 'Asokoro Sky Penthouse',
    type: 'penthouse',
    price: 550000000,
    bedrooms: 4,
    bathrooms: 5,
    parkingSpots: 3,
    sizeSqm: 520,
    yearBuilt: 2023,
    location: { address: 'Yakubu Gowon Crescent, Asokoro', lga: 'Municipal', state: 'FCT Abuja', lat: 9.0367, lng: 7.5326 },
    status: 'available',
    isFeatured: false,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p5a/800/600'],
    amenities: ['Private Lift', 'Terrace', 'CCTV', 'Concierge'],
    description: 'Double-height living spaces, private lift lobby and sweeping views over Asokoro\'s tree-lined avenues.',
    agent: AGENTS.adaeze,
    tags: ['Penthouse'],
    createdAt: new Date('2026-05-18')
  },
  {
    id: 'prop-006',
    title: 'Ikoyi Terraced Duplex',
    type: 'duplex',
    price: 320000000,
    bedrooms: 4,
    bathrooms: 5,
    parkingSpots: 2,
    sizeSqm: 380,
    yearBuilt: 2021,
    location: { address: 'Bourdillon Road, Ikoyi', lga: 'Eti-Osa', state: 'Lagos', lat: 6.4519, lng: 3.4362 },
    status: 'sold',
    isFeatured: false,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p6a/800/600'],
    amenities: ['Pool', 'Gym', 'Estate Security', 'BQ'],
    description: 'Elegant family terraced duplex on Bourdillon with estate pool, gym and round-the-clock security.',
    agent: AGENTS.sarah,
    tags: ['Family Home'],
    createdAt: new Date('2026-03-11')
  },
  {
    id: 'prop-007',
    title: 'Lekki Commercial Plaza',
    type: 'commercial',
    price: 680000000,
    bedrooms: 0,
    bathrooms: 8,
    parkingSpots: 30,
    sizeSqm: 1600,
    yearBuilt: 2020,
    location: { address: 'Admiralty Way, Lekki Phase 1', lga: 'Eti-Osa', state: 'Lagos', lat: 6.4459, lng: 3.4724 },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p7a/800/600'],
    amenities: ['Standby Generators', 'Central A/C', 'Parking Deck', 'CCTV'],
    description: 'Grade-A office and retail plaza on Admiralty Way with 30-car parking deck, fully fitted floors and strong tenant covenants.',
    agent: AGENTS.chidi,
    tags: ['Commercial', 'Investment'],
    createdAt: new Date('2026-04-02')
  },
  {
    id: 'prop-008',
    title: 'Katampe Extension Plot',
    type: 'land',
    price: 45000000,
    bedrooms: 0,
    bathrooms: 0,
    parkingSpots: 0,
    sizeSqm: 648,
    yearBuilt: 0,
    location: { address: 'Katampe Extension', lga: 'Municipal', state: 'FCT Abuja', lat: 9.1085, lng: 7.4391 },
    status: 'available',
    isFeatured: false,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p8a/800/600'],
    amenities: ['C of O', 'Fenced Estate', 'Tarred Roads'],
    description: 'Fully serviced 648sqm plot in a fenced Katampe Extension estate with C of O, tarred roads and drainage.',
    agent: AGENTS.fatima,
    tags: ['Land', 'C of O'],
    createdAt: new Date('2026-02-25')
  },
  {
    id: 'prop-009',
    title: 'Guzape Hillside Duplex',
    type: 'duplex',
    price: 260000000,
    bedrooms: 5,
    bathrooms: 5,
    parkingSpots: 3,
    sizeSqm: 450,
    yearBuilt: 2024,
    location: { address: 'Guzape District', lga: 'Municipal', state: 'FCT Abuja', lat: 9.0122, lng: 7.5128 },
    status: 'available',
    isFeatured: false,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p9a/800/600'],
    amenities: ['City Views', 'Solar', 'CCTV', 'BQ'],
    description: 'Contemporary hillside duplex with panoramic city views, solar hybrid power and premium finishes throughout.',
    agent: AGENTS.fatima,
    tags: ['New Build'],
    createdAt: new Date('2026-08-30')
  },
  {
    id: 'prop-010',
    title: 'Ikeja GRA Classic Bungalow',
    type: 'residential',
    price: 120000000,
    bedrooms: 4,
    bathrooms: 4,
    parkingSpots: 4,
    sizeSqm: 520,
    yearBuilt: 2018,
    location: { address: 'Opebi Road, Ikeja GRA', lga: 'Ikeja', state: 'Lagos', lat: 6.5833, lng: 3.3512 },
    status: 'available',
    isFeatured: false,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p10a/800/600'],
    amenities: ['Garden', 'Borehole', 'Generator', 'CCTV'],
    description: 'Timeless Ikeja GRA bungalow on a quarter-acre of manicured gardens — minutes from the airport and Alausa.',
    agent: AGENTS.emeka,
    tags: ['Classic'],
    createdAt: new Date('2026-01-15')
  },
  {
    id: 'prop-011',
    title: 'Epe Riverside Plots',
    type: 'land',
    price: 8500000,
    bedrooms: 0,
    bathrooms: 0,
    parkingSpots: 0,
    sizeSqm: 600,
    yearBuilt: 0,
    location: { address: 'Epe–Ijebu Ode Road, Epe', lga: 'Epe', state: 'Lagos', lat: 6.5856, lng: 3.9833 },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p11a/800/600'],
    amenities: ['Deed of Assignment', 'Layout Approval', 'Instalments'],
    description: 'High-growth riverside plots with instant deed of assignment and 12-month instalment plans — Epe corridor is Lagos\' fastest-appreciating frontier.',
    agent: AGENTS.chidi,
    tags: ['Land', 'Instalments', 'High Growth'],
    createdAt: new Date('2026-09-12')
  },
  {
    id: 'prop-012',
    title: 'Port Harcourt Towers Office',
    type: 'commercial',
    price: 210000000,
    bedrooms: 0,
    bathrooms: 6,
    parkingSpots: 14,
    sizeSqm: 740,
    yearBuilt: 2019,
    location: { address: 'Aba Road, Port Harcourt', lga: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
    status: 'reserved',
    isFeatured: false,
    isVerified: true,
    images: ['https://picsum.photos/seed/adk-p12a/800/600'],
    amenities: ['Backup Power', 'Fibre Ready', 'CCTV', 'Parking'],
    description: 'Fibre-ready corporate floors on Aba Road with dedicated backup power and secure parking in the heart of the Garden City.',
    agent: AGENTS.michael,
    tags: ['Commercial'],
    createdAt: new Date('2026-05-05')
  }
]);

export const featuredProperties = derived(properties, $p => $p.filter(prop => prop.isFeatured));

export function propertyById(id: string) {
  return derived(properties, $p => $p.find(prop => prop.id === id) || null);
}
