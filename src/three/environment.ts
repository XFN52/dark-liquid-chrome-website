import * as THREE from 'three';

/**
 * Процедурное окружение для хрома — 80% качества картинки.
 * CanvasTexture 1024×512, equirect:
 *  1. вертикальный градиент --panel (верх) → --abyss (низ);
 *  2. 4 «софтбокса» — размытые вертикальные полосы цветами --glow и --chrome
 *     под разными углами (мягкость по ширине — градиент альфы, по длине —
 *     destination-in маска, работает везде, без ctx.filter);
 *  3. широкая горизонтальная лента — даёт характерный хромовый «пояс»;
 *  4. одно тёплое пятно очень низкой яркости — чтобы отражения не были
 *     стерильно холодными;
 *  5. слабый верхний залив.
 */

let cachedCanvas: HTMLCanvasElement | null = null;

function makeSoftbox(w: number, h: number, rgba: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  const x = c.getContext('2d')!;
  // мягкость поперёк полосы
  const gw = x.createLinearGradient(0, 0, w, 0);
  gw.addColorStop(0, 'rgba(0,0,0,0)');
  gw.addColorStop(0.5, rgba);
  gw.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gw;
  x.fillRect(0, 0, w, h);
  // затухание к торцам полосы
  x.globalCompositeOperation = 'destination-in';
  const gh = x.createLinearGradient(0, 0, 0, h);
  gh.addColorStop(0, 'rgba(255,255,255,0)');
  gh.addColorStop(0.20, 'rgba(255,255,255,1)');
  gh.addColorStop(0.80, 'rgba(255,255,255,1)');
  gh.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gh;
  x.fillRect(0, 0, w, h);
  return c;
}

function paintSoftbox(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  angleDeg: number, rgba: string,
) {
  const box = makeSoftbox(w, h, rgba);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.drawImage(box, -w / 2, -h / 2);
  ctx.restore();
}

function getEnvCanvas(): HTMLCanvasElement {
  if (cachedCanvas) return cachedCanvas;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  // 1 — базовый вертикальный градиент
  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#0E1118');
  bg.addColorStop(0.5, '#06070B');
  bg.addColorStop(1, '#05060A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 512);

  // 5 — слабый верхний залив
  let spot = ctx.createRadialGradient(512, 30, 0, 512, 30, 420);
  spot.addColorStop(0, 'rgba(237,240,246,0.055)');
  spot.addColorStop(1, 'rgba(237,240,246,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, 1024, 512);

  // 3 — горизонтальная хромовая лента
  paintSoftbox(ctx, 512, 316, 1420, 52, 0, 'rgba(201,212,232,0.10)');

  // 2 — софтбоксы
  paintSoftbox(ctx, 190, 250, 120, 660, -18, 'rgba(59,91,255,0.80)');  // --glow, левый
  paintSoftbox(ctx, 445, 240, 72, 700, 12, 'rgba(201,212,232,0.95)');  // --chrome, главный клин
  paintSoftbox(ctx, 700, 260, 150, 640, 35, 'rgba(59,91,255,0.45)');   // --glow, правый широкий
  paintSoftbox(ctx, 930, 230, 88, 600, -30, 'rgba(237,240,246,0.60)'); // белый узкий

  // 4 — тёплое пятно, очень низкая яркость
  spot = ctx.createRadialGradient(640, 430, 0, 640, 430, 250);
  spot.addColorStop(0, 'rgba(255,176,120,0.07)');
  spot.addColorStop(1, 'rgba(255,176,120,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, 1024, 512);

  cachedCanvas = c;
  return c;
}

/** Создаёт текстуру окружения для конкретного WebGL-контекста. */
export function createEnvironmentTexture(): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(getEnvCanvas());
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
