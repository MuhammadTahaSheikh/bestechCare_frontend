// Production: set VITE_API_URL in Vercel (e.g. https://instacare-api.bestechvision.com)
// Development: leave unset — Vite proxies /api and /socket.io to localhost
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
