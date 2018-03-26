import packageJson from '../package.json';
import {Support} from './common/Support';
import {Util} from './common/Util';
import {ResolveConfig} from './config/ResolveConfig';
import {DocBuilders} from './doc/DocBuilders';
import {DocDebug} from './doc/DocDebug';
import {DocPrinter} from './doc/DocPrinter';
import {DocUtils} from './doc/DocUtils';
import {AstToDoc} from './main/AstToDoc';
import {Comments} from './main/Comments';
import {Options} from './main/Options';
import {Parser} from './main/Parser';
import {SFASTType, SFCommentOptionsType, SFCommentsType} from './types/ast';
import {SFParserType} from './types/doc';


export class Starfire {
  static clearConfigCache = ResolveConfig.clearCache;
  static doc = {
    builders: DocBuilders,
    debug: DocDebug,
    printer: DocPrinter,
    utils: DocUtils
  };
  static getSupportInfo = Support.getSupportInfo;
  static resolveConfig = ResolveConfig.resolveConfig;
  static util = Util;
  static version = packageJson.version;

  static check(text, opts): boolean {
    try {
      const formatted = Starfire.format(text, opts);
      return formatted === text;
    } catch(e) {
      return false;
    }
  }

  static format(text, opts, addAlignmentSize?) {
    return Starfire.formatWithCursor(text, opts, addAlignmentSize).formatted;
  }

  static guessLineEnding(text: string): string {
    const index: number = text.indexOf('\n');

    if(index >= 0 && text.charAt(index - 1) === '\r') {
      return '\r\n';
    }

    return '\n';
  }

  static attachComments(text: string, ast: SFASTType, opts: SFCommentOptionsType): SFCommentsType[] {
    const astComments: SFCommentsType[] = ast.comments;

    if(astComments) {
      delete ast.comments;
      Comments.attach(astComments, ast, text, opts);
    }

    ast.tokens = [];
    opts.originalText = text.trimRight();

    return astComments;
  }

  static ensureAllCommentsPrinted(astComments: SFCommentsType[]) {
    if(!astComments) {
      return;
    }

    const isIgnored: boolean = !!astComments.find((comment) => comment.value.trim() === 'starfire-ignore');

    if(isIgnored) {
      // If there's a starfire-ignore, we're not printing that sub-tree so we
      // don't know if the comments was printed or not.
      return;
    }

    astComments.forEach((comment) => {
      if(!comment.printed) {
        throw new Error(`Comment "${comment.value.trim()}" was not printed. Please report this error!`);
      }

      delete comment.printed;
    });
  }

  static formatWithCursor(text: string, opts, addAlignmentSize?: number) {
    opts = Options.normalize(opts);
    const selectedParser: SFParserType = Parser.resolveParser(opts);
    const hasPragma: boolean = !selectedParser.hasPragma || selectedParser.hasPragma(text);

    if(opts.requirePragma && !hasPragma) {
      return {formatted: text};
    }

    const UTF8BOM = 0xfeff;
    const hasUnicodeBOM: boolean = text.charCodeAt(0) === UTF8BOM;

    if(hasUnicodeBOM) {
      text = text.substring(1);
    }

    if(
      opts.insertPragma &&
      opts.printer.insertPragma &&
      !hasPragma &&
      opts.rangeStart === 0 &&
      opts.rangeEnd === Infinity
    ) {
      text = opts.printer.insertPragma(text);
    }

    addAlignmentSize = addAlignmentSize || 0;

    const result = Parser.parse(text, opts);
    const ast = result.ast;
    text = result.text;
    const formattedRangeOnly = Starfire.formatRange(text, opts, ast);

    if(formattedRangeOnly) {
      return {formatted: formattedRangeOnly};
    }

    let cursorOffset: number;

    if(opts.cursorOffset >= 0) {
      const cursorNodeAndParents = Starfire.findNodeAtOffset(ast, opts.cursorOffset, opts);
      const cursorNode = cursorNodeAndParents.node;
      if(cursorNode) {
        cursorOffset = opts.cursorOffset - opts.locStart(cursorNode);
        opts.cursorNode = cursorNode;
      }
    }

    const astComments = Starfire.attachComments(text, ast, opts);
    const astDoc = AstToDoc.printAstToDoc(ast, opts, addAlignmentSize);
    opts.newLine = Starfire.guessLineEnding(text);
    const toStringResult = DocPrinter.printDocToString(astDoc, opts);
    let str = toStringResult.formatted;

    if(hasUnicodeBOM) {
      str = String.fromCharCode(UTF8BOM) + str;
    }

    const cursorOffsetResult = toStringResult.cursor;
    Starfire.ensureAllCommentsPrinted(astComments);

    // Remove extra leading indentation as well as the added indentation after last newline
    if(addAlignmentSize > 0) {
      return {formatted: str.trim() + opts.newLine};
    }

    if(cursorOffset !== undefined) {
      return {formatted: str, cursorOffset: cursorOffsetResult + cursorOffset};
    }

    return {formatted: str};
  }

