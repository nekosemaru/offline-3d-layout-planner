import { useMemo } from 'react';
import * as THREE from 'three';
import { useLayoutStore } from '../store/layoutStore';

// ── カスタムグリッド ──────────────────────────────────────────────
// drei の Grid は cellSize を動的変更できないため LineSegments で実装

interface FloorGridProps {
  width: number;
  depth: number;
  gridSize: number;
}

const FloorGrid: React.FC<FloorGridProps> = ({ width, depth, gridSize }) => {
  const sectionEvery = 4; // 細線 N 本ごとに太線

  const { cellGeo, sectionGeo } = useMemo(() => {
    const hw = width  / 2;
    const hd = depth / 2;
    const cellPts:    THREE.Vector3[] = [];
    const sectionPts: THREE.Vector3[] = [];

    const snap = (v: number) => Math.round(v / gridSize) * gridSize;

    // 横線（Z 方向）
    const zSteps = Math.round(depth / gridSize);
    for (let i = 0; i <= zSteps; i++) {
      const z = snap(-hd + i * gridSize);
      const isSec = i % sectionEvery === 0;
      (isSec ? sectionPts : cellPts).push(
        new THREE.Vector3(-hw, 0, z),
        new THREE.Vector3( hw, 0, z),
      );
    }

    // 縦線（X 方向）
    const xSteps = Math.round(width / gridSize);
    for (let i = 0; i <= xSteps; i++) {
      const x = snap(-hw + i * gridSize);
      const isSec = i % sectionEvery === 0;
      (isSec ? sectionPts : cellPts).push(
        new THREE.Vector3(x, 0, -hd),
        new THREE.Vector3(x, 0,  hd),
      );
    }

    return {
      cellGeo:    new THREE.BufferGeometry().setFromPoints(cellPts),
      sectionGeo: new THREE.BufferGeometry().setFromPoints(sectionPts),
    };
  }, [width, depth, gridSize]);

  return (
    <group position={[0, 0.001, 0]}>
      {/* 細線 */}
      <lineSegments geometry={cellGeo}>
        <lineBasicMaterial color="#383848" />
      </lineSegments>
      {/* 太線（色で強調） */}
      <lineSegments geometry={sectionGeo}>
        <lineBasicMaterial color="#5a5a7a" />
      </lineSegments>
    </group>
  );
};

// ── Room ─────────────────────────────────────────────────────────

export const Room: React.FC = () => {
  const room     = useLayoutStore((s) => s.room);
  const gridSize = useLayoutStore((s) => s.gridSize);
  const { width, depth, height } = room;

  const wallMat = {
    color: '#5a6a8a',
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  };

  return (
    <group>
      {/* 床 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#242430" />
      </mesh>

      {/* グリッド（スナップ幅と連動） */}
      <FloorGrid width={width} depth={depth} gridSize={gridSize} />

      {/* 前壁 */}
      <mesh position={[0, height / 2, -depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>

      {/* 後壁 */}
      <mesh position={[0, height / 2, depth / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>

      {/* 左壁 */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>

      {/* 右壁 */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>

      {/* 天井 */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial {...wallMat} opacity={0.1} />
      </mesh>
    </group>
  );
};
