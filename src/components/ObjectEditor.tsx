import { useLayoutStore } from '../store/layoutStore';
import type { Vec3 } from '../types/layout';

const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

const NumInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}> = ({ label, value, onChange, step = 0.1, min }) => (
  <div className="num-input-row">
    <span className="axis-label">{label}</span>
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        if (!isNaN(n)) onChange(n);
      }}
    />
  </div>
);

export const ObjectEditor: React.FC = () => {
  const selectedId = useLayoutStore((s) => s.selectedId);
  const objects = useLayoutStore((s) => s.objects);
  const updateObject = useLayoutStore((s) => s.updateObject);
  const removeObject = useLayoutStore((s) => s.removeObject);
  const gridSnap = useLayoutStore((s) => s.gridSnap);
  const gridSize = useLayoutStore((s) => s.gridSize);

  const obj = objects.find((o) => o.id === selectedId);
  if (!obj) {
    return (
      <div className="editor-empty">
        <p>オブジェクトを選択すると<br />ここで編集できます</p>
      </div>
    );
  }

  const updateVec3 = (field: 'position' | 'rotation' | 'size', axis: keyof Vec3, raw: number) => {
    let value = raw;
    if (field === 'position' && gridSnap) {
      value = snapToGrid(raw, gridSize);
    }
    updateObject(obj.id, { [field]: { ...obj[field], [axis]: value } });
  };

  return (
    <div className="object-editor">
      <div className="editor-header">
        <span className="editor-type-badge">{obj.type}</span>
        <button
          className="btn-delete"
          onClick={() => removeObject(obj.id)}
          title="削除"
        >
          削除
        </button>
      </div>

      <div className="editor-field">
        <label>名前</label>
        <input
          type="text"
          value={obj.name}
          onChange={(e) => updateObject(obj.id, { name: e.target.value })}
        />
      </div>

      <div className="editor-section">
        <div className="section-title">位置 (m)</div>
        <NumInput label="X" value={obj.position.x} onChange={(v) => updateVec3('position', 'x', v)} />
        <NumInput label="Y" value={obj.position.y} onChange={(v) => updateVec3('position', 'y', v)} />
        <NumInput label="Z" value={obj.position.z} onChange={(v) => updateVec3('position', 'z', v)} />
      </div>

      <div className="editor-section">
        <div className="section-title">回転 (度)</div>
        <NumInput label="X" value={obj.rotation.x} step={5} onChange={(v) => updateVec3('rotation', 'x', v)} />
        <NumInput label="Y" value={obj.rotation.y} step={5} onChange={(v) => updateVec3('rotation', 'y', v)} />
        <NumInput label="Z" value={obj.rotation.z} step={5} onChange={(v) => updateVec3('rotation', 'z', v)} />
      </div>

      <div className="editor-section">
        <div className="section-title">サイズ (m)</div>
        <NumInput label="W" value={obj.size.x} min={0.01} onChange={(v) => updateVec3('size', 'x', v)} />
        <NumInput label="H" value={obj.size.y} min={0.01} onChange={(v) => updateVec3('size', 'y', v)} />
        <NumInput label="D" value={obj.size.z} min={0.01} onChange={(v) => updateVec3('size', 'z', v)} />
      </div>

      <div className="editor-section">
        <div className="section-title">色</div>
        <div className="color-row">
          <input
            type="color"
            value={obj.color}
            onChange={(e) => updateObject(obj.id, { color: e.target.value })}
          />
          <span className="color-hex">{obj.color}</span>
        </div>
      </div>
    </div>
  );
};
