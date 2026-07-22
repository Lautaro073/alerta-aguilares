import { PAGE_SIZE_OPTIONS } from '../constants/admin.constants';
import type { AdminPageSize } from '../types/admin.types';
import type { AdminView, PageSizeStorageKey } from '../types/adminDashboard.types';

export function getStoredPageSize(key: PageSizeStorageKey, fallback: AdminPageSize) {
  if (typeof window === 'undefined') return fallback;
  const stored = Number(window.localStorage.getItem(key));
  return PAGE_SIZE_OPTIONS.includes(stored as AdminPageSize) ? (stored as AdminPageSize) : fallback;
}

export function setStoredPageSize(key: PageSizeStorageKey, pageSize: AdminPageSize) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, String(pageSize));
}

export function getStoredSidebarCollapsed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('admin.sidebarCollapsed') === 'true';
}

export function setStoredSidebarCollapsed(collapsed: boolean) {
  if (typeof window !== 'undefined') window.localStorage.setItem('admin.sidebarCollapsed', String(collapsed));
}

export function getHashView(validViews: readonly AdminView[]): AdminView {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '');
  return validViews.includes(hash as AdminView) ? (hash as AdminView) : 'home';
}
