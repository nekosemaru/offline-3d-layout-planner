import { useRef, useState } from 'react';
import { useLayoutStore, OBJECT_LABELS } from '../store/layoutStore';
import { ObjectEditor } from './ObjectEditor';
import { exportToJSON, importFromJSON } from '../utils/exportImport';
import { hasSavedLayout } from '../utils/storage';
import type { ObjectType, RoomSettings, LayoutObject } from '../types/layout';

const OBJECT_TYPES: ObjectType[] = [
  'table', 'shelf', 'box', 'partition', 'chair',
  'sofa', 'desk', 'bed', 'cabinet', 'plant',
];

// ── 間取りプリセット ──────────────────────────────────────────────
interface FloorPreset {
  id:    string;
  label: string;
  room:  Pick<RoomSettings, 'width' | 'depth' | 'height'>;
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

// ── 複合間取りプリセット ─────────────────────────────────────────
type PresetObj = Omit<LayoutObject, 'id'>;

interface ComplexPreset {
  id: string;
  label: string;
  room: RoomSettings;
  objects: PresetObj[];
}

const STYLE_BRIGHT = { wallColor: '#e8eaf0', floorColor: '#c4a882', ceilingColor: '#f0f0f5', wallOpacity: 0.65 };
const WALL_C = '#d4cfc4';

const wall = (name: string, x: number, z: number, sw: number, sh: number, sd: number): PresetObj => ({
  type: 'partition', name,
  position: { x, y: sh / 2, z },
  rotation: { x: 0, y: 0, z: 0 },
  size: { x: sw, y: sh, z: sd },
  color: WALL_C,
});

const COMPLEX_PRESETS: ComplexPreset[] = [
  {
    id: 'cp_1ldk',
    label: '1LDK（LDK ＋ 寝室）',
    room: { width: 10, depth: 8, height: 2.5, ...STYLE_BRIGHT },
    objects: [wall('仕切り壁', 2, 0, 0.12, 2.5, 8.0)],
  },
  {
    id: 'cp_2ldk',
    label: '2LDK（LDK ＋ 洋室×2）',
    room: { width: 14, depth: 8, height: 2.5, ...STYLE_BRIGHT },
    objects: [
      wall('仕切り壁1', 0, 0, 0.12, 2.5, 8.0),
      wall('仕切り壁2', 3.5, 0, 0.12, 2.5, 8.0),
    ],
  },
  {
    id: 'cp_3ldk',
    label: '3LDK（LDK ＋ 洋室×3）',
    room: { width: 18, depth: 10, height: 2.7, ...STYLE_BRIGHT },
    objects: [
      wall('仕切り壁1', 0, 0, 0.12, 2.7, 10.0),
      wall('仕切り壁2', 4, 0, 0.12, 2.7, 10.0),
      wall('仕切り壁3（横）', 6.5, 0, 5.0, 2.7, 0.12),
    ],
  },
  {
    id: 'cp_wasyou',
    label: '和室 ＋ 洋室（8×7m）',
    room: { width: 8, depth: 7, height: 2.5, wallColor: '#f0e8d4', floorColor: '#8B7355', ceilingColor: '#f5f0e8', wallOpacity: 0.65 },
    objects: [wall('間仕切り', 0, 0, 0.12, 2.5, 7.0)],
  },
  {
    id: 'cp_studio_bg',
    label: 'スタジオ 背景エリア付き（12×8m）',
    room: { width: 12, depth: 8, height: 3.0, wallColor: '#f5f5f5', floorColor: '#3a3a3a', ceilingColor: '#ffffff', wallOpacity: 0.8 },
    objects: [wall('背景壁', -1, 0, 0.15, 3.0, 8.0)],
  },
  {
    id: 'cp_office_cubicle',
    label: 'オフィス キュービクル（12×10m）',
    room: { width: 12, depth: 10, height: 2.7, wallColor: '#e4e8ec', floorColor: '#6a6a6a', ceilingColor: '#f0f0f0', wallOpacity: 0.7 },
    objects: [
      wall('仕切り1（縦）', -2, 0, 0.1, 1.5, 10.0),
      wall('仕切り2（縦）', 2, 0, 0.1, 1.5, 10.0),
      wall('仕切りA（横）', -4.5, -2.5, 4.0, 1.5, 0.1),
      wall('仕切りB（横）', -4.5, 2.5, 4.0, 1.5, 0.1),
    ],
  },
];

const OBJECT_EMOJIS: Record<ObjectType, string> = {
  table:     '▬',
  shelf:     '▮',
  box:       '■',
  partition: '|',
  chair:     '⊓',
  sofa:      '⊏',
  desk:      '▭',
  bed:       '▰',
  cabinet:   '▯',
  plant:     '♣',
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
      const roomDefaults = { wallColor: '#5a6a8a', floorColor: '#242430', ceilingColor: '#2a2a3e', wallOpacity: 0.25 };
      const room: RoomSettings = { ...roomDefaults, ...data.room };
      applyLayoutData(room, data.objects);
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

  const handleRoomColor = (field: 'wallColor' | 'floorColor' | 'ceilingColor', value: string) => {
    setRoom({ [field]: value });
  };

  const handleWallOpacity = (value: string) => {
    const n = parseFloat(value);
    if (!isNaN(n)) setRoom({ wallOpacity: Math.max(0, Math.min(1, n)) });
  };

  const applyComplexPreset = (preset: ComplexPreset) => {
    const objects = preset.objects.map(o => ({ ...o, id: crypto.randomUUID() }));
    applyLayoutData(preset.room, objects);
  };

  return (
    <aside className="sidebar">
      {/* ロゴ */}
      <div className="sidebar-logo">
        <span>3Dレイアウトプランナー</span>
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

      {/* 複合間取りプリセット */}
      <section className="sidebar-section">
        <h3>複合間取り（仕切り壁付き）</h3>
        <div className="complex-preset-list">
          {COMPLEX_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className="btn-complex-preset"
              onClick={() => applyComplexPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
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

      {/* インテリア設定 */}
      <section className="sidebar-section">
        <h3>インテリア</h3>
        <div className="room-color-settings">
          <label className="color-setting-row">
            <span>壁</span>
            <input
              type="color"
              value={room.wallColor}
              onChange={(e) => handleRoomColor('wallColor', e.target.value)}
            />
            <span className="color-hex-small">{room.wallColor}</span>
          </label>
          <label className="color-setting-row">
            <span>床</span>
            <input
              type="color"
              value={room.floorColor}
              onChange={(e) => handleRoomColor('floorColor', e.target.value)}
            />
            <span className="color-hex-small">{room.floorColor}</span>
          </label>
          <label className="color-setting-row">
            <span>天井</span>
            <input
              type="color"
              value={room.ceilingColor}
              onChange={(e) => handleRoomColor('ceilingColor', e.target.value)}
            />
            <span className="color-hex-small">{room.ceilingColor}</span>
          </label>
          <label className="color-setting-row">
            <span>壁透明度</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={room.wallOpacity}
              onChange={(e) => handleWallOpacity(e.target.value)}
              className="opacity-slider"
            />
            <span className="color-hex-small">{Math.round(room.wallOpacity * 100)}%</span>
          </label>
        </div>
        <div className="interior-presets">
          <span className="preset-label">プリセット</span>
          <div className="interior-preset-buttons">
            <button className="btn-interior-preset" onClick={() => setRoom({ wallColor: '#f5f0e8', floorColor: '#c4a882', ceilingColor: '#fafaf5' })} title="ナチュラル">ナチュラル</button>
            <button className="btn-interior-preset" onClick={() => setRoom({ wallColor: '#e8eaf0', floorColor: '#4a4a5a', ceilingColor: '#f0f0f5' })} title="モダン">モダン</button>
            <button className="btn-interior-preset" onClick={() => setRoom({ wallColor: '#d4e8d4', floorColor: '#8B7355', ceilingColor: '#e8f0e8' })} title="北欧">北欧</button>
            <button className="btn-interior-preset" onClick={() => setRoom({ wallColor: '#f0e8d4', floorColor: '#6b4a2a', ceilingColor: '#f5f0e8' })} title="和風">和風</button>
            <button className="btn-interior-preset" onClick={() => setRoom({ wallColor: '#5a6a8a', floorColor: '#242430', ceilingColor: '#2a2a3e' })} title="暗室">暗室</button>
          </div>
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
