import { forwardRef } from 'react';
import { type ThreeEvent, useThree } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { LayoutObject as ILayoutObject } from '../types/layout';
import { useLayoutStore } from '../store/layoutStore';
import { ObjectModel } from './ObjectModels';

interface Props {
  object: ILayoutObject;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}

export const LayoutObject = forwardRef<THREE.Group, Props>(({ object, onPointerDown }, ref) => {
  const { gl } = useThree();
  const selectedId   = useLayoutStore((s) => s.selectedId);
  const isDragging   = useLayoutStore((s) => s.isDragging);
  const isSelected   = selectedId === object.id;
  const isBeingDragged = isSelected && isDragging;

  const { position, rotation, size } = object;
  const DEG2RAD = Math.PI / 180;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onPointerDown(e);
  };
  const handlePointerEnter = () => { if (!isDragging) gl.domElement.style.cursor = 'grab'; };
  const handlePointerLeave = () => { if (!isDragging) gl.domElement.style.cursor = 'default'; };

  return (
    <group
      ref={ref}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x * DEG2RAD, rotation.y * DEG2RAD, rotation.z * DEG2RAD]}
    >
      {/* 透明ヒットボックス（ドラッグ判定用） */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        castShadow={false}
      >
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 選択時のアウトライン */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[size.x * 1.01, size.y * 1.01, size.z * 1.01]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges threshold={15} color={isBeingDragged ? '#88ccff' : '#44aaff'} />
        </mesh>
      )}

      {/* 3Dモデル */}
      <ObjectModel
        type={object.type}
        size={size}
        color={object.color}
        emissive={isSelected ? '#3388ff' : '#000000'}
        emissiveIntensity={isBeingDragged ? 0.45 : isSelected ? 0.2 : 0}
        transparent={isBeingDragged}
        opacity={isBeingDragged ? 0.78 : 1.0}
      />
    </group>
  );
});

LayoutObject.displayName = 'LayoutObject';