  static findSiblingAncestors(startNodeAndParents, endNodeAndParents, opts) {
    let {node: resultStartNode} = startNodeAndParents;
    let {node: resultEndNode} = endNodeAndParents;

    if(resultStartNode === resultEndNode) {
      return {startNode: resultStartNode, endNode: resultEndNode};
    }

    for(const endParent of endNodeAndParents.parentNodes) {
      if(
        endParent.type !== 'Program' &&
        endParent.type !== 'File' &&
        opts.locStart(endParent) >= opts.locStart(startNodeAndParents.node)
      ) {
        resultEndNode = endParent;
      } else {
        break;
      }
    }

    for(const startParent of startNodeAndParents.parentNodes) {
      if(
        startParent.type !== 'Program' &&
        startParent.type !== 'File' &&
        opts.locEnd(startParent) <= opts.locEnd(endNodeAndParents.node)
      ) {
        resultStartNode = startParent;
      } else {
        break;
      }
    }

    return {startNode: resultStartNode, endNode: resultEndNode};
  }

  static findNodeAtOffset(node, offset, options, predicate?, parentNodes?) {
    predicate = predicate || (() => true);
    parentNodes = parentNodes || [];
    const start = options.locStart(node, options.locStart);
    const end = options.locEnd(node, options.locEnd);

    if(start <= offset && offset <= end) {
      for(const childNode of Comments.getSortedChildNodes(node, undefined, options)) {
        const childResult = Starfire.findNodeAtOffset(childNode, offset, options, predicate, [node]
          .concat(parentNodes));

        if(childResult) {
          return childResult;
        }
      }

      if(predicate(node)) {
        return {node, parentNodes};
      }
    }
  }

  // See https://www.ecma-international.org/ecma-262/5.1/#sec-A.5
  static isSourceElement(opts, node) {
    if(node === null) {
      return false;
    }

    // JS and JS like to avoid repetitions
    const jsSourceElements = [
      'FunctionDeclaration',
      'BlockStatement',
      'BreakStatement',
      'ContinueStatement',
      'DebuggerStatement',
      'DoWhileStatement',
      'EmptyStatement',
      'ExpressionStatement',
      'ForInStatement',
      'ForStatement',
      'IfStatement',
      'LabeledStatement',
      'ReturnStatement',
      'SwitchStatement',
      'ThrowStatement',
      'TryStatement',
      'VariableDeclaration',
      'WhileStatement',
      'WithStatement',
      'ClassDeclaration', // ES 2015
      'ImportDeclaration', // Module
      'ExportDefaultDeclaration', // Module
      'ExportNamedDeclaration', // Module
      'ExportAllDeclaration', // Module
      'TypeAlias', // Flow
      'InterfaceDeclaration', // Flow, TypeScript
      'TypeAliasDeclaration', // TypeScript
      'ExportAssignment', // TypeScript
      'ExportDeclaration' // TypeScript
    ];
    const jsonSourceElements = [
      'ObjectExpression',
      'ArrayExpression',
      'StringLiteral',
      'NumericLiteral',
      'BooleanLiteral',
      'NullLiteral'
    ];
    const graphqlSourceElements = [
      'OperationDefinition',
      'FragmentDefinition',
      'VariableDefinition',
      'TypeExtensionDefinition',
      'ObjectTypeDefinition',
      'FieldDefinition',
      'DirectiveDefinition',
      'EnumTypeDefinition',
      'EnumValueDefinition',
      'InputValueDefinition',
      'InputObjectTypeDefinition',
      'SchemaDefinition',
      'OperationTypeDefinition',
      'InterfaceTypeDefinition',
      'UnionTypeDefinition',
      'ScalarTypeDefinition'
    ];

    switch(opts.parser) {
      case 'flow':
      case 'babylon':
      case 'typescript':
        return jsSourceElements.indexOf(node.type) > -1;
      case 'json':
        return jsonSourceElements.indexOf(node.type) > -1;
      case 'graphql':
        return graphqlSourceElements.indexOf(node.kind) > -1;
      default:
        return false;
    }
  }

