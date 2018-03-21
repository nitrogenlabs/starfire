import packageJson from '../package.json';
import {getSupportInfo} from './common/support';
import privateUtil from './common/util';
import sharedUtil from './common/util-shared';
import config from './config/resolve-config';
import doc from './doc';
import printAstToDoc from './main/ast-to-doc';
import comments from './main/comments';
import {normalize as normalizeOptions} from './main/options';
import parser from './main/parser';

const {printDocToString} = doc.printer;
const {printDocToDebug} = doc.debug;
const {version} = packageJson;

const guessLineEnding = (text) => {
  const index = text.indexOf('\n');

  if(index >= 0 && text.charAt(index - 1) === '\r') {
    return '\r\n';
  }

  return '\n';
};

const attachComments = (text, ast, opts) => {
  const astComments = ast.comments;
  if(astComments) {
    delete ast.comments;
    comments.attach(astComments, ast, text, opts);
  }
  ast.tokens = [];
  opts.originalText = text.trimRight();
  return astComments;
};

const ensureAllCommentsPrinted = (astComments) => {
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
};

const formatWithCursor = (text, opts, addAlignmentSize?) => {
  const selectedParser = parser.resolveParser(opts);
  const hasPragma = !selectedParser.hasPragma || selectedParser.hasPragma(text);

  if(opts.requirePragma && !hasPragma) {
    return {formatted: text};
  }

  const UTF8BOM = 0xfeff;
  const hasUnicodeBOM = text.charCodeAt(0) === UTF8BOM;

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

  const result = parser.parse(text, opts);
  const ast = result.ast;
  text = result.text;
  const formattedRangeOnly = formatRange(text, opts, ast);

  if(formattedRangeOnly) {
    return {formatted: formattedRangeOnly};
  }

  let cursorOffset;
  if(opts.cursorOffset >= 0) {
    const cursorNodeAndParents = findNodeAtOffset(ast, opts.cursorOffset, opts);
    const cursorNode = cursorNodeAndParents.node;
    if(cursorNode) {
      cursorOffset = opts.cursorOffset - opts.locStart(cursorNode);
      opts.cursorNode = cursorNode;
    }
  }

  const astComments = attachComments(text, ast, opts);
  const astDoc = printAstToDoc(ast, opts, addAlignmentSize);
  opts.newLine = guessLineEnding(text);
  const toStringResult = printDocToString(astDoc, opts);
  let str = toStringResult.formatted;

  if(hasUnicodeBOM) {
    str = String.fromCharCode(UTF8BOM) + str;
  }

  const cursorOffsetResult = toStringResult.cursor;
  ensureAllCommentsPrinted(astComments);

  // Remove extra leading indentation as well as the added indentation after last newline
  if(addAlignmentSize > 0) {
    return {formatted: str.trim() + opts.newLine};
  }

  if(cursorOffset !== undefined) {
    return {formatted: str, cursorOffset: cursorOffsetResult + cursorOffset};
  }

  return {formatted: str};
};

const format = (text, opts, addAlignmentSize?) => {
  return formatWithCursor(text, opts, addAlignmentSize).formatted;
};

const findSiblingAncestors = (startNodeAndParents, endNodeAndParents, opts) => {
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
};

const findNodeAtOffset = (node, offset, options, predicate?, parentNodes?) => {
  predicate = predicate || (() => true);
  parentNodes = parentNodes || [];
  const start = options.locStart(node, options.locStart);
  const end = options.locEnd(node, options.locEnd);

  if(start <= offset && offset <= end) {
    for(const childNode of comments.getSortedChildNodes(node, undefined, options)) {
      const childResult = findNodeAtOffset(childNode, offset, options, predicate, [node].concat(parentNodes));

      if(childResult) {
        return childResult;
      }
    }

    if(predicate(node)) {
      return {node, parentNodes};
    }
  }
};

// See https://www.ecma-international.org/ecma-262/5.1/#sec-A.5
const isSourceElement = (opts, node) => {
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
      return jsSourceElements.indexOf(node.type) > -1;
    case 'babylon':
      return jsSourceElements.indexOf(node.type) > -1;
    case 'typescript':
      return jsSourceElements.indexOf(node.type) > -1;
    case 'json':
      return jsonSourceElements.indexOf(node.type) > -1;
    case 'graphql':
      return graphqlSourceElements.indexOf(node.kind) > -1;
    default:
      return false;
  }
};

