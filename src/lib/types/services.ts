export interface ServiceCategoryMeta {
  key: 'INTERIOR' | 'SUPPLY' | 'SMART_HOME' | 'CONSTRUCTION' | 'CONSULTING';
  label: string;
  color: string;
}

export const SERVICE_CATEGORY_META: Record<string, ServiceCategoryMeta> = {
  INTERIOR: { key: 'INTERIOR', label: 'Interior & Decoration', color: 'text-amber-400' },
  SUPPLY: { key: 'SUPPLY', label: 'Materials & Supply', color: 'text-cyan-400' },
  SMART_HOME: { key: 'SMART_HOME', label: 'Smart Home', color: 'text-purple-400' },
  CONSTRUCTION: { key: 'CONSTRUCTION', label: 'Construction & Contracts', color: 'text-emerald-400' },
  CONSULTING: { key: 'CONSULTING', label: 'Advisory & Project Management', color: 'text-rose-400' }
};

/** The eight service slugs baked into the platform architecture. */
export const SERVICE_SLUGS = [
  'interior-design',
  'decoration-styling',
  'furnishing',
  'turkish-tiles-supply',
  'building-materials-supply',
  'smart-home-installation',
  'construction-services',
  'general-contracts'
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export interface ServiceMeta {
  slug: string;
  name: string;
  tagline: string;
  category: keyof typeof SERVICE_CATEGORY_META;
  icon: string;
  requestType: 'SUPPLY_CONTRACT' | 'PURCHASE' | 'SMART_HOME_INSTALL' | 'INTERIOR_DESIGN' | 'CONSTRUCTION_PROJECT' | 'GENERAL_CONTRACT';
  requestTypeLabel: string;
  image: string;
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
    startingPrice: 0,
    priceUnit: 'negotiated',
    features: ['Procurement & logistics', 'Facility management', 'Renovation & fit-out works', 'Project management services']
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
