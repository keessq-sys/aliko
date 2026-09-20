import { SERVICE_GALLERIES } from '$lib/data/imagery';

export interface ServiceCategoryMeta {
  key: 'INTERIOR' | 'SUPPLY' | 'SMART_HOME' | 'CONSTRUCTION' | 'ARCHITECTURE' | 'PROPERTY_SERVICES' | 'CONSULTING';
  label: string;
  color: string;
}

export const SERVICE_CATEGORY_META: Record<string, ServiceCategoryMeta> = {
  INTERIOR: { key: 'INTERIOR', label: 'Interior & Decoration', color: 'text-amber-400' },
  SUPPLY: { key: 'SUPPLY', label: 'Materials & Supply', color: 'text-cyan-400' },
  SMART_HOME: { key: 'SMART_HOME', label: 'Smart Home', color: 'text-purple-400' },
  CONSTRUCTION: { key: 'CONSTRUCTION', label: 'Construction & Renovation', color: 'text-emerald-400' },
  ARCHITECTURE: { key: 'ARCHITECTURE', label: 'Architecture & Space Planning', color: 'text-sky-400' },
  PROPERTY_SERVICES: { key: 'PROPERTY_SERVICES', label: 'Property, Development & Facility Management', color: 'text-yellow-400' },
  CONSULTING: { key: 'CONSULTING', label: 'Advisory & Project Management', color: 'text-rose-400' }
};

