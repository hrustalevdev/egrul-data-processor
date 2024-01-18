module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: true,
    },
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    'import/no-commonjs': 'off',
    'import/no-deprecated': 'warn',
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
        ts: 'never',
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          orderImportKind: 'desc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
        warnOnUnassignedImports: true,
        groups: [
          ['builtin', 'external'],
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
        ],
      },
    ],
    'import/first': 'error',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/newline-after-import': 'error',
    'import/no-useless-path-segments': 'error',
  },
};