  static calculateRange(text, opts, ast) {
    // Contract the range so that it has non-whitespace characters at its endpoints.
    // This ensures we can format a range that doesn't end on a node.
    const rangeStringOrig = text.slice(opts.rangeStart, opts.rangeEnd);
    const startNonWhitespace = Math.max(opts.rangeStart + rangeStringOrig.search(/\S/), opts.rangeStart);
    let endNonWhitespace;

    for(endNonWhitespace = opts.rangeEnd; endNonWhitespace > opts.rangeStart; --endNonWhitespace) {
      if(text[endNonWhitespace - 1].match(/\S/)) {
        break;
      }
    }

    const startNodeAndParents = Starfire
      .findNodeAtOffset(ast, startNonWhitespace, opts, (node) => Starfire.isSourceElement(opts, node));
    const endNodeAndParents = Starfire
      .findNodeAtOffset(ast, endNonWhitespace, opts, (node) => Starfire.isSourceElement(opts, node));

    if(!startNodeAndParents || !endNodeAndParents) {
      return {rangeStart: 0, rangeEnd: 0};
    }

    const siblingAncestors = Starfire.findSiblingAncestors(startNodeAndParents, endNodeAndParents, opts);
    const startNode = siblingAncestors.startNode;
    const endNode = siblingAncestors.endNode;
    const rangeStart = Math.min(opts.locStart(startNode, opts.locStart), opts.locStart(endNode, opts.locStart));
    const rangeEnd = Math.max(opts.locEnd(startNode, opts.locEnd), opts.locEnd(endNode, opts.locEnd));

    return {rangeStart, rangeEnd};
  }

  static formatRange(text, opts, ast) {
    if(opts.rangeStart <= 0 && text.length <= opts.rangeEnd) {
      return;
    }

    const range = Starfire.calculateRange(text, opts, ast);
    const {rangeEnd, rangeStart} = range;
    const rangeString = text.slice(rangeStart, rangeEnd);

    // Try to extend the range backwards to the beginning of the line.
    // This is so we can detect indentation correctly and restore it.
    // Use `Math.min` since `lastIndexOf` returns 0 when `rangeStart` is 0
    const rangeStart2 = Math.min(rangeStart, text.lastIndexOf('\n', rangeStart) + 1);
    const indentString = text.slice(rangeStart2, rangeStart);
    const alignmentSize = Util.getAlignmentSize(indentString, opts.tabWidth);
    const formatOptions = {...opts, printWidth: opts.printWidth - alignmentSize, rangeEnd: Infinity, rangeStart: 0};
    const rangeFormatted = Starfire.format(rangeString, formatOptions, alignmentSize);

    // Since the range contracts to avoid trailing whitespace,
    // we need to remove the newline that was inserted by the `format` call.
    const rangeTrimmed = rangeFormatted.trimRight();

    return text.slice(0, rangeStart) + rangeTrimmed + text.slice(rangeEnd);
  }

  /* istanbul ignore next */
  static debug = {
    formatAST: (ast, opts) => {
      opts = Options.normalize(opts);
      const printDoc = AstToDoc.printAstToDoc(ast, opts);
      const str = DocPrinter.printDocToString(printDoc, opts);
      return str;
    },
    // Doesn't handle shebang for now
    formatDoc: (printDoc, opts = {}) => {
      const debug = DocDebug.printDocToDebug(printDoc);
      const str = Starfire.format(debug, opts);
      return str;
    },
    parse: (text, opts) => {
      opts = Options.normalize(opts);
      return Parser.parse(text, opts);
    },
    printDocToString: (printDoc, opts) => {
      opts = Options.normalize(opts);
      const str = DocPrinter.printDocToString(printDoc, opts);
      return str;
    },
    printToDoc: (text, opts) => {
      opts = Options.normalize(opts);
      const result = Parser.parse(text, opts);
      const ast = result.ast;
      text = result.text;
      Starfire.attachComments(text, ast, opts);
      return AstToDoc.printAstToDoc(ast, opts);
    }
  };
}
