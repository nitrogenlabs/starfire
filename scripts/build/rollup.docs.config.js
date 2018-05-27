import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';

import baseConfig from './rollup.base.config.js';

const filePath = process.env.filePath;
const filename = filePath.replace(/.+\//, '');
const basename = filename.replace(/\..+/, '');

export default Object.assign(baseConfig, {
  input: `node_modules/starfire/${filePath}`,
  output: {
    format: 'iife',
    lib: `website/static/lib/${filename}`
  },
  plugins: [json(), resolve({preferBuiltins: true}), commonjs(), globals()],
  useStrict: false,
  moduleName: basename.replace(/.+-/, ''),
  external: ['assert', 'fs', 'module']
});
