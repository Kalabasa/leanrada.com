// Updates a moisture map based on an input flow field
precision mediump float;
varying vec2 vTexCoord;
uniform vec2 texelSize;
uniform sampler2D waterTex;

#if defined(blurWater)
  void boxBlurFlow(in vec2 uv, in vec2 blurDirection, inout vec3 flowVec) {
    flowVec.rg += blurDirection * (
      texture2D(waterTex, uv - blurDirection * texelSize).r
      - texture2D(waterTex, uv + blurDirection * texelSize).r);
  }
#endif

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  #if defined(blurWater)
    vec3 flowVec = vec3(0.5, 0.5, 0.5);
    boxBlurFlow(uv, vec2(1.0, 0.0), flowVec);
    boxBlurFlow(uv, vec2(0.0, 1.0), flowVec);
  #else
    vec3 flowVec = vec3(0.5, 0.5, 0.5);
  #endif

  float waterVal = texture2D(waterTex, uv).r;

  gl_FragColor = vec4(waterVal, waterVal, waterVal, 1.0);
}
