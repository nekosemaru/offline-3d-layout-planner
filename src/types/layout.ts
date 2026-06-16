export type ObjectType =
  | 'table' | 'shelf' | 'box' | 'partition' | 'chair'
  | 'sofa' | 'desk' | 'bed' | 'cabinet' | 'plant';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LayoutObject {
  id: string;
  type: ObjectType;
  name: string;
  position: Vec3;
  rotation: Vec3;
  size: Vec3;
  color: string;
}

export interface RoomSettings {
  width: number;
  depth: number;
  height: number;
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  wallOpacity: number;
}

export interface LayoutData {
  version: string;
  room: RoomSettings;
  objects: LayoutObject[];
  savedAt: string;
}
