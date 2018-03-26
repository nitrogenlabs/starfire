import path from 'path';

import {ConfigError} from '../common/errors/ConfigError';
import {LanguageJS} from '../languages/js';
import {SFParserType} from '../types/doc';
import {SFOptionsType} from '../types/options';

const {locStart, locEnd} = LanguageJS;

export class Parser {
  static getParsers(options: SFOptionsType) {
    return options.plugins.reduce((parsers, plugin) => ({...parsers, ...plugin.parsers}), {});
  }

  static resolveParser(opts, parsers?): SFParserType {
    parsers = parsers || Parser.getParsers(opts);

    if(typeof opts.parser === 'function') {
      // Custom parser API always works with JavaScript.
      return {astFormat: 'estree', locEnd, locStart, parse: opts.parser};
    }

    if(typeof opts.parser === 'string') {
      if(parsers.hasOwnProperty(opts.parser)) {
        return parsers[opts.parser];
      }
      try {
        return {astFormat: 'estree', locEnd, locStart, parse: require(path.resolve(process.cwd(), opts.parser))};
      } catch(err) {
        /* istanbul ignore next */
        throw new ConfigError(`Couldn't resolve parser "${opts.parser}"`);
      }
    }

    /* istanbul ignore next */
    return parsers.typescript;
  }

  static parse(text, opts) {
    const parsers = Parser.getParsers(opts);

    // Copy the "parse" function from parser to a new object whose values are
    // functions. Use defineProperty()/getOwnPropertyDescriptor() such that we
    // don't invoke the parser.parse getters.
    const parsersForCustomParserApi = Object.keys(parsers).reduce(
      (object, parserName) =>
        Object.defineProperty(
          object,
          parserName,
          Object.getOwnPropertyDescriptor(parsers[parserName], 'parse')
        ),
      {}
    );

    const parser = Parser.resolveParser(opts, parsers);

    try {
      if(parser.preprocess) {
        text = parser.preprocess(text, opts);
      }

      return {ast: parser.parse(text, parsersForCustomParserApi, opts), text};
    } catch(error) {
      const loc = error.loc;

      if(loc) {
        const codeFrame = require('@babel/code-frame');
        error.codeFrame = codeFrame.codeFrameColumns(text, loc, {
          highlightCode: true
        });
        error.message += '\n' + error.codeFrame;
        throw error;
      }

      /* istanbul ignore next */
      throw error.stack;
    }
  }
}
