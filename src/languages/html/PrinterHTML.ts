'use strict';

import {Util} from '../../common/util';
import {DocBuilders} from '../../doc/DocBuilders';
const {concat, group, hardline, indent, join, line, softline} = DocBuilders;

export class PrinterHTML {
  static print = PrinterHTML.genericPrint;
  static hasPrettierIgnore = Util.hasIgnoreComment;

  // http://w3c.github.io/html/single-page.html#void-elements
  static voidTags = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  static genericPrint(path, options, print) {
    const n = path.getValue();
    if(!n) {
      return '';
    }

    if(typeof n === 'string') {
      return n;
    }

    switch(n.type) {
      case 'root': {
        return PrinterHTML.printChildren(path, print);
      }
      case 'directive': {
        return concat(['<', n.data, '>', hardline]);
      }
      case 'text': {
        return n.data.replace(/\s+/g, ' ').trim();
      }
      case 'script':
      case 'style':
      case 'tag': {
        const selfClose = PrinterHTML.voidTags[n.name] ? '>' : ' />';
        const children = PrinterHTML.printChildren(path, print);

        const hasNewline = Util.hasNewlineInRange(
          options.originalText,
          options.locStart(n),
          options.locEnd(n)
        );

        return group(
          concat([
            hasNewline ? hardline : '',
            '<',
            n.name,
            PrinterHTML.printAttributes(path, print),

            n.children.length ? '>' : selfClose,

            n.name.toLowerCase() === 'html'
              ? concat([hardline, children])
              : indent(children),
            n.children.length ? concat([softline, '</', n.name, '>']) : hardline
          ])
        );
      }
      case 'comment': {
        return concat(['<!-- ', n.data.trim(), ' -->']);
      }
      case 'attribute': {
        if(!n.value) {
          return n.key;
        }
        return concat([n.key, '="', n.value, '"']);
      }

      default:
        /* istanbul ignore next */
        throw new Error('unknown htmlparser2 type: ' + n.type);
    }
  }

  static printAttributes(path, print) {
    const node = path.getValue();

    return concat([
      node.attributes.length ? ' ' : '',
      indent(join(line, path.map(print, 'attributes')))
    ]);
  }

  static printChildren(path, print) {
    const children = [];
    path.each((childPath) => {
      const child = childPath.getValue();
      if(child.type !== 'text') {
        children.push(hardline);
      }
      children.push(childPath.call(print));
    }, 'children');
    return concat(children);
  }
}
