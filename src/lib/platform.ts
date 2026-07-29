import type Lenis from 'lenis';

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const low = (navigator.hardwareConcurrency ?? 8) < 4 || window.innerWidth < 900;
const mobile = window.innerWidth < 768;

export const platform = {
  reduced,
  low,
  mobile,
  webgl: detectWebGL(),
};

/** Мутируемый общий стейт без ре-рендеров: скролл-прогресс деформации,
 *  готовность первого кадра WebGL, готовность шрифтов, инстанс lenis. */
export const shared = {
  deform: 0,
  firstFrame: false,
  fontsReady: false,
  lenis: null as Lenis | null,
  /** мгновенная скорость скролла (px/кадр из lenis) — корм для хрома */
  vel: 0,
};
