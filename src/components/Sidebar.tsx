import { useRef, useState } from 'react';
import { useLayoutStore, OBJECT_LABELS } from '../store/layoutStore';
import { ObjectEditor } from './ObjectEditor';
import { exportToJSON, importFromJSON } from '../utils/exportImport';
import { hasSavedLayout } from '../utils/storage';
import type { ObjectType, RoomSettings } from '../types/layout';

const OBJECT_TYPES: ObjectType[] = ['table', 'shelf', 'box', 'partition', 'chair'];

// ── 間取りプリセット ──────────────────────────────────────────────
interface FloorPreset {
  id:    string;
  label: string;
  room:  RoomSettings;
}

const FLOOR_PRESETS: { group: string; presets: FloorPreset[] }[] = [
  {
    group: '住居',
    presets: [
      { id: '1r',   label: '1R',   room: { width: 4,  depth: 5,  height: 2.4 } },
      { id: '1k',   label: '1K',   room: { width: 5,  depth: 6,  height: 2.4 } },
      { id: '1dk',  label: '1DK',  room: { width: 6,  depth: 7,  height: 2.4 } },
      { id: '1ldk', label: '1LDK', room: { width: 7,  depth: 8,  height: 2.5 } },
      { id: '2ldk', label: '2LDK', room: { width: 9,  depth: 9,  height: 2.5 } },
      { id: '3ldk', label: '3LDK', room: { width: 11, depth: 11, height: 2.5 } },
    ],
  },
  {
    group: '展示ブース',
    presets: [
      { id: 'booth_s', label: 'ブース S (3×3)', room: { width: 3, depth: 3, height: 2.5 } },
      { id: 'booth_m', label: 'ブース M (6×6)', room: { width: 6, depth: 6, height: 3.0 } },
      { id: 'booth_l', label: 'ブース L (9×9)', room: { width: 9, depth: 9, height: 3.0 } },
    ],
  },
  {
    group: '撮影スタジオ',
    presets: [
      { id: 'studio_s', label: 'スタジオ S (5×8)',  room: { width: 5, depth: 8,  height: 3.0 } },
      { id: 'studio_m', label: 'スタジオ M (8×12)', room: { width: 8, depth: 12, height: 3.5 } },
    ],
  },
  {
    group: 'オフィス',
    presets: [
      { id: 'office_s', label: '小会議室 (4×5)',  room: { width: 4,  depth: 5,  height: 2.7 } },
      { id: 'office_m', label: '中会議室 (6×8)',  room: { width: 6,  depth: 8,  height: 2.7 } },
      { id: 'office_l', label: 'オープン (12×15)', room: { width: 12, depth: 15, height: 3.0 } },
    ],
  },
];

const OBJECT_EMOJIS: Record<ObjectType, string> = {
  table:     '▬',
  shelf:     '▮',
  box:       '■',
  partition: '|',
  chair:     '⊓',
};

