import { create } from 'zustand';
import type { LayoutObject, ObjectType, RoomSettings, Vec3 } from '../types/layout';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';

const DEFAULT_SIZES: Record<ObjectType, Vec3> = {
  table:     { x: 1.2, y: 0.75, z: 0.8 },
  shelf:     { x: 0.8, y: 1.8,  z: 0.3 },
  box:       { x: 0.5, y: 0.5,  z: 0.5 },
  partition: { x: 1.5, y: 1.8,  z: 0.05 },
  chair:     { x: 0.5, y: 0.85, z: 0.5 },
};

const DEFAULT_COLORS: Record<ObjectType, string> = {
  table:     '#8B7355',
  shelf:     '#A0522D',
  box:       '#D2691E',
  partition: '#B0C4DE',
  chair:     '#556B2F',
};

const OBJECT_LABELS: Record<ObjectType, string> = {
  table:     'テーブル',
  shelf:     '棚',
  box:       'ボックス',
  partition: 'パーティション',
  chair:     'チェア',
};

interface LayoutState {
  room: RoomSettings;
  objects: LayoutObject[];
  selectedId: string | null;
  isDragging: boolean;
  gridSnap: boolean;
  gridSize: number;

  setIsDragging: (v: boolean) => void;
  setRoom: (updates: Partial<RoomSettings>) => void;
  addObject: (type: ObjectType) => void;
  updateObject: (id: string, updates: Partial<LayoutObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setGridSnap: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  saveLayout: () => void;
  loadLayout: () => boolean;
  applyLayoutData: (room: RoomSettings, objects: LayoutObject[]) => void;
  getSelectedObject: () => LayoutObject | undefined;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  room: { width: 10, depth: 8, height: 3 },
  objects: [],
  selectedId: null,
  isDragging: false,
  gridSnap: true,
  gridSize: 0.5,

  setIsDragging: (v) => set({ isDragging: v }),
  setRoom: (updates) =>
    set((s) => ({ room: { ...s.room, ...updates } })),

  addObject: (type) => {
    const size = DEFAULT_SIZES[type];
    const newObj: LayoutObject = {
      id: crypto.randomUUID(),
      type,
      name: OBJECT_LABELS[type],
      position: { x: 0, y: size.y / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      size,
      color: DEFAULT_COLORS[type],
    };
    set((s) => ({ objects: [...s.objects, newObj], selectedId: newObj.id }));
  },

  updateObject: (id, updates) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  removeObject: (id) =>
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  selectObject: (id) => set({ selectedId: id }),

  setGridSnap: (enabled) => set({ gridSnap: enabled }),
  setGridSize: (size) => set({ gridSize: size }),

  saveLayout: () => {
    const { room, objects } = get();
    saveToLocalStorage({ version: '1.0', room, objects, savedAt: new Date().toISOString() });
  },

  loadLayout: () => {
    const data = loadFromLocalStorage();
    if (!data) return false;
    set({ room: data.room, objects: data.objects, selectedId: null });
    return true;
  },

  applyLayoutData: (room, objects) =>
    set({ room, objects, selectedId: null }),

  getSelectedObject: () => {
    const { objects, selectedId } = get();
    return objects.find((o) => o.id === selectedId);
  },
}));

export { OBJECT_LABELS };
