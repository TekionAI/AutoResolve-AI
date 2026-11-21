
module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true
  },

  ignorePatterns: [
    "dist/",
    "node_modules/",
    "*.config.js"
  ],

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended"
  ],

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },

  settings: {
    react: {
      version: "detect"
    }
  },

  rules: {
    "no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^[A-Z]",
        argsIgnorePattern: "^_"
      }
    ],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
};
