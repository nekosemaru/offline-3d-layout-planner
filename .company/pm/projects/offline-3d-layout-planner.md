---
created: "2026-06-16"
project: "Offline 3D Layout Planner"
status: in-progress
tags: [vite, react, three.js, typescript]
---

# プロジェクト: Offline 3D Layout Planner

## 概要
部屋・展示会ブース・撮影セットなどの簡易レイアウトを、ブラウザ上で3D配置できるWebアプリ。外部API・外部DB不使用のオフラインファースト設計。

## ゴール
- ブラウザだけで動作する3Dレイアウトエディタ
- localStorage保存・JSONエクスポート/インポート
- 将来的にPWA化してオフライン完全対応

## 技術スタック
- Vite + React + TypeScript
- three.js / @react-three/fiber / @react-three/drei
- zustand（状態管理）
- localStorage（永続化）

## マイルストーン

### Phase 1（完了）
| # | 内容 | 状態 |
|---|------|------|
| 1-1 | MVP実装（直方体5種・配置・保存・読み込み） | ✅ 完了 |
| 1-2 | ドラッグ移動（床面Raycasting・掴んで置く操作） | ✅ 完了 |
| 1-3 | 視点プリセット（斜め・上・正面・横） | ✅ 完了 |
| 1-4 | 間取りプリセット（1R〜3LDK・展示・スタジオ・オフィス） | ✅ 完了 |
| 1-5 | グリッドスナップと床グリッド線の連動 | ✅ 完了 |

### Phase 2（未着手）
| # | 内容 | 優先度 | 備考 |
|---|------|--------|------|
| 2-1 | 部屋の形の自由変更（L字・T字・多角形） | 高 | THREE.Shape + ExtrudeGeometry + 2D頂点エディター |
| 2-2 | GLB/GLTFモデル読み込み | 中 | drei の useGLTF、モデル管理UI |
| 2-3 | PWA対応（Service Worker） | 中 | vite-plugin-pwa、オフラインキャッシュ |
| 2-4 | オブジェクトのドラッグ回転 | 低 | Y軸回転ハンドル or 数値入力で十分かも |
| 2-5 | 2Dトップビュー連動パネル | 低 | ミニマップ的なフロアプラン表示 |

## 関連部署
- 開発（engineering）: 実装担当
- 秘書室（secretary）: タスク管理・壁打ち

## メモ
- Phase1完了：2026-06-16
- 直方体プリミティブ5種（table/shelf/box/partition/chair）
- 間取りプリセット：住居4種・展示3種・スタジオ2種・オフィス3種
- Phase2の最優先は「部屋の形の自由変更」（ユーザー要望確認済み）
