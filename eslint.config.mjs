import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import {defineConfig} from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: {globals: {...globals.browser, ...globals.node}},
        plugins: {js, 'simple-import-sort': simpleImportSort,},
        extends: ["js/recommended"],
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
        },
    },
    tseslint.configs.recommended,
    {
        files: ["**/*.spec.{ts,js}", "**/*.test.{ts,js}", "**/test/**/*.{ts,js}", "**/tests/**/*.{ts,js}"],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-this-alias': 'off',
        },
    },
]);
