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

const mockProperties: Property[] = [
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
    location: {
      address: '15 Diamond Avenue, Lekki Phase 1',
      lga: 'Eti-Osa',
      state: 'Lagos',
      lat: 6.4531,
      lng: 3.4655
    },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/property1/800/600', 'https://picsum.photos/seed/property1a/800/600'],
    amenities: ['Pool', 'Gym', 'CCTV', 'Gateman', 'Solar'],
    description: 'A stunning 5-bedroom luxury duplex featuring modern architecture, premium finishes, and breathtaking views. Perfectly situated in the heart of Lekki Phase 1 with state-of-the-art security and smart home features.',
    agent: {
      id: 'agent-1',
      name: 'Michael Okorie',
      phone: '+2348012345678',
      email: 'michael@adk.com',
      avatar: 'https://i.pravatar.cc/150?u=agent-1',
      agency: 'Aliko Diamond Key',
      rating: 4.8
    },
    tags: ['Luxury', 'New Construction'],
    createdAt: new Date('2023-08-15')
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
    location: {
      address: 'Skyline Towers, VI',
      lga: 'Eti-Osa',
      state: 'Lagos',
      lat: 6.4281,
      lng: 3.4219
    },
    status: 'available',
    isFeatured: true,
    isVerified: true,
    images: ['https://picsum.photos/seed/property3/800/600', 'https://picsum.photos/seed/property3a/800/600'],
    amenities: ['Private Pool', 'Gym', 'Helipad', 'CCTV', 'Concierge'],
    description: 'Exclusive penthouse offering panoramic views of the ocean and the city skyline. Designed with premium Italian marble, automated systems, and a private infinity pool.',
    agent: {
      id: 'agent-2',
      name: 'Sarah Lawson',
      phone: '+2348023456789',
      email: 'sarah@adk.com',
      avatar: 'https://i.pravatar.cc/150?u=agent-2',
      agency: 'Aliko Diamond Key',
      rating: 4.9
    },
    tags: ['Penthouse', 'Ocean View'],
    createdAt: new Date('2024-01-10')
  }
];

export const properties = writable<Property[]>(mockProperties);
export const featuredProperties = derived(properties, $p => $p.filter(prop => prop.isFeatured));

export function propertyById(id: string) {
  return derived(properties, $p => $p.find(prop => prop.id === id) || null);
}
