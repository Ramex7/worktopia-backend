const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        module: "readonly",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly"
      }
    },
    rules: {
      indent: "off",
      quotes: "off",
      semi: "off",
      "no-console": "off",
      "no-unused-vars": "off",
      "no-undef": "error",
      camelcase: "off",
      "comma-dangle": "off",
      "eol-last": "off"
    }
  }
];
