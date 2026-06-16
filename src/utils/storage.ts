import type { LayoutData } from '../types/layout';

const STORAGE_KEY = '3d-layout-planner';

export const saveToLocalStorage = (data: LayoutData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadFromLocalStorage = (): LayoutData | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LayoutData;
  } catch {
    return null;
  }
};

export const hasSavedLayout = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};
