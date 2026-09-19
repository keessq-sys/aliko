import { writable, derived } from 'svelte/store';

export type UserRole = 'client' | 'agent' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  verified?: boolean;
}

export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, $u => !!$u);
export const userRole = derived(user, $u => $u?.role ?? null);
export const isClient = derived(user, $u => $u?.role === 'client');
export const isAgent = derived(user, $u => $u?.role === 'agent');
export const isManager = derived(user, $u => $u?.role === 'manager');
export const isAdmin = derived(user, $u => $u?.role === 'admin');

export function login(userData: User) { user.set(userData); }
export function logout() { user.set(null); }
