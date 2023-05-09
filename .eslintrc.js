module.exports = {
  ignorePatterns: [
    "out/site/archive/v3/**",
    "out/site/google*.html",
    "out/site/projects/", // redirects
    "out/site/**/*.html/index.html", // redirects
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
