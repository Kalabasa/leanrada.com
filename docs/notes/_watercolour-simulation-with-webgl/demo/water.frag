precision mediump float;
varying vec2 vTexCoord;
uniform vec2 texelSize;
uniform sampler2D waterTex;

vec3 blur(sampler2D tex, vec2 uv) {
  #if (passIndex <= 0)
    const vec2 blurDirection = vec2(1.0, 0.0);
  #else
    const vec2 blurDirection = vec2(0.0, 1.0);
  #endif

  const int sampleCount = 10;

  float offsets[sampleCount];
  offsets[0] = -8.370865;
  offsets[1] = -6.400317;
  offsets[2] = -4.430505;
  offsets[3] = -2.461218;
  offsets[4] = -0.492228;
  offsets[5] = 1.476701;
  offsets[6] = 3.445809;
  offsets[7] = 5.415332;
  offsets[8] = 7.385486;
  offsets[9] = 9.0;

  float weights[sampleCount];
  weights[0] = 0.022008;
  weights[1] = 0.055137;
  weights[2] = 0.108118;
  weights[3] = 0.165955;
  weights[4] = 0.199407;
  weights[5] = 0.187567;
  weights[6] = 0.138114;
  weights[7] = 0.079610;
  weights[8] = 0.035918;
  weights[9] = 0.008162;

  vec3 outColor;
  for (int i = 0; i < sampleCount; ++i) {
    vec2 offset = blurDirection * offsets[i] * texelSize;
    float weight = weights[i];
    outColor += texture2D(tex, uv + offset).rgb * weight;
  }
  return outColor;
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  #if defined(blurWater)
    vec4 waterColor = vec4(blur(waterTex, uv), 1.0);
  #else
    vec4 waterColor = texture2D(waterTex, uv);
  #endif

  gl_FragColor = waterColor;
}
