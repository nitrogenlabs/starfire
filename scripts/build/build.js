#!/usr/bin/env node


const path = require('path');
const pkg = require('../../package.json');
const parsers = require('./parsers');
const shell = require('shelljs');

const rootDir = path.join(__dirname, '..', '..');

process.env.PATH += path.delimiter + path.join(rootDir, 'node_modules', '.bin');

function pipe(string) {
  return new shell.ShellString(string);
}

shell.set('-e');
shell.cd(rootDir);

shell.rm('-Rf', 'lib/');

// --- Lib ---

shell.exec('rollup -c scripts/build/rollup.index.config.js');

shell.exec('rollup -c scripts/build/rollup.bin.config.js');
shell.chmod('+x', './lib/bin-starfire.js');

shell.exec('rollup -c scripts/build/rollup.third-party.config.js');

for(const parser of parsers) {
  if(parser.endsWith('css')) {
    continue;
  }
  shell.exec(
    `rollup -c scripts/build/rollup.parser.config.js --environment parser:${parser}`
  );
  if(parser.endsWith('glimmer')) {
    shell.exec(
      'node_modules/babel-cli/bin/babel.js lib/ParserGlimmer.js --out-file lib/ParserGlimmer.js --presets=es2015'
    );
  }
}

shell.echo('\nsrc/languages/css/ParserCSS.ts → lib/ParserCSS.js');
// PostCSS has dependency cycles and won't work correctly with rollup :(
shell.exec(
  'webpack --hide-modules src/languages/css/ParserCSS.ts lib/ParserCSS.js'
);
// Prepend module.exports =
const content = shell.cat('lib/ParserCSS.js').stdout;
pipe(`module.exports = ${content}`).to('lib/ParserCSS.js');

shell.echo();

// --- Misc ---

shell.echo('Remove eval');
shell.sed(
  '-i',
  /eval\("require"\)/,
  'require',
  'lib/index.js',
  'lib/bin-starfire.js'
);

shell.echo('Copy package.json');
const pkgWithoutDependencies = Object.assign({}, pkg);
pkgWithoutDependencies.bin = './bin-starfire.js';
delete pkgWithoutDependencies.dependencies;
pkgWithoutDependencies.scripts = {
  prepublishOnly:
    'node -e "assert.equal(require(\'.\').version, require(\'..\').version)"'
};
pipe(JSON.stringify(pkgWithoutDependencies, null, 2)).to('lib/package.json');

shell.echo('Copy README.md');
shell.cp('README.md', 'lib/README.md');

shell.echo('Done!');
shell.echo();
shell.echo('How to test against production:');
shell.echo('  1) yarn test:prod');
shell.echo();
shell.echo('How to publish:');
shell.echo('  1) IMPORTANT!!! Go to lib/');
shell.echo('  2) npm publish');