const calculateRange = (text, opts, ast) => {
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

  const startNodeAndParents = findNodeAtOffset(ast, startNonWhitespace, opts, (node) => isSourceElement(opts, node));
  const endNodeAndParents = findNodeAtOffset(ast, endNonWhitespace, opts, (node) => isSourceElement(opts, node));

  if(!startNodeAndParents || !endNodeAndParents) {
    return {rangeStart: 0, rangeEnd: 0};
  }

  const siblingAncestors = findSiblingAncestors(
    startNodeAndParents,
    endNodeAndParents,
    opts
  );
  const startNode = siblingAncestors.startNode;
  const endNode = siblingAncestors.endNode;
  const rangeStart = Math.min(
    opts.locStart(startNode, opts.locStart),
    opts.locStart(endNode, opts.locStart)
  );
  const rangeEnd = Math.max(
    opts.locEnd(startNode, opts.locEnd),
    opts.locEnd(endNode, opts.locEnd)
  );

  return {rangeStart, rangeEnd};
};

const formatRange = (text, opts, ast) => {
  if(opts.rangeStart <= 0 && text.length <= opts.rangeEnd) {
    return;
  }

  const range = calculateRange(text, opts, ast);
  const rangeStart = range.rangeStart;
  const rangeEnd = range.rangeEnd;
  const rangeString = text.slice(rangeStart, rangeEnd);

  // Try to extend the range backwards to the beginning of the line.
  // This is so we can detect indentation correctly and restore it.
  // Use `Math.min` since `lastIndexOf` returns 0 when `rangeStart` is 0
  const rangeStart2 = Math.min(rangeStart, text.lastIndexOf('\n', rangeStart) + 1);
  const indentString = text.slice(rangeStart2, rangeStart);
  const alignmentSize = privateUtil.getAlignmentSize(indentString, opts.tabWidth);
  const formatOptions = {...opts, printWidth: opts.printWidth - alignmentSize, rangeEnd: Infinity, rangeStart: 0};
  const rangeFormatted = format(rangeString, formatOptions, alignmentSize);

  // Since the range contracts to avoid trailing whitespace,
  // we need to remove the newline that was inserted by the `format` call.
  const rangeTrimmed = rangeFormatted.trimRight();

  return text.slice(0, rangeStart) + rangeTrimmed + text.slice(rangeEnd);
};

module.exports = {
  check: (text, opts) => {
    try {
      const formatted = format(text, normalizeOptions(opts));
      return formatted === text;
    } catch(e) {
      return false;
    }
  },
  clearConfigCache: config.clearCache,
  doc,
  formatWithCursor: (text, opts) => {
    return formatWithCursor(text, normalizeOptions(opts));
  },

  format: (text, opts) => {
    return format(text, normalizeOptions(opts));
  },
  getSupportInfo,
  resolveConfig: config.resolveConfig,
  util: sharedUtil,
  version,

  /* istanbul ignore next */
  __debug: {
    formatAST: (ast, opts) => {
      opts = normalizeOptions(opts);
      const printDoc = printAstToDoc(ast, opts);
      const str = printDocToString(printDoc, opts);
      return str;
    },
    // Doesn't handle shebang for now
    formatDoc: (printDoc, opts) => {
      opts = normalizeOptions(opts);
      const debug = printDocToDebug(printDoc);
      const str = format(debug, opts);
      return str;
    },
    parse: (text, opts) => {
      opts = normalizeOptions(opts);
      return parser.parse(text, opts);
    },
    printDocToString: (printDoc, opts) => {
      opts = normalizeOptions(opts);
      const str = printDocToString(printDoc, opts);
      return str;
    },
    printToDoc: (text, opts) => {
      opts = normalizeOptions(opts);
      const result = parser.parse(text, opts);
      const ast = result.ast;
      text = result.text;
      attachComments(text, ast, opts);
      return printAstToDoc(ast, opts);
    }
  }
};
