const DEV_DEFAULT_API_BASE_URL = 'http://127.0.0.1:8001';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = configuredApiBaseUrl
    ? configuredApiBaseUrl.replace(/\/$/, '')
    : (import.meta.env.DEV ? DEV_DEFAULT_API_BASE_URL : '');

export function withApiBaseUrl(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiBaseUrl}${normalizedPath}`;
}
