import type { AuthResponse } from '../types/api';

const AUTH_STORAGE_KEY = 'comet-social-auth';

export function saveAuth(data: AuthResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function loadAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
