/**
 * GLSL-слой «жидкого хрома».
 * Трёхоктавный симплекс-шум, анимированный по времени, смещает вершины
 * радиально (геометрия — сферическая, normalize(position) == normal).
 * Нормали пересчитываются конечными разностями: смещаем два касательных
 * соседа и восстанавливаем нормаль векторным произведением — поверхность
 * остаётся гладкой, хром даёт непрерывные «живые» блики.
 */
export const FIELD_GLSL = /* glsl */ `
uniform float uTime;
uniform float uAmp;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float noctaField(vec3 p) {
  vec3 q = p * 1.55 + vec3(uTime * 0.16, -uTime * 0.12, uTime * 0.10);
  float v = 0.0;
  v += 0.60 * snoise(q);
  v += 0.30 * snoise(q * 2.13 + vec3(5.2, 1.3, 2.8));
  v += 0.15 * snoise(q * 4.31 - vec3(1.7, 3.1, 0.6));
  return v;
}

vec3 noctaDisplace(vec3 p) {
  float f = noctaField(p);
  float breathe = sin(uTime * 0.45) * 0.018;
  return p + normalize(p) * (f * uAmp + breathe);
}
`;

/** Подменяет <beginnormal_vertex>: считает смещение и новую нормаль. */
export const DISPLACE_NORMAL_CHUNK = /* glsl */ `
vec3 noctaT = normalize(abs(normal.y) < 0.99
  ? cross(normal, vec3(0.0, 1.0, 0.0))
  : cross(normal, vec3(1.0, 0.0, 0.0)));
vec3 noctaB = normalize(cross(normal, noctaT));
float noctaEps = 0.06;
vec3 noctaP0 = noctaDisplace(position);
vec3 noctaPT = noctaDisplace(position + noctaT * noctaEps);
vec3 noctaPB = noctaDisplace(position + noctaB * noctaEps);
vec3 objectNormal = normalize(cross(noctaPT - noctaP0, noctaPB - noctaP0));
if (dot(objectNormal, normalize(position)) < 0.0) objectNormal = -objectNormal;
`;

/** Подменяет <begin_vertex> у меша (noctaP0 уже посчитан выше). */
export const DISPLACE_VERTEX_CHUNK = /* glsl */ `
vec3 transformed = noctaP0;
`;

/** Подменяет <begin_vertex> у линий-каркаса (нормали не нужны). */
export const DISPLACE_LINE_CHUNK = /* glsl */ `
vec3 transformed = noctaDisplace(position);
`;
