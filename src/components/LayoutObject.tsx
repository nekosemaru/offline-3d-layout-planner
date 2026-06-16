import { forwardRef } from 'react';
import { type ThreeEvent, useThree } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { LayoutObject as ILayoutObject } from '../types/layout';
import { useLayoutStore } from '../store/layoutStore';

interface Props {
  object: ILayoutObject;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}

const DEG2RAD = Math.PI / 180;

export const LayoutObject = forwardRef<THREE.Group, Props>(({ object, onPointerDown }, ref) => {
  const { gl } = useThree();
  const selectedId  = useLayoutStore((s) => s.selectedId);
  const isDragging  = useLayoutStore((s) => s.isDragging);
  const isSelected  = selectedId === object.id;
  const isBeingDragged = isSelected && isDragging;

  const { position, rotation, size } = object;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onPointerDown(e);
  };

  const handlePointerEnter = () => {
    if (!isDragging) gl.domElement.style.cursor = 'grab';
  };

  const handlePointerLeave = () => {
    if (!isDragging) gl.domElement.style.cursor = 'default';
  };

  return (
    <group
      ref={ref}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x * DEG2RAD, rotation.y * DEG2RAD, rotation.z * DEG2RAD]}
    >
      <mesh
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshStandardMaterial
          color={object.color}
          emissive={isSelected ? '#3388ff' : '#000000'}
          emissiveIntensity={isBeingDragged ? 0.5 : isSelected ? 0.3 : 0}
          transparent={isBeingDragged}
          opacity={isBeingDragged ? 0.75 : 1.0}
        />
        {isSelected && (
          <Edges scale={1.02} threshold={15} color="#44aaff" />
        )}
      </mesh>
    </group>
  );
});

LayoutObject.displayName = 'LayoutObject';
