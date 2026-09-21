/**
 * Adapts a real `properties` row from Convex (convex/properties.ts ::
 * listProperties/getProperty) into the legacy `Property` shape defined in
 * $lib/stores/properties.ts, which the properties listing/detail pages and
 * PropertyCard/PropertyListItem/PropertyMapView were all originally built
 * against (that store was a 12-item hardcoded mock array — see
 * src/lib/stores/properties.ts). Adapting at the boundary means the real
 * catalog can replace the mock data source without rewriting every
 * presentational component's field access.
 */
import type { Property, Agent } from '$lib/stores/properties';
import { SITE_URL } from '$lib/data/organization';

const FALLBACK_AGENT: Agent = {
  id: 'adk-house',
  name: 'Aliko Diamond Key',
  phone: '+2347047669943',
  email: 'contact@adk.com',
  avatar: `${SITE_URL}/logo.png`,
  agency: 'Aliko Diamond Key Realtors Ltd',
  rating: 5
};

export function toDisplayProperty(row: any): Property {
  return {
    id: row.slug ?? row._id,
    title: row.title,
    type: (row.type ?? 'RESIDENTIAL').toLowerCase() as Property['type'],
    price: row.price,
    pricePerSqm: row.sizeSqm ? Math.round(row.price / row.sizeSqm) : undefined,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    parkingSpots: row.parkingSpots ?? 0,
    sizeSqm: row.sizeSqm ?? 0,
    yearBuilt: row.yearBuilt ?? 0,
    location: {
      address: row.location,
      lga: '',
      state: row.state,
      lat: row.latitude ?? 0,
      lng: row.longitude ?? 0
    },
    status: (row.status ?? 'AVAILABLE').toLowerCase() as Property['status'],
    isFeatured: Boolean(row.isFeatured),
    // Every property returned by listProperties/getProperty has already
    // passed admin review (isActive gate) — there is no separate
    // per-listing "verified" flag in the real schema, so a published
    // listing is treated as verified.
    isVerified: true,
    images: row.images?.length ? row.images : [`${SITE_URL}/og/default.png`],
    amenities: row.amenities ?? [],
    description: row.description,
    agent: row.agent
      ? {
          id: row.agent._id,
          name: row.agent.name ?? FALLBACK_AGENT.name,
          phone: row.agent.phone ?? FALLBACK_AGENT.phone,
          email: row.agent.email ?? FALLBACK_AGENT.email,
          avatar: FALLBACK_AGENT.avatar,
          agency: FALLBACK_AGENT.agency,
          rating: 5
        }
      : FALLBACK_AGENT,
    tags: [],
    createdAt: new Date(row.createdAt ?? Date.now())
  };
}
