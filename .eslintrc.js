module.exports = {
  ignorePatterns: [
    "out/site/archive/v3/**",
    "out/site/google*.html",
    "out/site/**/*.html/index.html",
  ],
  rules: {
    "@html-eslint/require-lang": "error",
    "@html-eslint/require-img-alt": "error",
  },
  plugins: ["@html-eslint"],
  overrides: [
    {
      files: ["*.html"],
      parser: "@html-eslint/parser",
    },
  ],
};
