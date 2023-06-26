module.exports = {
  ignorePatterns: [
    "out/site/archive/v*/**",
    "out/site/google*.html",
    "out/site/projects/", // redirects
    "out/site/works/", // redirects
    "out/site/**/*.html/index.html", // redirects
    "out/site/wares/canva-photo-editor/index.html", // redirect
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
