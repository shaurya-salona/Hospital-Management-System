module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-func-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-obj-calls': 'error',
    'no-sparse-arrays': 'error',
    'no-unreachable': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    'curly': 'warn',
    'eqeqeq': 'warn',
    'no-alert': 'warn',
    'no-caller': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-fallthrough': 'error',
    'no-floating-decimal': 'warn',
    'no-implied-eval': 'error',
    'no-lone-blocks': 'warn',
    'no-loop-func': 'error',
    'no-multi-spaces': 'warn',
    'no-multi-str': 'warn',
    'no-new': 'warn',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'warn',
    'no-proto': 'error',
    'no-return-assign': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-with': 'error',
    'radix': 'warn',
    'vars-on-top': 'warn',
    'wrap-iife': 'error',
    'yoda': 'warn',
    'indent': ['warn', 2],
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'never'],
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn',
    'no-multiple-empty-lines': ['warn', { 'max': 2 }],
    'space-before-blocks': 'warn',
    'keyword-spacing': 'warn',
    'space-infix-ops': 'warn',
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
    'comma-spacing': 'warn',
    'key-spacing': 'warn',
    'space-before-function-paren': ['warn', 'never']
  },
  globals: {
    'Chart': 'readonly',
    'io': 'readonly',
    'authService': 'readonly',
    'dashboardCommon': 'readonly',
    'adminDashboard': 'writable'
  },
  overrides: [
    {
      files: ['*.html'],
      rules: {
        'no-unused-vars': 'off',
        'no-undef': 'off'
      }
    },
    {
      files: ['*.css'],
      rules: {
        'no-unused-vars': 'off',
        'no-undef': 'off'
      }
    }
  ]
};


