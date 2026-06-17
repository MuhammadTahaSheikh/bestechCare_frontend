export function sanitizeRedirect(path) {
  if (!path || typeof path !== 'string') return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

export function getLoginPath(redirectPath) {
  const redirect = sanitizeRedirect(redirectPath);
  if (!redirect) return '/login';
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

export function getRegisterPath(redirectPath) {
  const redirect = sanitizeRedirect(redirectPath);
  if (!redirect) return '/register';
  return `/register?redirect=${encodeURIComponent(redirect)}`;
}

export function getRedirectFromSearch(searchParams) {
  return sanitizeRedirect(searchParams.get('redirect')) || '/';
}
