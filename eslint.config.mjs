import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import promise from "eslint-plugin-promise";
import cssModules from "eslint-plugin-css-modules";
import cypress from "eslint-plugin-cypress";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
{
    ignores: ["**/testing-scripts/"],
},
// Next.js configuration using FlatCompat - includes TypeScript and React Hooks automatically
...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
}),
{
    files: ["**/*.{js,jsx,ts,tsx}"],

    plugins: {
        prettier: fixupPluginRules(prettier),
        promise,
        "css-modules": fixupPluginRules(cssModules),
    },

    rules: {
        // Custom project rules that override Next.js defaults
        "no-console": "error",
        "react/display-name": "off",
        "react-hooks/exhaustive-deps": "off",
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "import/no-anonymous-default-export": "off",
        "import/no-named-as-default": "off",
        "css-modules/no-unused-class": "off",
        "@next/next/no-img-element": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-empty-interface": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            ignoreRestSiblings: true,
        }],

        "@typescript-eslint/no-namespace": ["error", {
            allowDeclarations: true,
        }],
    },
},
// Cypress-specific configuration
{
    files: ["cypress/**/*.{js,ts}", "**/*cy.{js,ts}"],
    plugins: {
        cypress: fixupPluginRules(cypress),
    },
    languageOptions: {
        globals: {
            ...cypress.configs.globals.globals,
        },
    },
    rules: {
        ...cypress.configs.recommended.rules,
    },
}];