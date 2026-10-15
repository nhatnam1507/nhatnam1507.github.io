// GLSL for the morphing particle cloud.

export const vertex = /* glsl */ `
  attribute vec3 aPosB;
  attribute float aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uAspect;
  varying float vAlpha;
  varying float vRand;
  varying float vDepth;

  void main() {
    float delay = aRand * 0.4;
    float m = smoothstep(delay, delay + 0.6, uMix);
    vec3 p = mix(position, aPosB, m);

    // explode outward mid-transition, then settle
    float burst = sin(m * 3.14159265);
    p += normalize(p + vec3(0.0001)) * burst * (0.25 + aRand * 0.9);

    // idle shimmer
    p += 0.025 * vec3(
      sin(uTime * 1.3 + aRand * 40.0),
      cos(uTime * 1.1 + aRand * 31.0),
      sin(uTime * 0.9 + aRand * 23.0));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // push particles away from the pointer (screen space)
    vec2 ndc = clip.xy / clip.w;
    vec2 dir = (ndc - uMouse) * vec2(uAspect, 1.0);
    float d = length(dir);
    float f = smoothstep(0.32, 0.0, d);
    mv.xy += normalize(dir + 0.0001) * f * 0.55;
    clip = projectionMatrix * mv;

    gl_Position = clip;
    gl_PointSize = uSize * uPixelRatio * (0.45 + aRand * 0.9) * (1.0 + f * 1.5) / -mv.z;
    vAlpha = 0.35 + 0.65 * aRand + f;
    vRand = aRand;
    vDepth = clamp((-mv.z - 3.0) / 6.0, 0.0, 1.0);
  }
`;

export const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vRand;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float disc = smoothstep(0.5, 0.0, d);
    disc = pow(disc, 1.6);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.2, 0.9, vRand));
    col = mix(col, uColorC, step(0.965, vRand));
    float a = disc * vAlpha * uOpacity * (1.0 - vDepth * 0.65);
    gl_FragColor = vec4(col, a);
  }
`;
