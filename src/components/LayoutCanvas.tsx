import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ThreeEvent } from '@react-three/fiber';
import type { LayoutObject as ILayoutObject } from '../types/layout';
import { Room } from './Room';
import { LayoutObject } from './LayoutObject';
import { useLayoutStore } from '../store/layoutStore';

// ── カメラプリセット ──────────────────────────────────────────────

type CameraPreset = 'perspective' | 'top' | 'front' | 'side';

const CAMERA_PRESETS: Record<CameraPreset, {
  position: [number, number, number];
  target:   [number, number, number];
}> = {
  perspective: { position: [8,  8,  8],    target: [0, 0, 0] },
  top:         { position: [0, 18,  0.01], target: [0, 0, 0] },
  front:       { position: [0,  2, 18],    target: [0, 2, 0] },
  side:        { position: [18, 2,  0],    target: [0, 2, 0] },
};

const VIEW_BUTTONS: { key: CameraPreset; label: string }[] = [
  { key: 'perspective', label: '斜め' },
  { key: 'top',         label: '上'   },
  { key: 'front',       label: '正面' },
  { key: 'side',        label: '横'   },
];

// ── Canvas 内部 Scene ────────────────────────────────────────────

interface SceneProps {
  cameraPreset:    CameraPreset | null;
  onPresetApplied: () => void;
}

const LIFT_HEIGHT = 0.35; // ドラッグ中に浮かせる高さ(m)

