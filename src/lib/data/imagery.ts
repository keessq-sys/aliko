/**
 * Centralized imagery config.
 *
 * Every image URL the app renders (hero, service galleries, signature
 * developments) is defined here as a single swappable layer. Service imagery
 * uses Aliko Diamond Key's supplied project photography, supplemented only
 * where necessary by locally hosted, licensed stock photography.
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
  { name: 'Maitama Hills Estate', location: 'Maitama, Abuja', image: '/Frontend%20UI%20Images/HOUSES/IMG-20260921-WA0228.jpg' },
  { name: 'Lekki Waterfront Towers', location: 'Lekki, Lagos', image: '/images/locations/lagos/victoria-island-aerial.jpg' },
  { name: 'Diamond Key Gardens', location: 'Guzape, Abuja', image: '/Frontend%20UI%20Images/CONSTRUCTION/IMG-20260921-WA0129.jpg' },
  { name: 'Asokoro Court Residences', location: 'Asokoro, Abuja', image: '/Frontend%20UI%20Images/HOUSES/IMG-20260921-WA0190.jpg' },
  { name: 'Port Harcourt Marina City', location: 'GRA, Port Harcourt', image: '/images/locations/port-harcourt/tower.jpg' },
  { name: 'Mapo Heritage Quarter', location: 'Ibadan, Oyo', image: '/images/locations/ibadan/mapo-hall.jpg' },
  { name: 'Coal City Residences', location: 'Enugu, Enugu', image: '/images/locations/enugu/panorama.jpg' },
  { name: 'Kano Commerce District', location: 'Kano, Kano', image: '/images/locations/kano/aerial.jpg' }
];

export const EXPLORE_LOCATIONS = [
  { city: 'Lagos', state: 'Lagos State', listings: 412, images: ['/images/locations/lagos/skyline.jpg','/images/locations/lagos/ikoyi.jpg','/images/locations/lagos/victoria-island-aerial.jpg'] },
  { city: 'Abuja', state: 'FCT', listings: 356, images: ['/images/locations/abuja/national-mosque.jpg','/images/locations/abuja/aerial.jpg','/images/locations/abuja/satellite.jpg'] },
  { city: 'Port Harcourt', state: 'Rivers State', listings: 128, images: ['/images/locations/port-harcourt/tower.jpg','/images/locations/port-harcourt/nddc.jpg','/images/locations/port-harcourt/aerial.jpg'] },
  { city: 'Enugu', state: 'Enugu State', listings: 94, images: ['/images/locations/enugu/city.jpg','/images/locations/enugu/unity-park.jpg','/images/locations/enugu/panorama.jpg'] },
  { city: 'Ibadan', state: 'Oyo State', listings: 87, images: ['/images/locations/ibadan/mapo-hall.jpg','/images/locations/ibadan/bowen-tower.jpg','/images/locations/ibadan/aerial.jpg'] },
  { city: 'Kano', state: 'Kano State', listings: 61, images: ['/images/locations/kano/aerial.jpg','/images/locations/kano/historic-aerial.png','/images/locations/kano/satellite.jpg'] }
];

export const VISION_BANNER_IMAGE = picsum('adk-vision-banner', 1920, 1280);

function projectImages(category: 'CONSTRUCTION' | 'HOUSES' | 'SUPPLY TILES', files: string[]): string[] {
  const folder = encodeURIComponent(category);
  return files.map((file) => `/Frontend%20UI%20Images/${folder}/${file}`);
}

function stockImage(file: string): string {
  return `/images/services/stock/${file}`;
}

const construction = (files: string[]) => projectImages('CONSTRUCTION', files);
const houses = (files: string[]) => projectImages('HOUSES', files);
const tiles = (files: string[]) => projectImages('SUPPLY TILES', files);

/** Curated service galleries, keyed by service slug. */
export const SERVICE_GALLERIES: Record<string, string[]> = {
  'interior-design': houses([
    'IMG-20260921-WA0057.jpg', 'IMG-20260921-WA0058.jpg', 'IMG-20260921-WA0060.jpg',
    'IMG-20260921-WA0063.jpg', 'IMG-20260921-WA0100.jpg', 'IMG-20260921-WA0101.jpg',
    'IMG-20260921-WA0175.jpg'
  ]).concat(construction(['IMG-20260921-WA0229.jpg']), tiles(['IMG-20260921-WA0087.jpg', 'IMG-20260921-WA0090.jpg'])),

  'decoration-styling': houses([
    'IMG-20260921-WA0063.jpg', 'IMG-20260921-WA0100.jpg', 'IMG-20260921-WA0101.jpg',
    'IMG-20260921-WA0057.jpg', 'IMG-20260921-WA0058.jpg', 'IMG-20260921-WA0060.jpg'
  ]).concat(tiles(['IMG-20260921-WA0026.jpg', 'IMG-20260921-WA0090.jpg', 'IMG-20260921-WA0230.jpg'])),

  furnishing: houses([
    'IMG-20260921-WA0058.jpg', 'IMG-20260921-WA0101.jpg', 'IMG-20260921-WA0057.jpg',
    'IMG-20260921-WA0060.jpg', 'IMG-20260921-WA0063.jpg', 'IMG-20260921-WA0100.jpg'
  ]).concat(tiles(['IMG-20260921-WA0047.jpg', 'IMG-20260921-WA0087.jpg'])),

  'renovation-refurbishment': construction([
    'IMG-20260921-WA0226.jpg', 'IMG-20260921-WA0220.jpg', 'IMG-20260921-WA0229.jpg'
  ]).concat(
    houses(['IMG-20260921-WA0059.jpg', 'IMG-20260921-WA0211.jpg']),
    tiles(['IMG-20260921-WA0215.jpg', 'IMG-20260921-WA0221.jpg', 'IMG-20260921-WA0055.jpg'])
  ),

  'turkish-tiles-supply': tiles([
    'IMG-20260921-WA0066.jpg', 'IMG-20260921-WA0202.jpg', 'IMG-20260921-WA0203.jpg',
    'IMG-20260921-WA0212.jpg', 'IMG-20260921-WA0231.jpg', 'IMG-20260921-WA0087.jpg',
    'IMG-20260921-WA0090.jpg', 'IMG-20260921-WA0230.jpg', 'IMG-20260921-WA0026.jpg',
    'IMG-20260921-WA0037.jpg', 'IMG-20260921-WA0055.jpg', 'IMG-20260921-WA0215.jpg',
    'IMG-20260921-WA0221.jpg', 'IMG-20260921-WA0050.jpg', 'IMG-20260921-WA0080.jpg',
    'IMG-20260921-WA0082.jpg', 'IMG-20260921-WA0047.jpg'
  ]),

  'building-materials-supply': tiles([
    'IMG-20260921-WA0080.jpg', 'IMG-20260921-WA0082.jpg', 'IMG-20260921-WA0050.jpg',
    'IMG-20260921-WA0047.jpg', 'IMG-20260921-WA0215.jpg', 'IMG-20260921-WA0221.jpg'
  ]).concat(construction(['IMG-20260921-WA0130.jpg', 'IMG-20260921-WA0131.jpg', 'IMG-20260921-WA0132.jpg'])),

  'smart-home-installation': [
    stockImage('smart-lock-phone.jpg'), stockImage('smart-home-devices.jpg'), stockImage('smart-thermostat.jpg'),
    ...houses(['IMG-20260921-WA0100.jpg', 'IMG-20260921-WA0225.jpg', 'IMG-20260921-WA0057.jpg'])
  ],

  'construction-services': construction([
    'IMG-20260921-WA0129.jpg', 'IMG-20260921-WA0134.jpg', 'IMG-20260921-WA0131.jpg',
    'IMG-20260921-WA0132.jpg', 'IMG-20260921-WA0130.jpg', 'IMG-20260921-WA0220.jpg',
    'IMG-20260921-WA0039.jpg', 'IMG-20260921-WA0040.jpg', 'IMG-20260921-WA0226.jpg',
    'IMG-20260921-WA0229.jpg'
  ]).concat(houses(['IMG-20260921-WA0199.jpg', 'IMG-20260921-WA0223.jpg', 'IMG-20260921-WA0228.jpg'])),

  'architectural-design': [
    stockImage('architectural-blueprints.jpg'), stockImage('architectural-model.jpg'), stockImage('blueprint-review.jpg'),
    ...houses(['IMG-20260921-WA0107.jpg', 'IMG-20260921-WA0199.jpg', 'IMG-20260921-WA0225.jpg', 'IMG-20260921-WA0228.jpg'])
  ],

  'space-planning': [
    stockImage('modern-office.jpg'), stockImage('office-workstations.jpg'), stockImage('open-office.jpg'),
    stockImage('architectural-blueprints.jpg'),
    ...houses(['IMG-20260921-WA0058.jpg', 'IMG-20260921-WA0060.jpg', 'IMG-20260921-WA0101.jpg'])
  ],

  'property-development': construction([
    'IMG-20260921-WA0129.jpg', 'IMG-20260921-WA0134.jpg', 'IMG-20260921-WA0131.jpg',
    'IMG-20260921-WA0220.jpg', 'IMG-20260921-WA0039.jpg', 'IMG-20260921-WA0040.jpg'
  ]).concat(houses([
    'IMG-20260921-WA0199.jpg', 'IMG-20260921-WA0223.jpg', 'IMG-20260921-WA0228.jpg',
    'IMG-20260921-WA0190.jpg', 'IMG-20260921-WA0224.jpg', 'IMG-20260921-WA0086.jpg',
    'IMG-20260921-WA0094.jpg', 'IMG-20260921-WA0102.jpg', 'IMG-20260921-WA0104.jpg'
  ])),

  'land-real-estate-brokerage': [
    stockImage('real-estate-key.jpg'),
    ...houses([
      'IMG-20260921-WA0199.jpg', 'IMG-20260921-WA0223.jpg', 'IMG-20260921-WA0228.jpg',
      'IMG-20260921-WA0176.jpg', 'IMG-20260921-WA0107.jpg', 'IMG-20260921-WA0225.jpg',
      'IMG-20260921-WA0190.jpg'
    ])
  ],

  'general-contracts': [
    stockImage('site-planning-team.jpg'), stockImage('blueprint-review.jpg'), stockImage('architectural-blueprints.jpg'),
    ...construction([
      'IMG-20260921-WA0129.jpg', 'IMG-20260921-WA0134.jpg', 'IMG-20260921-WA0130.jpg',
      'IMG-20260921-WA0131.jpg', 'IMG-20260921-WA0226.jpg'
    ])
  ]
};
