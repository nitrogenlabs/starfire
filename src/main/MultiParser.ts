import {AstToDoc} from './AstToDoc';
import {Comments} from './Comments';
import {OptionsNormalizer} from './OptionsNormalizer';
import {Parser} from './Parser';

export class MultiParser {
  static printSubtree(path, print, options) {
    if(options.printer.embed) {
      return options.printer.embed(
        path,
        print,
        (text, partialNextOptions) => MultiParser.textToDoc(text, partialNextOptions, options),
        options
      );
    }
  }

  static textToDoc(text, partialNextOptions, parentOptions) {
    const nextOptions = OptionsNormalizer.normalizeOptions({
      ...parentOptions,
      ...partialNextOptions,
      originalText: text,
      parentParser: parentOptions.parser
    }, {passThrough: true, inferParser: false});

    const result = Parser.parse(text, nextOptions);
    const ast = result.ast;
    text = result.text;

    const astComments = ast.comments;
    delete ast.comments;
    Comments.attach(astComments, ast, text, nextOptions);
    return AstToDoc.printAstToDoc(ast, nextOptions);
  }
}
