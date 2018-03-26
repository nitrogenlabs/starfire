import stringify from 'json-stable-stringify';

import {Starfire} from '../index';
import {Utils} from './Utils';

export const run = (args) => {
  const context = Utils.createContext(args);

  try {
    Utils.initContext(context);

    context.logger.debug(`normalized argv: ${JSON.stringify(context.argv)}`);

    if(context.argv['write'] && context.argv['debug-check']) {
      context.logger.error('Cannot use --write and --debug-check together.');
      process.exit(1);
    }

    if(context.argv['find-config-path'] && context.filePatterns.length) {
      context.logger.error('Cannot use --find-config-path with multiple files');
      process.exit(1);
    }

    if(context.argv['version']) {
      context.logger.log(Starfire.version);
      process.exit(0);
    }

    if(context.argv['help'] !== undefined) {
      context.logger.log(
        typeof context.argv['help'] === 'string' && context.argv['help'] !== ''
          ? Utils.createDetailedUsage(context, context.argv['help'])
          : Utils.createUsage(context)
      );

      process.exit(0);
    }

    if(context.argv['support-info']) {
      context.logger.log(Starfire.format(stringify(Starfire.getSupportInfo()), {parser: 'json'}));
      process.exit(0);
    }

    const hasFilePatterns = context.filePatterns.length !== 0;
    const useStdin = context.argv['stdin'] || (!hasFilePatterns && !process.stdin.isTTY);

    if(context.argv['find-config-path']) {
      Utils.logResolvedConfigPathOrDie(context, context.argv['find-config-path']);
    } else if(useStdin) {
      Utils.formatStdin(context);
    } else if(hasFilePatterns) {
      Utils.formatFiles(context);
    } else {
      context.logger.log(Utils.createUsage(context));
      process.exit(1);
    }
  } catch(error) {
    context.logger.error(error.message);
    process.exit(1);
  }
};