export const Sidebar: React.FC = () => {
  const [presetValue, setPresetValue] = useState('');
  const room = useLayoutStore((s) => s.room);
  const setRoom = useLayoutStore((s) => s.setRoom);
  const addObject = useLayoutStore((s) => s.addObject);
  const saveLayout = useLayoutStore((s) => s.saveLayout);
  const loadLayout = useLayoutStore((s) => s.loadLayout);
  const applyLayoutData = useLayoutStore((s) => s.applyLayoutData);
  const objects = useLayoutStore((s) => s.objects);
  const selectedId = useLayoutStore((s) => s.selectedId);
  const selectObject = useLayoutStore((s) => s.selectObject);
  const removeObject = useLayoutStore((s) => s.removeObject);
  const gridSnap = useLayoutStore((s) => s.gridSnap);
  const gridSize = useLayoutStore((s) => s.gridSize);
  const setGridSnap = useLayoutStore((s) => s.setGridSnap);
  const setGridSize = useLayoutStore((s) => s.setGridSize);

  const importRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    saveLayout();
    alert('保存しました');
  };

  const handleLoad = () => {
    const ok = loadLayout();
    if (!ok) alert('保存済みデータが見つかりません');
  };

  const handleExport = () => {
    const { room: r, objects: o } = useLayoutStore.getState();
    exportToJSON({ version: '1.0', room: r, objects: o, savedAt: new Date().toISOString() });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      applyLayoutData(data.room, data.objects);
      alert('インポートしました');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'インポートに失敗しました');
    }
    e.target.value = '';
  };

  const handleRoomChange = (field: 'width' | 'depth' | 'height', value: string) => {
    const n = parseFloat(value);
    if (!isNaN(n) && n > 0) setRoom({ [field]: n });
  };

  return (
    <aside className="sidebar">
      {/* ロゴ */}
      <div className="sidebar-logo">
        <span>3D Layout Planner</span>
      </div>

      {/* 間取りプリセット */}
      <section className="sidebar-section">
        <h3>間取りプリセット</h3>
        <select
          className="preset-select"
          value={presetValue}
          onChange={(e) => {
            const id = e.target.value;
            setPresetValue(id);
            const preset = FLOOR_PRESETS.flatMap(g => g.presets).find(p => p.id === id);
            if (preset) setRoom(preset.room);
          }}
        >
          <option value="" disabled>選択してください…</option>
          {FLOOR_PRESETS.map(({ group, presets }) => (
            <optgroup key={group} label={group}>
              {presets.map(({ id, label, room: r }) => (
                <option key={id} value={id}>
                  {label}（{r.width}×{r.depth}m）
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </section>

      {/* 部屋設定 */}
      <section className="sidebar-section">
        <h3>部屋サイズ (m)</h3>
        <div className="room-settings">
          <label>
            <span>幅 W</span>
            <input
              type="number"
              value={room.width}
              min={1}
              step={0.5}
              onChange={(e) => handleRoomChange('width', e.target.value)}
            />
          </label>
          <label>
            <span>奥行 D</span>
            <input
              type="number"
              value={room.depth}
              min={1}
              step={0.5}
              onChange={(e) => handleRoomChange('depth', e.target.value)}
            />
          </label>
          <label>
            <span>高さ H</span>
            <input
              type="number"
              value={room.height}
              min={1}
              step={0.5}
              onChange={(e) => handleRoomChange('height', e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* グリッドスナップ */}
      <section className="sidebar-section">
        <h3>グリッドスナップ</h3>
        <div className="snap-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={gridSnap}
              onChange={(e) => setGridSnap(e.target.checked)}
            />
            <span>{gridSnap ? 'ON' : 'OFF'}</span>
          </label>
          <label className="snap-size-label">
            <span>刻み</span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              disabled={!gridSnap}
            >
              <option value={0.25}>0.25m</option>
              <option value={0.5}>0.5m</option>
              <option value={1.0}>1.0m</option>
            </select>
          </label>
        </div>
      </section>

      {/* オブジェクト追加 */}
      <section className="sidebar-section">
        <h3>オブジェクトを追加</h3>
        <div className="object-buttons">
          {OBJECT_TYPES.map((type) => (
            <button
              key={type}
              className="btn-add-object"
              onClick={() => addObject(type)}
              title={OBJECT_LABELS[type]}
            >
              <span className="btn-icon">{OBJECT_EMOJIS[type]}</span>
              <span>{OBJECT_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* オブジェクトリスト */}
      {objects.length > 0 && (
        <section className="sidebar-section object-list-section">
          <h3>オブジェクト一覧 ({objects.length})</h3>
          <ul className="object-list">
            {objects.map((obj) => (
              <li
                key={obj.id}
                className={`object-list-item ${obj.id === selectedId ? 'selected' : ''}`}
                onClick={() => selectObject(obj.id)}
              >
                <span
                  className="object-color-dot"
                  style={{ background: obj.color }}
                />
                <span className="object-list-name">{obj.name}</span>
                <button
                  className="btn-remove-small"
                  onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                  title="削除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 選択オブジェクト編集 */}
      <section className="sidebar-section">
        <h3>プロパティ</h3>
        <ObjectEditor />
      </section>

      {/* 保存・読み込み */}
      <section className="sidebar-section storage-section">
        <h3>データ</h3>
        <div className="storage-buttons">
          <button className="btn-storage btn-save" onClick={handleSave}>
            💾 保存
          </button>
          <button
            className="btn-storage btn-load"
            onClick={handleLoad}
            disabled={!hasSavedLayout()}
          >
            📂 読み込み
          </button>
          <button className="btn-storage btn-export" onClick={handleExport}>
            ⬇️ エクスポート
          </button>
          <button
            className="btn-storage btn-import"
            onClick={() => importRef.current?.click()}
          >
            ⬆️ インポート
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </section>
    </aside>
  );
};
