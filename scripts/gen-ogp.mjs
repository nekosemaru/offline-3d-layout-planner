// OGP画像(1200x630px)をSVG→PNGで生成するスクリプト
// 実行: node scripts/gen-ogp.mjs

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1200, H = 630;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 背景グラデーション
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#0f0f1a');
bg.addColorStop(1, '#1a1a3a');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// グリッド線（床イメージ）
ctx.strokeStyle = 'rgba(68, 136, 255, 0.12)';
ctx.lineWidth = 1;
for (let x = 0; x <= W; x += 60) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
}
for (let y = 0; y <= H; y += 60) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}

// アクセントライン（上部）
const accent = ctx.createLinearGradient(0, 0, W, 0);
accent.addColorStop(0, 'transparent');
accent.addColorStop(0.3, '#4488ff');
accent.addColorStop(0.7, '#44aaff');
accent.addColorStop(1, 'transparent');
ctx.fillStyle = accent;
ctx.fillRect(0, 0, W, 3);

// 3Dボックスのシンプルなアイソメ図（装飾）
const drawBox = (cx, cy, w, h, d, color) => {
  const s = 0.5;
  ctx.fillStyle = color;
  // 上面
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + w * s, cy - h + w * s * 0.5);
  ctx.lineTo(cx + w * s - d * s, cy - h + (w + d) * s * 0.5);
  ctx.lineTo(cx - d * s, cy - h + d * s * 0.5);
  ctx.closePath();
  ctx.fill();
  // 左面
  ctx.fillStyle = color.replace(')', ', 0.7)').replace('rgb', 'rgba');
  ctx.beginPath();
  ctx.moveTo(cx, cy - h); ctx.lineTo(cx - d * s, cy - h + d * s * 0.5);
  ctx.lineTo(cx - d * s, cy + d * s * 0.5); ctx.lineTo(cx, cy);
  ctx.closePath(); ctx.fill();
  // 右面
  ctx.fillStyle = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
  ctx.beginPath();
  ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w * s, cy - h + w * s * 0.5);
  ctx.lineTo(cx + w * s, cy + w * s * 0.5); ctx.lineTo(cx, cy);
  ctx.closePath(); ctx.fill();
};

drawBox(920, 430, 140, 60, 100, 'rgb(68, 136, 255)');
drawBox(780, 380, 100, 100, 80, 'rgb(68, 200, 136)');
drawBox(1020, 380, 80, 140, 60, 'rgb(200, 100, 68)');
drawBox(870, 350, 60, 40, 140, 'rgb(180, 68, 200)');

// タイトル
ctx.fillStyle = '#e0e0f0';
ctx.font = 'bold 64px sans-serif';
ctx.fillText('3Dレイアウト', 80, 220);
ctx.fillText('プランナー', 80, 300);

// サブタイトル
ctx.fillStyle = '#8888aa';
ctx.font = '28px sans-serif';
ctx.fillText('ブラウザだけで動く無料の3Dレイアウトエディタ', 80, 370);

// バッジ
const badges = ['インストール不要', '無料'];
let bx = 80;
badges.forEach(text => {
  ctx.fillStyle = 'rgba(68, 136, 255, 0.2)';
  const tw = ctx.measureText(text).width;
  ctx.beginPath();
  ctx.roundRect(bx, 410, tw + 32, 40, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(68, 136, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#4488ff';
  ctx.font = '18px sans-serif';
  ctx.fillText(text, bx + 16, 436);
  bx += tw + 48;
});

// URL
ctx.fillStyle = '#4a4a6a';
ctx.font = '20px monospace';
ctx.fillText('nekosemaru.github.io/3d-layout-planner/', 80, 560);

const out = resolve(__dirname, '../public/ogp.png');
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('OGP image generated:', out);
