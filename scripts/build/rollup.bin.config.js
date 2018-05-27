import * as path from 'path';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';

import baseConfig from './rollup.base.config.js';

export default Object.assign(baseConfig, {
  input: 'bin/starfire.js',
  output: {
    format: 'cjs',
    lib: 'lib/bin-starfire.js',
    paths: {
      [path.resolve('src/common/third-party.js')]: './third-party'
    }
  },
  banner: '#!/usr/bin/env node',
  plugins: [
    replace({
      '#!/usr/bin/env node': '',
      // See comment in jest.config.js
      'require(\'graceful-fs\')': 'require(\'fs\')'
    }),
    json(),
    resolve({
      preferBuiltins: true,
      extensions: ['.js', '.json']
    }),
    commonjs()
  ],
  external: [
    'fs',
    'readline',
    'path',
    'module',
    'assert',
    'util',
    'events',
    path.resolve('src/common/third-party.js')
  ]
});
