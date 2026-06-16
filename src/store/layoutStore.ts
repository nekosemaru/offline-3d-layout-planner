import { create } from 'zustand';
import type { LayoutObject, ObjectType, RoomSettings, Vec3 } from '../types/layout';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';

const DEFAULT_SIZES: Record<ObjectType, Vec3> = {
  table:     { x: 1.2, y: 0.75, z: 0.8 },
  shelf:     { x: 0.8, y: 1.8,  z: 0.3 },
  box:       { x: 0.5, y: 0.5,  z: 0.5 },
  partition: { x: 1.5, y: 1.8,  z: 0.05 },
  chair:     { x: 0.5, y: 0.85, z: 0.5 },
  sofa:      { x: 2.0, y: 0.85, z: 0.9 },
  desk:      { x: 1.2, y: 0.72, z: 0.6 },
  bed:       { x: 1.6, y: 0.45, z: 2.0 },
  cabinet:   { x: 0.8, y: 1.2,  z: 0.4 },
  plant:     { x: 0.4, y: 1.2,  z: 0.4 },
};

const DEFAULT_COLORS: Record<ObjectType, string> = {
  table:     '#8B7355',
  shelf:     '#A0522D',
  box:       '#D2691E',
  partition: '#B0C4DE',
  chair:     '#556B2F',
  sofa:      '#7B6B8D',
  desk:      '#7A6A5A',
  bed:       '#8B7B6B',
  cabinet:   '#6B5A4A',
  plant:     '#3A7A3A',
};

const OBJECT_LABELS: Record<ObjectType, string> = {
  table:     'テーブル',
  shelf:     '棚',
  box:       'ボックス',
  partition: 'パーティション',
  chair:     'チェア',
  sofa:      'ソファ',
  desk:      'デスク',
  bed:       'ベッド',
  cabinet:   'キャビネット',
  plant:     '観葉植物',
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
  addObjectAt: (obj: LayoutObject) => void;
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
  room: {
    width: 10, depth: 8, height: 3,
    wallColor: '#5a6a8a', floorColor: '#242430',
    ceilingColor: '#2a2a3e', wallOpacity: 0.25,
  },
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

  addObjectAt: (obj) =>
    set((s) => ({ objects: [...s.objects, obj], selectedId: obj.id })),

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
    const roomDefaults = { wallColor: '#5a6a8a', floorColor: '#242430', ceilingColor: '#2a2a3e', wallOpacity: 0.25 };
    const room: RoomSettings = { ...roomDefaults, ...data.room };
    set({ room, objects: data.objects, selectedId: null });
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
