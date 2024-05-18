precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D waterTex;
uniform sampler2D paintTex;

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  vec4 paintColor = texture2D(paintTex, uv);
  gl_FragColor = paintColor;
}
