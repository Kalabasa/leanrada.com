precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D waterTex;

// todo uniform passIndex (in a two-pass process)

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  #if defined(blurWater)
    vec4 waterColor = blur(waterTex, uv);
  #else
    vec4 waterColor = texture2D(waterTex, uv);
  #endif

  gl_FragColor = waterColor;
}
