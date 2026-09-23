import { json } from '@sveltejs/kit';

export const GET = () => json({ status: 'ok', service: 'aliko-diamond-key', timestamp: new Date().toISOString() });
