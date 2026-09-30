import { env } from '$env/dynamic/public';

/** Demo catalogue data is opt-in and is always disabled in production by default. */
export const demoFallbacksEnabled = env.PUBLIC_ENABLE_DEMO_FALLBACKS === 'true';
