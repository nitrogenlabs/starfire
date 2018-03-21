import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';

import baseConfig from './rollup.base.config.js';

const filepath = process.env.filepath;
const filename = filepath.replace(/.+\//, "");
const basename = filename.replace(/\..+/, "");

export default Object.assign(baseConfig, {
  entry: "node_modules/starfire/" + filepath,
  dest: "website/static/lib/" + filename,
  format: "iife",
  plugins: [json(), resolve({preferBuiltins: true}), commonjs(), globals()],
  useStrict: false,
  moduleName: basename.replace(/.+-/, ""),
  external: ["assert", "fs", "module"]
});