const Scene: React.FC<SceneProps> = ({ cameraPreset, onPresetApplied }) => {
  const objects      = useLayoutStore((s) => s.objects);
  const selectObject = useLayoutStore((s) => s.selectObject);

  const { camera, gl } = useThree();
  const orbitRef   = useRef<OrbitControlsImpl>(null);

  // ドラッグ管理はすべてrefで持つ（stateにすると再レンダリングが多すぎる）
  const draggingIdRef  = useRef<string | null>(null);
  const lastSnapRef    = useRef<{ x: number; z: number } | null>(null);
  const raycaster      = useRef(new THREE.Raycaster());
  const floorPlane     = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // カメラプリセット切り替え
  useEffect(() => {
    if (!cameraPreset) return;
    const { position, target } = CAMERA_PRESETS[cameraPreset];
    camera.position.set(...position);
    if (orbitRef.current) {
      orbitRef.current.target.set(...target);
      orbitRef.current.update();
    }
    onPresetApplied();
  }, [cameraPreset, camera, onPresetApplied]);

  // ポインターイベントリスナーを1度だけ登録
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerMove = (e: PointerEvent) => {
      const id = draggingIdRef.current;
      if (!id) return;

      // NDC座標に変換してraycast
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      const ny = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
      raycaster.current.setFromCamera(new THREE.Vector2(nx, ny), camera);

      // 床面（Y=0 平面）との交点を求める
      const hit = new THREE.Vector3();
      if (!raycaster.current.ray.intersectPlane(floorPlane.current, hit)) return;

      // グリッドスナップ
      const { gridSnap, gridSize, objects: objs, updateObject } = useLayoutStore.getState();
      const snap = (v: number) => gridSnap ? Math.round(v / gridSize) * gridSize : v;
      const sx = snap(hit.x);
      const sz = snap(hit.z);
      lastSnapRef.current = { x: sx, z: sz };

      const obj = objs.find(o => o.id === id);
      if (!obj) return;

      // Y は size.y/2 + リフト（浮き上がり演出）
      updateObject(id, { position: { x: sx, y: obj.size.y / 2 + LIFT_HEIGHT, z: sz } });
    };

    const onPointerUp = () => {
      const id = draggingIdRef.current;
      if (id) {
        const { objects: objs, updateObject } = useLayoutStore.getState();
        const obj = objs.find(o => o.id === id);
        const pos = lastSnapRef.current;
        if (obj && pos) {
          // 置く：Y を床面高さに戻す
          updateObject(id, { position: { x: pos.x, y: obj.size.y / 2, z: pos.z } });
        }
      }
      draggingIdRef.current = null;
      lastSnapRef.current   = null;
      useLayoutStore.getState().setIsDragging(false);
      if (orbitRef.current) orbitRef.current.enabled = true;
      canvas.style.cursor = 'default';
    };

    // ドラッグ中のホイール → グリッド幅単位でオブジェクトを拡縮
    const onWheel = (e: WheelEvent) => {
      const id = draggingIdRef.current;
      if (!id) return;
      e.preventDefault();

      const { gridSize, objects: objs, updateObject } = useLayoutStore.getState();
      const obj = objs.find(o => o.id === id);
      if (!obj) return;

      const delta = e.deltaY < 0 ? gridSize : -gridSize;
      const minSize = gridSize;
      const clamp = (v: number) => Math.max(minSize, Math.round((v + delta) * 1000) / 1000);

      // 仕切り（壁）は長さ(size.x)のみ拡縮、それ以外は3辺すべて拡縮
      const newSize = obj.type === 'partition'
        ? { ...obj.size, x: clamp(obj.size.x) }
        : { x: clamp(obj.size.x), y: clamp(obj.size.y), z: clamp(obj.size.z) };

      updateObject(id, {
        size: newSize,
        position: { ...obj.position, y: newSize.y / 2 + LIFT_HEIGHT },
      });
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup',   onPointerUp);
    canvas.addEventListener('wheel',       onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup',   onPointerUp);
      canvas.removeEventListener('wheel',       onWheel);
    };
  }, [camera, gl]);

  // キーボード操作
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Del/Backspace → 選択中オブジェクトを削除（ドラッグ中は無効）
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedId, removeObject } = useLayoutStore.getState();
        if (selectedId && !draggingIdRef.current) {
          e.preventDefault();
          removeObject(selectedId);
        }
        return;
      }

      const id = draggingIdRef.current;
      if (!id) return;
      const state = useLayoutStore.getState();
      const obj = state.objects.find(o => o.id === id);
      if (!obj) return;

      // Ctrl: 仕切り → 90°に折る / その他 → 90°回転
      if (e.key === 'Control') {
        e.preventDefault();
        if (obj.type !== 'partition') {
          state.updateObject(id, { rotation: { ...obj.rotation, y: ((obj.rotation.y - 90) % 360) } });
          return;
        }
        spawnConnectedPartition(obj, state, 90);
        return;
      }

      // Shift: 仕切り → 同方向に延長
      if (e.key === 'Shift' && obj.type === 'partition') {
        e.preventDefault();
        spawnConnectedPartition(obj, state, 0);
      }
    };

    // 現在の仕切りを確定し、接続した新仕切りをドラッグ開始
    const spawnConnectedPartition = (
      obj: ILayoutObject,
      state: ReturnType<typeof useLayoutStore.getState>,
      turnDeg: number,
    ) => {
      const snapPos = lastSnapRef.current ?? { x: obj.position.x, z: obj.position.z };
      const { gridSnap, gridSize } = state;
      const snap = (v: number) => gridSnap ? Math.round(v / gridSize) * gridSize : v;
      const sx = snap(snapPos.x);
      const sz = snap(snapPos.z);

      // 現在の仕切りを床に降ろして確定
      state.updateObject(obj.id, { position: { x: sx, y: obj.size.y / 2, z: sz } });

      // 仕切りの長手方向ベクトル（world空間）
      const rad = obj.rotation.y * (Math.PI / 180);
      const longX = Math.sin(rad);
      const longZ = Math.cos(rad);
      const halfLen = obj.size.z / 2;

      // 現在の仕切りの "先端" 位置
      const endX = sx + longX * halfLen;
      const endZ = sz + longZ * halfLen;

      // 新しい仕切りの方向・回転
      const newRotY = (obj.rotation.y + turnDeg) % 360;
      const newRad  = newRotY * (Math.PI / 180);
      const nLongX  = Math.sin(newRad);
      const nLongZ  = Math.cos(newRad);

      // 新仕切りのセンター = 先端 + 新方向 * halfLen
      const newX = endX + nLongX * halfLen;
      const newZ = endZ + nLongZ * halfLen;

      const newObj: ILayoutObject = {
        id: crypto.randomUUID(),
        type: 'partition',
        name: obj.name,
        position: { x: newX, y: obj.size.y / 2 + LIFT_HEIGHT, z: newZ },
        rotation: { ...obj.rotation, y: newRotY },
        size: { ...obj.size },
        color: obj.color,
      };

      state.addObjectAt(newObj);
      draggingIdRef.current = newObj.id;
      lastSnapRef.current   = { x: newX, z: newZ };
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // オブジェクトのPointerDown → ドラッグ開始
  const handleObjectPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, id: string) => {
      e.stopPropagation();
      selectObject(id);
      draggingIdRef.current = id;
      lastSnapRef.current   = null;
      useLayoutStore.getState().setIsDragging(true);
      if (orbitRef.current) orbitRef.current.enabled = false;
      gl.domElement.style.cursor = 'grabbing';
      gl.domElement.setPointerCapture((e.nativeEvent as PointerEvent).pointerId);
    },
    [selectObject, gl],
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        minDistance={2}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.01}
        enablePan
        panSpeed={0.8}
      />

      <Room />

      {objects.map((obj) => (
        <LayoutObject
          key={obj.id}
          object={obj}
          onPointerDown={(e) => handleObjectPointerDown(e, obj.id)}
        />
      ))}
    </>
  );
};

// ── メインコンポーネント ─────────────────────────────────────────

export const LayoutCanvas: React.FC = () => {
  const selectObject      = useLayoutStore((s) => s.selectObject);
  const selectedObjType   = useLayoutStore((s) => {
    const obj = s.objects.find(o => o.id === s.selectedId);
    return obj?.type ?? null;
  });
  const [preset, setPreset] = useState<CameraPreset | null>(null);
  const handlePresetApplied = useCallback(() => setPreset(null), []);

  return (
    <div className="canvas-wrapper">
      <div className="view-buttons">
        {VIEW_BUTTONS.map(({ key, label }) => (
          <button key={key} className="btn-view" onClick={() => setPreset(key)}>
            {label}
          </button>
        ))}
      </div>

      {selectedObjType === 'partition' && (
        <div className="partition-hint">
          ドラッグ中&nbsp;
          <kbd>Ctrl</kbd> 90°に折る&nbsp;&nbsp;
          <kbd>Shift</kbd> 同方向に延長
        </div>
      )}

      <Canvas
        shadows
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => selectObject(null)}
      >
        <color attach="background" args={['#1a1a2e']} />
        <Scene cameraPreset={preset} onPresetApplied={handlePresetApplied} />
      </Canvas>
    </div>
  );
};
