// Outputs a flow field (displacement map) based on an input moisture map
precision mediump float;
varying vec2 vTexCoord;
uniform vec2 texelSize;
uniform sampler2D waterTex;

vec3 gaussianBlurFlow(vec2 uv) {
  #if (passIndex <= 0)
    const vec2 blurDirection = vec2(1.0, 0.0);
  #else
    const vec2 blurDirection = vec2(0.0, 1.0);
  #endif

  const int sampleCount = 5;

  float offsets[sampleCount];
  offsets[0] = -3.29793480;
  offsets[1] = -1.40919987;
  offsets[2] = 0.46943377;
  offsets[3] = 2.35156440;
  offsets[4] = 4.00000000;

  float weights[sampleCount];
  weights[0] = 0.09576679;
  weights[1] = 0.30305319;
  weights[2] = 0.38140387;
  weights[3] = 0.19124386;
  weights[4] = 0.02853226;

  float waterHere = texture2D(waterTex, uv).r;

  vec3 outColor;
  for (int i = 0; i < sampleCount; ++i) {
    vec2 offset = blurDirection * offsets[i] * texelSize;
    float waterThere = texture2D(waterTex, uv + offset).r;

    // todo? derivative / edge detection
  }
  return outColor;
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  #if defined(blurWater)
    vec3 flow = gaussianBlurFlow(uv);
  #else
    vec3 flow = vec3(0.5, 0.5, 1.0)
  #endif

  // Flow field definition:
  //   With flow = (fx / m + 0.5, fy / m + 0.5, a) at position (x, y),
  //   the pixel (x, y) receives material of amount a from pixel (x + fx, y + fy).
  gl_FragColor = vec4(flow, 1.0);
}
