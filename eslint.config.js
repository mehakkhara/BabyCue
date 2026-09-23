// Minimal lint: catch names that are used but never defined or imported.
// This is the class of bug a merge-conflict resolution creates and the
// bundler does not see (a missing import compiles fine and crashes at
// runtime). Style rules are deliberately not enforced here.
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'public/**', 'server/node_modules/**'] },
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.{js,mjs}', 'server/**/*.js', 'vite.config.js'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
    },
  },
]
