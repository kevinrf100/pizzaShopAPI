import rocketseatNode from '@rocketseat/eslint-config/node.mjs'
import drizzleLint from 'eslint-plugin-drizzle'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  ...rocketseatNode,
  ...tseslint.configs.recommended,
  ...compat.extends('plugin:drizzle/recommended'),
  {
    plugins: {
      drizzle: drizzleLint,
    },
  },
]
