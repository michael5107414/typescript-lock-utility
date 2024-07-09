import babelEslintParser from "@babel/eslint-parser";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sortClassMembers from "eslint-plugin-sort-class-members";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

const sharedConfigArray = [
  {
    languageOptions: {
      parser: babelEslintParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { sortClassMembers, "simple-import-sort": simpleImportSort },
    rules: {
      eqeqeq: "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  sortClassMembers.configs["flat/recommended"],
];

export default typescriptEslint.config(
  {
    ignores: ["coverage/*", "dist/*", "node_modules/*"],
  },
  {
    files: ["*.{js,mjs,ts,mts}", "src/**/*.{js,mjs,ts,mts}"],
    extends: sharedConfigArray,
    languageOptions: {
      parserOptions: {
        globals: {
          ...globals.node,
          ...globals.es2022,
        },
      },
    },
  },
  {
    files: ["__tests__/**/*.{js,mjs,ts,mts}"],
    extends: sharedConfigArray,
    languageOptions: {
      parserOptions: {
        globals: {
          ...globals.jest,
        },
      },
    },
  },
  eslintConfigPrettier,
);