/** The thirteen service slugs baked into the platform architecture. */
export const SERVICE_SLUGS = [
  'interior-design',
  'decoration-styling',
  'furnishing',
  'renovation-refurbishment',
  'turkish-tiles-supply',
  'building-materials-supply',
  'smart-home-installation',
  'construction-services',
  'architectural-design',
  'space-planning',
  'property-development',
  'land-real-estate-brokerage',
  'general-contracts'
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export interface ServiceMeta {
  slug: string;
  name: string;
  tagline: string;
  category: keyof typeof SERVICE_CATEGORY_META;
  icon: string;
  requestType:
    | 'SUPPLY_CONTRACT'
    | 'PURCHASE'
    | 'SMART_HOME_INSTALL'
    | 'INTERIOR_DESIGN'
    | 'CONSTRUCTION_PROJECT'
    | 'GENERAL_CONTRACT'
    | 'ARCHITECTURAL_DESIGN'
    | 'SPACE_PLANNING'
    | 'PROPERTY_DEVELOPMENT'
    | 'BROKERAGE_DEAL';
  requestTypeLabel: string;
  image: string;
  gallery?: string[];
  startingPrice?: number;
  priceUnit?: string;
  features: string[];
}

export const SERVICES: ServiceMeta[] = [
  {
    slug: 'interior-design',
    name: 'Interior Design',
    tagline: 'Bespoke residential & commercial interior concepts',
    category: 'INTERIOR',
    icon: 'lamp',
    requestType: 'INTERIOR_DESIGN',
    requestTypeLabel: 'Interior Design Brief',
    image: 'https://picsum.photos/seed/adk-interior/900/600',
    gallery: SERVICE_GALLERIES['interior-design'],
    startingPrice: 1_500_000,
    priceUnit: 'per project',
    features: ['3D concept renderings', 'Space planning & mood boards', 'Premium finishes curation', 'Turnkey project supervision']
  },
  {
    slug: 'decoration-styling',
    name: 'Decoration & Styling',
    tagline: 'Events, show units & model home styling',
    category: 'INTERIOR',
    icon: 'sparkles',
    requestType: 'INTERIOR_DESIGN',
    requestTypeLabel: 'Decoration Request',
    image: 'https://picsum.photos/seed/adk-decor/900/600',
    gallery: SERVICE_GALLERIES['decoration-styling'],
    startingPrice: 350_000,
    priceUnit: 'per engagement',
    features: ['Model home staging', 'Seasonal & event decoration', 'Soft furnishing selection', 'Art & accessory curation']
  },
  {
    slug: 'furnishing',
    name: 'Furnishing',
    tagline: 'Complete furnishing packages for homes & offices',
    category: 'INTERIOR',
    icon: 'sofa',
    requestType: 'PURCHASE',
    requestTypeLabel: 'Furnishing Purchase',
    image: 'https://picsum.photos/seed/adk-furnish/900/600',
    gallery: SERVICE_GALLERIES['furnishing'],
    startingPrice: 2_000_000,
    priceUnit: 'per package',
    features: ['Imported & local furniture', 'Custom upholstery', 'Curtains, blinds & rugs', 'Appliance bundling options']
  },
  {
    slug: 'turkish-tiles-supply',
    name: 'Turkish & Foreign Tiles',
    tagline: 'Direct-import porcelain, ceramic & marble tiles',
    category: 'SUPPLY',
    icon: 'grid',
    requestType: 'SUPPLY_CONTRACT',
    requestTypeLabel: 'Tiles Supply Contract',
    image: 'https://picsum.photos/seed/adk-tiles/900/600',
    gallery: SERVICE_GALLERIES['turkish-tiles-supply'],
    startingPrice: 12_000,
    priceUnit: 'per sqm',
    features: ['Direct from Turkey & Spain', 'Porcelain, ceramic & marble', 'Bulk project pricing', 'Container tracking & logistics']
  },
  {
    slug: 'building-materials-supply',
    name: 'Building Materials Supply',
    tagline: 'Cement, roofing, iron rods & finishing materials',
    category: 'SUPPLY',
    icon: 'hard-hat',
    requestType: 'SUPPLY_CONTRACT',
    requestTypeLabel: 'Materials Supply Contract',
    image: 'https://picsum.photos/seed/adk-materials/900/600',
    gallery: SERVICE_GALLERIES['building-materials-supply'],
    startingPrice: 0,
    priceUnit: 'bulk quoted',
    features: ['Dangote & BUA cement', 'Iron rods & roofing sheets', 'POP, paint & finishing supplies', 'Site delivery nationwide']
  },
  {
    slug: 'smart-home-installation',
    name: 'Smart Home Installation',
    tagline: 'Automation, security & energy systems',
    category: 'SMART_HOME',
    icon: 'cpu',
    requestType: 'SMART_HOME_INSTALL',
    requestTypeLabel: 'Smart Home Installation',
    image: 'https://picsum.photos/seed/adk-smart/900/600',
    gallery: SERVICE_GALLERIES['smart-home-installation'],
    startingPrice: 3_500_000,
    priceUnit: 'per home',
    features: ['Lighting & blind automation', 'CCTV & smart access', 'Solar & inverter integration', 'Voice & app control setup']
  },
  {
    slug: 'construction-services',
    name: 'Construction',
    tagline: 'Houses, commercial & recreational centers',
    category: 'CONSTRUCTION',
    icon: 'building',
    requestType: 'CONSTRUCTION_PROJECT',
    requestTypeLabel: 'Construction Project Brief',
    image: 'https://picsum.photos/seed/adk-build/900/600',
    gallery: SERVICE_GALLERIES['construction-services'],
    startingPrice: 0,
    priceUnit: 'per BOQ',
    features: ['Residential & duplex builds', 'Commercial complexes', 'Recreational centers', 'Architectural & engineering teams']
  },
  {
    slug: 'general-contracts',
    name: 'General Contracts',
    tagline: 'Corporate, government & private contracts',
    category: 'CONSULTING',
    icon: 'file-signature',
    requestType: 'GENERAL_CONTRACT',
    requestTypeLabel: 'General Contract Proposal',
    image: 'https://picsum.photos/seed/adk-contract/900/600',
    gallery: SERVICE_GALLERIES['general-contracts'],
    startingPrice: 0,
    priceUnit: 'negotiated',
    features: ['Procurement & logistics', 'Facility management', 'Renovation & fit-out works', 'Project management services']
  },
  {
    slug: 'renovation-refurbishment',
    name: 'Renovation & Refurbishing',
    tagline: 'Full property renovation, upgrades & refurbishment',
    category: 'CONSTRUCTION',
    icon: 'hammer',
    requestType: 'CONSTRUCTION_PROJECT',
    requestTypeLabel: 'Renovation Brief',
    image: 'https://picsum.photos/seed/adk-reno/900/600',
    gallery: SERVICE_GALLERIES['renovation-refurbishment'],
    startingPrice: 2_500_000,
    priceUnit: 'per project',
    features: ['Full & partial home renovation', 'Kitchen & bathroom refurbishment', 'Structural upgrades & repairs', 'Before/after project documentation']
  },
  {
    slug: 'architectural-design',
    name: 'Architectural Design',
    tagline: 'Concept-to-construction architectural drawings',
    category: 'ARCHITECTURE',
    icon: 'drafting-compass',
    requestType: 'ARCHITECTURAL_DESIGN',
    requestTypeLabel: 'Architectural Design Brief',
    image: 'https://picsum.photos/seed/adk-arch/900/600',
    gallery: SERVICE_GALLERIES['architectural-design'],
    startingPrice: 1_200_000,
    priceUnit: 'per project',
    features: ['Concept & schematic design', 'Working & approval drawings', '3D visualization & walkthroughs', 'Regulatory & planning liaison']
  },
  {
    slug: 'space-planning',
    name: 'Space Planning & Management',
    tagline: 'Layout optimization for homes & office spaces',
    category: 'ARCHITECTURE',
    icon: 'layout-grid',
    requestType: 'SPACE_PLANNING',
    requestTypeLabel: 'Space Planning Brief',
    image: 'https://picsum.photos/seed/adk-space/900/600',
    gallery: SERVICE_GALLERIES['space-planning'],
    startingPrice: 600_000,
    priceUnit: 'per engagement',
    features: ['Residential & office space audits', 'Floor plan & workflow optimization', 'Space utilization reports', 'Ongoing facility space management']
  },
  {
    slug: 'property-development',
    name: 'Property Development & Facility Management',
    tagline: 'End-to-end development and facility oversight',
    category: 'PROPERTY_SERVICES',
    icon: 'building-2',
    requestType: 'PROPERTY_DEVELOPMENT',
    requestTypeLabel: 'Development Brief',
    image: 'https://picsum.photos/seed/adk-propdev/900/600',
    gallery: SERVICE_GALLERIES['property-development'],
    priceUnit: 'negotiated',
    features: ['Site feasibility & development planning', 'Developer & consultant partnerships', 'Facility & estate management', 'Maintenance & vendor coordination']
  },
  {
    slug: 'land-real-estate-brokerage',
    name: 'Land & Real Estate Brokerage',
    tagline: 'Acquire, sell and broker land, buildings & property deals',
    category: 'PROPERTY_SERVICES',
    icon: 'landmark',
    requestType: 'BROKERAGE_DEAL',
    requestTypeLabel: 'Brokerage Deal Brief',
    image: 'https://picsum.photos/seed/adk-brokerage/900/600',
    gallery: SERVICE_GALLERIES['land-real-estate-brokerage'],
    priceUnit: 'commission based',
    features: ['Land acquisition & disposal', 'Building & real estate sales', 'Landed property deal structuring', 'Title verification & due diligence']
  }
];

export function serviceBySlug(slug: string): ServiceMeta | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** Fallback service objects used when the Convex catalog has not been seeded. */
export function servicesWithFallback(catalog: any[] | undefined): ServiceMeta[] {
  if (catalog && catalog.length > 0) return catalog as ServiceMeta[];
  return SERVICES;
}

export const REQUEST_STATUS_META: Record<string, { label: string; classes: string }> = {
  NEW: { label: 'New', classes: 'bg-blue-500/15 text-blue-300 border border-blue-500/30' },
  REVIEWING: { label: 'Under Review', classes: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  QUOTED: { label: 'Quoted', classes: 'bg-purple-500/15 text-purple-300 border border-purple-500/30' },
  ACCEPTED: { label: 'Accepted', classes: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  REJECTED: { label: 'Declined', classes: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' },
  COMPLETED: { label: 'Completed', classes: 'bg-emerald-600/20 text-emerald-200 border border-emerald-400/30' },
  PENDING: { label: 'Pending', classes: 'bg-stone-500/15 text-stone-300 border border-stone-500/30' },
  UNDER_REVIEW: { label: 'Under Review', classes: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  APPROVED: { label: 'Approved', classes: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' }
};
