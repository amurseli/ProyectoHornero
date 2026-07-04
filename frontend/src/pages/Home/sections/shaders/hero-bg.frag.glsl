precision mediump float;

// Frecuencia del ruido: valores mayores = ondas más pequeñas. Se puede sobrescribir
// inyectando "#define U_SCALE <n>" antes de este source (ver ShaderBackground). Sin
// override, mantiene el look original del hero de inicio.
#ifndef U_SCALE
#define U_SCALE 1.0
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_mousepos;

const vec3 BG   = vec3(0.97, 0.93, 0.88);
const vec3 WARM = vec3(0.93, 0.52, 0.32);
const vec3 GOLD = vec3(0.99, 0.82, 0.44);
const vec3 COOL = vec3(0.62, 0.76, 0.97);

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec2 fade(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlin(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i  = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

float pnoise(vec2 p) {
  return perlin(p) * 0.5 + 0.5;
}

float fbm(vec2 p) {
  return pnoise(p)       * 0.500
       + pnoise(p * 2.0) * 0.250
       + pnoise(p * 4.0) * 0.125
       + pnoise(p * 8.0) * 0.0625;
}

void main() {
  vec2 fragUv = gl_FragCoord.xy / u_resolution.xy;

  vec2 uv = fragUv;
  uv.x *= u_resolution.x / u_resolution.y;
  uv *= U_SCALE;

  float t = u_time * 0.07;

  vec2 mouseUv  = u_mousepos.xy / u_resolution.xy;
  vec2 toMouse  = (fragUv - mouseUv) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float mDist   = length(toMouse);
  float mActive = step(0.0, u_mousepos.x);
  float mStr    = exp(-mDist * mDist * 5.5) * mActive * 0.02;
  vec2  mOffset = normalize(toMouse + vec2(0.001)) * mStr;

  vec2 wuv = uv + mOffset;

  vec2 q = vec2(
    fbm(wuv + vec2(0.00, 0.00) + t),
    fbm(wuv + vec2(5.20, 1.30) + t * 0.9)
  );

  vec2 r = vec2(
    fbm(wuv + 2.8 * q + vec2(1.70, 9.20) + t * 0.7),
    fbm(wuv + 2.8 * q + vec2(8.30, 2.80) + t * 0.5)
  );

  float f = fbm(wuv + 2.8 * r);

  vec3 color = BG;
  color = mix(color, WARM, smoothstep(0.20, 0.55, f) * 0.75);
  color = mix(color, GOLD, smoothstep(0.52, 0.70, f) * 0.60);
  color = mix(color, COOL, smoothstep(0.25, 0.48, q.x) * 0.40);

  color = mix(color, BG, 0.38);

  gl_FragColor = vec4(color, 1.0);
}