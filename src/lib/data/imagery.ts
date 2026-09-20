/**
 * Centralized imagery config.
 *
 * Every image URL the app renders (hero, service galleries, signature
 * developments) is defined here as a single swappable layer. Today these
 * point at themed Lorem Picsum seeds (stable, license-free, no attribution
 * required) so every section renders with real photography instead of gray
 * boxes. When real property/interior photography is supplied, replace the
 * arrays below with Convex storage URLs or your CDN links — nothing else
 * in the app needs to change, since every component reads through here.
 */

function picsum(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export const HERO_IMAGES = {
  home: picsum('adk-hero-skyline', 1920, 1080),
  homeMobile: picsum('adk-hero-skyline', 900, 1200),
  // Drop a real property walkthrough clip here (mp4/webm, <15s, muted, looping)
  // and set `heroVideoUrl` in HeroSection.svelte to switch the hero to video.
  posterForFutureVideo: picsum('adk-hero-skyline', 1920, 1080)
};

export const SIGNATURE_DEVELOPMENTS = [
  { name: 'Maitama Hills Estate', location: 'Maitama, Abuja', image: picsum('adk-dev-maitama', 1200, 1500) },
  { name: 'Lekki Waterfront Towers', location: 'Lekki, Lagos', image: picsum('adk-dev-lekki', 1200, 900) },
  { name: 'Diamond Key Gardens', location: 'Guzape, Abuja', image: picsum('adk-dev-guzape', 1200, 900) },
  { name: 'Asokoro Court Residences', location: 'Asokoro, Abuja', image: picsum('adk-dev-asokoro', 1200, 1500) },
  { name: 'Port Harcourt Marina City', location: 'GRA, Port Harcourt', image: picsum('adk-dev-ph', 1200, 900) }
];

/** 4-6 gallery images per service, keyed by slug. */
export const SERVICE_GALLERIES: Record<string, string[]> = {
  'interior-design': [picsum('adk-gal-interior-1', 900, 650), picsum('adk-gal-interior-2', 900, 650), picsum('adk-gal-interior-3', 900, 650), picsum('adk-gal-interior-4', 900, 650)],
  'decoration-styling': [picsum('adk-gal-decor-1', 900, 650), picsum('adk-gal-decor-2', 900, 650), picsum('adk-gal-decor-3', 900, 650), picsum('adk-gal-decor-4', 900, 650)],
  'furnishing': [picsum('adk-gal-furnish-1', 900, 650), picsum('adk-gal-furnish-2', 900, 650), picsum('adk-gal-furnish-3', 900, 650), picsum('adk-gal-furnish-4', 900, 650)],
  'renovation-refurbishment': [picsum('adk-gal-reno-1', 900, 650), picsum('adk-gal-reno-2', 900, 650), picsum('adk-gal-reno-3', 900, 650), picsum('adk-gal-reno-4', 900, 650)],
  'turkish-tiles-supply': [picsum('adk-gal-tiles-1', 900, 650), picsum('adk-gal-tiles-2', 900, 650), picsum('adk-gal-tiles-3', 900, 650), picsum('adk-gal-tiles-4', 900, 650)],
  'building-materials-supply': [picsum('adk-gal-materials-1', 900, 650), picsum('adk-gal-materials-2', 900, 650), picsum('adk-gal-materials-3', 900, 650), picsum('adk-gal-materials-4', 900, 650)],
  'smart-home-installation': [picsum('adk-gal-smart-1', 900, 650), picsum('adk-gal-smart-2', 900, 650), picsum('adk-gal-smart-3', 900, 650), picsum('adk-gal-smart-4', 900, 650)],
  'construction-services': [picsum('adk-gal-construction-1', 900, 650), picsum('adk-gal-construction-2', 900, 650), picsum('adk-gal-construction-3', 900, 650), picsum('adk-gal-construction-4', 900, 650)],
  'architectural-design': [picsum('adk-gal-arch-1', 900, 650), picsum('adk-gal-arch-2', 900, 650), picsum('adk-gal-arch-3', 900, 650), picsum('adk-gal-arch-4', 900, 650)],
  'space-planning': [picsum('adk-gal-space-1', 900, 650), picsum('adk-gal-space-2', 900, 650), picsum('adk-gal-space-3', 900, 650), picsum('adk-gal-space-4', 900, 650)],
  'property-development': [picsum('adk-gal-propdev-1', 900, 650), picsum('adk-gal-propdev-2', 900, 650), picsum('adk-gal-propdev-3', 900, 650), picsum('adk-gal-propdev-4', 900, 650)],
  'land-real-estate-brokerage': [picsum('adk-gal-brokerage-1', 900, 650), picsum('adk-gal-brokerage-2', 900, 650), picsum('adk-gal-brokerage-3', 900, 650), picsum('adk-gal-brokerage-4', 900, 650)],
  'general-contracts': [picsum('adk-gal-contracts-1', 900, 650), picsum('adk-gal-contracts-2', 900, 650), picsum('adk-gal-contracts-3', 900, 650), picsum('adk-gal-contracts-4', 900, 650)]
};
