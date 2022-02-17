module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'no-prototype-builtins': 'off',
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/explicit-function-return-type': ['error'],
    'capitalized-comments': [
      'error',
      'always',
      {
        ignorePattern: 'pragma|ignored',
        ignoreInlineComments: true,
      },
    ],
    semi: ['error', 'always'],
    'no-console': [
      'error',
      {
        allow: ['warn', 'error'],
      },
    ],
    'no-debugger': 'error',
    'no-unreachable': 'error',
    'consistent-return': 'error',
    curly: 'error',
    eqeqeq: 'error',
    'multiline-comment-style': ['error', 'starred-block'],
    'no-iterator': 'error',
    'import/no-cycle': [
      2,
      {
        maxDepth: 1,
      },
    ],
    quotes: ['error', 'single'],
  },
};
