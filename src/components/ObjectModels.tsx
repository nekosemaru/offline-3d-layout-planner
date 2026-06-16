import * as THREE from 'three';
import type { ObjectType, Vec3 } from '../types/layout';

interface SharedMat {
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
}

interface ModelProps extends SharedMat {
  sw: number;
  sh: number;
  sd: number;
  color: string;
}

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex).multiplyScalar(f);
  c.r = Math.min(1, c.r); c.g = Math.min(1, c.g); c.b = Math.min(1, c.b);
  return '#' + c.getHexString();
}

function mp(color: string, m: SharedMat, roughness = 0.7, metalness = 0.05) {
  return { color, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, opacity: m.opacity, roughness, metalness };
}

const TableModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const legH = sh - 0.06;
  const legY = -sh / 2 + legH / 2;
  const legR = Math.min(sw, sd) * 0.04;
  return (
    <group>
      <mesh position={[0, sh / 2 - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw * 0.96, 0.06, sd * 0.96]} />
        <meshStandardMaterial {...mp(color, m, 0.5)} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([xs, zs], i) => (
        <mesh key={i} position={[xs * (sw / 2 - 0.07), legY, zs * (sd / 2 - 0.07)]} castShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshStandardMaterial {...mp(shade(color, 0.7), m)} />
        </mesh>
      ))}
    </group>
  );
};

const ShelfModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const t = 0.025;
  const n = 4;
  return (
    <group>
      <mesh position={[0, 0, -sd / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[sw, sh, t]} />
        <meshStandardMaterial {...mp(shade(color, 0.75), m)} />
      </mesh>
      {([-1, 1] as const).map((xs, i) => (
        <mesh key={i} position={[xs * (sw / 2 - t / 2), 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, sh, sd - t]} />
          <meshStandardMaterial {...mp(color, m)} />
        </mesh>
      ))}
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[0, -sh / 2 + i * (sh / n), 0]} castShadow receiveShadow>
          <boxGeometry args={[sw - t * 2, t, sd - t]} />
          <meshStandardMaterial {...mp(shade(color, 1.15), m)} />
        </mesh>
      ))}
    </group>
  );
};

const BoxModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const lidH = sh * 0.12;
  return (
    <group>
      <mesh position={[0, -lidH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw, sh - lidH, sd]} />
        <meshStandardMaterial {...mp(color, m)} />
      </mesh>
      <mesh position={[0, sh / 2 - lidH / 2, 0]} castShadow>
        <boxGeometry args={[sw, lidH, sd]} />
        <meshStandardMaterial {...mp(shade(color, 1.25), m)} />
      </mesh>
      <mesh position={[0, sh / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, sw * 0.28, 8]} />
        <meshStandardMaterial {...mp(shade(color, 0.55), m)} />
      </mesh>
    </group>
  );
};

const PartitionModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => (
  <group>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[sw, sh * 0.97, sd]} />
      <meshStandardMaterial {...mp(color, m, 0.3)} />
    </mesh>
    {([-1, 1] as const).map((ys, i) => (
      <mesh key={i} position={[0, ys * (sh / 2 - 0.02), 0]}>
        <boxGeometry args={[sw, 0.04, sd * 1.5]} />
        <meshStandardMaterial {...mp(shade(color, 0.6), m)} />
      </mesh>
    ))}
  </group>
);

const ChairModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const seatY = 0.45 - sh / 2;
  const seatThick = 0.05;
  const backH = Math.max(0.1, sh - 0.45 - seatThick);
  const legH = 0.45 - seatThick;
  return (
    <group>
      <mesh position={[0, seatY, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw * 0.9, seatThick, sd * 0.85]} />
        <meshStandardMaterial {...mp(color, m)} />
      </mesh>
      <mesh position={[0, seatY + seatThick / 2 + backH / 2, -sd / 2 + 0.03]} castShadow receiveShadow>
        <boxGeometry args={[sw * 0.9, backH, 0.05]} />
        <meshStandardMaterial {...mp(shade(color, 0.85), m)} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([xs, zs], i) => (
        <mesh key={i} position={[xs * (sw / 2 - 0.06), -sh / 2 + legH / 2, zs * (sd / 2 - 0.06)]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, legH, 6]} />
          <meshStandardMaterial {...mp(shade(color, 0.6), m)} />
        </mesh>
      ))}
    </group>
  );
};

const SofaModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const baseH = 0.12;
  const seatH = 0.22;
  const armW = 0.15;
  const armH = sh * 0.55;
  const backH = sh - baseH - seatH;
  return (
    <group>
      <mesh position={[0, -sh / 2 + baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw, baseH, sd]} />
        <meshStandardMaterial {...mp(shade(color, 0.55), m)} />
      </mesh>
      <mesh position={[0, -sh / 2 + baseH + seatH / 2, sd * 0.1]} castShadow receiveShadow>
        <boxGeometry args={[sw - armW * 2, seatH, sd * 0.62]} />
        <meshStandardMaterial {...mp(shade(color, 1.1), m)} />
      </mesh>
      <mesh position={[0, -sh / 2 + baseH + seatH + backH / 2, -sd / 2 + 0.12]} castShadow receiveShadow>
        <boxGeometry args={[sw - armW * 2, backH, 0.22]} />
        <meshStandardMaterial {...mp(shade(color, 0.9), m)} />
      </mesh>
      {([-1, 1] as const).map((xs, i) => (
        <mesh key={i} position={[xs * (sw / 2 - armW / 2), -sh / 2 + armH / 2, sd * 0.05]} castShadow receiveShadow>
          <boxGeometry args={[armW, armH, sd * 0.75]} />
          <meshStandardMaterial {...mp(shade(color, 0.8), m)} />
        </mesh>
      ))}
    </group>
  );
};

const DeskModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const topThick = 0.04;
  const sideW = 0.04;
  return (
    <group>
      <mesh position={[0, sh / 2 - topThick / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw, topThick, sd]} />
        <meshStandardMaterial {...mp(shade(color, 1.15), m, 0.4)} />
      </mesh>
      {([-1, 1] as const).map((xs, i) => (
        <mesh key={i} position={[xs * (sw / 2 - sideW / 2), -topThick / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sideW, sh - topThick, sd * 0.85]} />
          <meshStandardMaterial {...mp(color, m)} />
        </mesh>
      ))}
    </group>
  );
};

const BedModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const frameH = 0.1;
  const headThick = 0.08;
  const mattH = sh - frameH;
  const mattZ = (headThick - 0.05) / 2;
  return (
    <group>
      <mesh position={[0, -sh / 2 + frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw, frameH, sd]} />
        <meshStandardMaterial {...mp(shade(color, 0.6), m)} />
      </mesh>
      <mesh position={[0, -sh / 2 + frameH + mattH / 2, mattZ]} castShadow receiveShadow>
        <boxGeometry args={[sw - 0.05, mattH, sd - headThick - 0.05]} />
        <meshStandardMaterial {...mp('#e8e0d4', m, 0.3)} />
      </mesh>
      <mesh position={[0, -sh / 2 + sh * 0.45, -sd / 2 + headThick / 2]} castShadow receiveShadow>
        <boxGeometry args={[sw, sh * 0.9, headThick]} />
        <meshStandardMaterial {...mp(color, m)} />
      </mesh>
      <mesh position={[0, -sh / 2 + frameH + mattH + 0.03, -sd / 2 + headThick + 0.22]} castShadow>
        <boxGeometry args={[sw * 0.58, 0.06, 0.33]} />
        <meshStandardMaterial {...mp('#f0ece6', m, 0.2)} />
      </mesh>
    </group>
  );
};

const CabinetModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const doorThick = 0.02;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[sw, sh, sd]} />
        <meshStandardMaterial {...mp(shade(color, 0.78), m)} />
      </mesh>
      {([-1, 1] as const).map((xs, i) => (
        <mesh key={i} position={[xs * sw * 0.245, 0, sd / 2 + doorThick / 2]} castShadow>
          <boxGeometry args={[sw * 0.49, sh * 0.95, doorThick]} />
          <meshStandardMaterial {...mp(shade(color, 1.18), m, 0.35)} />
        </mesh>
      ))}
      {([-1, 1] as const).map((xs, i) => (
        <mesh key={`h${i}`} position={[xs * sw * 0.1, 0, sd / 2 + doorThick + 0.012]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.07, 6]} />
          <meshStandardMaterial {...mp('#aaaaaa', m, 0.2, 0.8)} />
        </mesh>
      ))}
    </group>
  );
};

const PlantModel: React.FC<ModelProps> = ({ sw, sh, sd, color, ...m }) => {
  const potH = sh * 0.25;
  const trunkH = sh * 0.38;
  const leafR = Math.min(sw, sd) * 0.48;
  return (
    <group>
      <mesh position={[0, -sh / 2 + potH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[sw * 0.3, sw * 0.2, potH, 12]} />
        <meshStandardMaterial {...mp('#8B6355', m)} />
      </mesh>
      <mesh position={[0, -sh / 2 + potH + trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.028, trunkH, 6]} />
        <meshStandardMaterial {...mp('#4a2e10', m)} />
      </mesh>
      <mesh position={[0, sh / 2 - leafR * 0.85, 0]} castShadow>
        <sphereGeometry args={[leafR, 10, 10]} />
        <meshStandardMaterial {...mp(color, m, 0.55)} />
      </mesh>
      <mesh position={[sw * 0.22, sh / 2 - leafR - 0.04, sd * 0.1]} castShadow>
        <sphereGeometry args={[leafR * 0.62, 8, 8]} />
        <meshStandardMaterial {...mp(shade(color, 0.82), m, 0.6)} />
      </mesh>
    </group>
  );
};

export interface ObjectModelProps {
  type: ObjectType;
  size: Vec3;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
}

export const ObjectModel: React.FC<ObjectModelProps> = ({ type, size, color, ...shared }) => {
  const props: ModelProps = { sw: size.x, sh: size.y, sd: size.z, color, ...shared };
  switch (type) {
    case 'table':     return <TableModel {...props} />;
    case 'shelf':     return <ShelfModel {...props} />;
    case 'box':       return <BoxModel {...props} />;
    case 'partition': return <PartitionModel {...props} />;
    case 'chair':     return <ChairModel {...props} />;
    case 'sofa':      return <SofaModel {...props} />;
    case 'desk':      return <DeskModel {...props} />;
    case 'bed':       return <BedModel {...props} />;
    case 'cabinet':   return <CabinetModel {...props} />;
    case 'plant':     return <PlantModel {...props} />;
    default:          return null;
  }
};
