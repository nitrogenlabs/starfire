import camelCase from 'camelcase';
import chalk from 'chalk';
import dashify from 'dashify';
import fs from 'fs';
import globby from 'globby';
import ignore from 'ignore';
import leven from 'leven';
import {flatten, groupBy, pick} from 'lodash';
import path from 'path';
import readline from 'readline';

import starfire from '../..';
import {cleanAST} from '../common/clean-ast';
import errors from '../common/errors';
import {getSupportInfo} from '../common/support';
import thirdParty from '../common/third-party';
import util from '../common/util';
import resolver from '../config/resolve-config';
import optionsModule from '../main/options';
import optionsNormalizer from '../main/options-normalizer';
import {CLIConstants} from './CLIConstants';
import minimist from './minimist';

export interface LogFunctionType {
  debug: (type: string, color: string) => void;
  error: (type: string, color: string) => void;
  log: (type: string, color: string) => void;
  warn: (type: string, color: string) => void;
}

export interface CLIContextType {
  args?: any;
  argv?: any;
  logger?: any;
}

export class Utils {
  static OPTION_USAGE_THRESHOLD: number = 25;
  static CHOICE_USAGE_MARGIN: number = 3;
  static CHOICE_USAGE_INDENTATION: number = 2;

  static getOptions(argv, detailedOptions): any {
    return detailedOptions.filter((option) => option.forwardToApi).reduce(
      (current, option) => ({...current, [option.forwardToApi]: argv[option.name]}),
      {}
    );
  }

  static cliifyOptions(object, apiDetailedOptionMap): any {
    return Object.keys(object || {}).reduce((output, key) => {
      const apiOption = apiDetailedOptionMap[key];
      const cliKey = apiOption ? apiOption.name : key;

      output[dashify(cliKey)] = object[key];
      return output;
    }, {});
  }

  static diff(a, b): any {
    return require('diff').createTwoFilesPatch('', '', a, b, '', '', {context: 2});
  }

  static handleError(context, filename, error): any {
    const isParseError = Boolean(error && error.loc);
    const isValidationError = /Validation Error/.test(error && error.message);

    // For parse errors and validation errors, we only want to show the error
    // message formatted in a nice way. `String(error)` takes care of that. Other
    // (unexpected) errors are passed as-is as a separate argument to
    // `console.error`. That includes the stack trace (if any), and shows a nice
    // `util.inspect` of throws things that aren't `Error` objects. (The Flow
    // parser has mistakenly thrown arrays sometimes.)
    if(isParseError) {
      context.logger.error(`${filename}: ${String(error)}`);
    } else if(isValidationError || error instanceof errors.ConfigError) {
      context.logger.error(String(error));
      // If validation fails for one file, it will fail for all of them.
      process.exit(1);
    } else if(error instanceof errors.DebugError) {
      context.logger.error(`${filename}: ${error.message}`);
    } else {
      context.logger.error(filename + ': ' + (error.stack || error));
    }

    // Don't exit the process if one file failed
    process.exitCode = 2;
  }

  static logResolvedConfigPathOrDie(context, filePath): void {
    const configFile = resolver.resolveConfigFile.sync(filePath);

    if(configFile) {
      context.logger.log(path.relative(process.cwd(), configFile));
    } else {
      process.exit(1);
    }
  }

  static writeOutput(result, options): void {
    // Don't use `console.log` here since it adds an extra newline at the end.
    process.stdout.write(result.formatted);

    if(options.cursorOffset >= 0) {
      process.stderr.write(`${result.cursorOffset}\n`);
    }
  }

  static listDifferent(context, input, options, filename): boolean {
    if(!context.argv['list-different']) {
      return null;
    }

    options = {...options, filepath: filename};

    if(!starfire.check(input, options)) {
      if(!context.argv['write']) {
        context.logger.log(filename);
      }
      process.exitCode = 1;
    }

    return true;
  }

  static format(context, input, opt): any {
    if(context.argv['debug-print-doc']) {
      const doc = starfire.__debug.printToDoc(input, opt);
      return {formatted: starfire.__debug.formatDoc(doc)};
    }

    if(context.argv['debug-check']) {
      const pp = starfire.format(input, opt);
      const pppp = starfire.format(pp, opt);

      if(pp !== pppp) {
        throw new errors.DebugError('starfire(input) !== starfire(starfire(input))\n' + Utils.diff(pp, pppp));
      } else {
        const normalizedOpts = optionsModule.normalize(opt);
        const ast = cleanAST(
          starfire.__debug.parse(input, opt).ast,
          normalizedOpts
        );
        const past = cleanAST(
          starfire.__debug.parse(pp, opt).ast,
          normalizedOpts
        );

        if(ast !== past) {
          const MAX_AST_SIZE = 2097152; // 2MB
          const astDiff =
            ast.length > MAX_AST_SIZE || past.length > MAX_AST_SIZE
              ? 'AST diff too large to render'
              : Utils.diff(ast, past);
          throw new errors.DebugError(
            'ast(input) !== ast(starfire(input))\n' +
            astDiff +
            '\n' +
            Utils.diff(input, pp)
          );
        }
      }

      return {formatted: opt.filepath || '(stdin)\n'};
    }

    return starfire.formatWithCursor(input, opt);
  }

  static getOptionsOrDie(context, filePath): any {
    try {
      if(context.argv['config'] === false) {
        context.logger.debug(
          '\'--no-config\' option found, skip loading config file.'
        );
        return null;
      }

      context.logger.debug(
        context.argv['config']
          ? `load config file from '${context.argv['config']}'`
          : `resolve config from '${filePath}'`
      );

      const options = resolver.resolveConfig.sync(filePath, {
        config: context.argv['config'],
        editorconfig: context.argv['editorconfig']
      });

      context.logger.debug('loaded options `' + JSON.stringify(options) + '`');
      return options;
    } catch(error) {
      context.logger.error('Invalid configuration file: ' + error.message);
      process.exit(2);
    }
  }

  static getOptionsForFile(context, filepath): any {
    const options = Utils.getOptionsOrDie(context, filepath);
    const hasPlugins = options && options.plugins;

    if(hasPlugins) {
      Utils.pushContextPlugins(context, options.plugins);
    }

    const appliedOptions = {
      filepath,
      ...Utils.applyConfigPrecedence(
        context,
        options &&
        optionsNormalizer.normalizeApiOptions(options, context.supportOptions, {
          logger: context.logger
        })
      )
    };

    context.logger.debug(
      `applied config-precedence (${context.argv['config-precedence']}): ` +
      `${JSON.stringify(appliedOptions)}`
    );

    if(hasPlugins) {
      Utils.popContextPlugins(context);
    }

    return appliedOptions;
  }

  static parseArgsToOptions(context, overrideDefaults?): any {
    const minimistOptions = Utils.createMinimistOptions(context.detailedOptions);
    const apiDetailedOptionMap = Utils.createApiDetailedOptionMap(context.detailedOptions);

    return Utils.getOptions(
      optionsNormalizer.normalizeCliOptions(
        minimist(
          context.args,
          {
            boolean: minimistOptions.boolean,
            default: Utils.cliifyOptions(overrideDefaults, apiDetailedOptionMap),
            string: minimistOptions.string
          }
        ),
        context.detailedOptions,
        {logger: false}
      ),
      context.detailedOptions
    );
  }

  static applyConfigPrecedence(context, options): any {
    try {
      switch(context.argv['config-precedence']) {
        case 'cli-override':
          return Utils.parseArgsToOptions(context, options);
        case 'file-override':
          return {...Utils.parseArgsToOptions(context), options};
        case 'prefer-file':
          return options || Utils.parseArgsToOptions(context);
        default:
          return null;
      }
    } catch(error) {
      context.logger.error(error.toString());
      process.exit(2);
    }
  }

  static formatStdin(context): any {
    const filepath = context.argv['stdin-filepath']
      ? path.resolve(process.cwd(), context.argv['stdin-filepath'])
      : process.cwd();
    const ignorer = Utils.createIgnorer(context);
    const relativeFilepath = path.relative(process.cwd(), filepath);

    thirdParty.getStream(process.stdin).then((input) => {
      if(relativeFilepath && ignorer.filter([relativeFilepath]).length === 0) {
        Utils.writeOutput({formatted: input}, {});
        return;
      }

      const options = Utils.getOptionsForFile(context, filepath);

      if(Utils.listDifferent(context, input, options, '(stdin)')) {
        return;
      }

      try {
        Utils.writeOutput(Utils.format(context, input, options), options);
      } catch(error) {
        Utils.handleError(context, 'stdin', error);
      }
    });
  }

  static createIgnorer(context): any {
    const ignoreFilePath = path.resolve(context.argv['ignore-path']);
    let ignoreText = '';

    try {
      ignoreText = fs.readFileSync(ignoreFilePath, 'utf8');
    } catch(readError) {
      if(readError.code !== 'ENOENT') {
        context.logger.error(
          `Unable to read ${ignoreFilePath}: ` + readError.message
        );
        process.exit(2);
      }
    }

    return ignore().add(ignoreText);
  }

  static eachFilename(context, patterns, callback): void {
    const ignoreNodeModules = context.argv['with-node-modules'] !== true;

    if(ignoreNodeModules) {
      patterns = patterns.concat(['!**/node_modules/**', '!./node_modules/**']);
    }

    try {
      const filePaths = globby
        .sync(patterns, {dot: true, nodir: true})
        .map((filePath) => path.relative(process.cwd(), filePath));

      if(filePaths.length === 0) {
        context.logger.error(`No matching files. Patterns tried: ${patterns.join(' ')}`);
        process.exitCode = 2;
        return;
      }
      filePaths.forEach((filePath) =>
        callback(filePath, Utils.getOptionsForFile(context, filePath))
      );
    } catch(error) {
      context.logger.error(
        `Unable to expand glob patterns: ${patterns.join(' ')}\n${error.message}`
      );
      // Don't exit the process if one pattern failed
      process.exitCode = 2;
    }
  }

  static formatFiles(context): any {
    // The ignorer will be used to filter file paths after the glob is checked,
    // before any files are actually written
    const ignorer = Utils.createIgnorer(context);

    Utils.eachFilename(context, context.filePatterns, (filename, options) => {
      const fileIgnored = ignorer.filter([filename]).length === 0;
      if(
        fileIgnored &&
        (context.argv['debug-check'] ||
          context.argv['write'] ||
          context.argv['list-different'])
      ) {
        return;
      }

      if(context.argv['write'] && process.stdout.isTTY) {
        // Don't use `console.log` here since we need to replace this line.
        context.logger.log(filename, {newline: false});
      }

      let input;
      try {
        input = fs.readFileSync(filename, 'utf8');
      } catch(error) {
        // Add newline to split errors from filename line.
        context.logger.log('');

        context.logger.error(
          `Unable to read file: ${filename}\n${error.message}`
        );
        // Don't exit the process if one file failed
        process.exitCode = 2;
        return;
      }

      if(fileIgnored) {
        Utils.writeOutput({formatted: input}, options);
        return;
      }

      Utils.listDifferent(context, input, options, filename);

      const start = Date.now();

      let result;
      let output;

      try {
        result = Utils.format(
          context,
          input,
          {...options, filepath: filename}
        );
        output = result.formatted;
      } catch(error) {
        // Add newline to split errors from filename line.
        process.stdout.write('\n');

        Utils.handleError(context, filename, error);
        return;
      }

      if(context.argv['write']) {
        if(process.stdout.isTTY) {
          // Remove previously printed filename to log it with duration.
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0, null);
        }

        // Don't write the file if it won't change in order not to invalidate
        // mtime based caches.
        if(output === input) {
          if(!context.argv['list-different']) {
            context.logger.log(`${chalk.grey(filename)} ${Date.now() - start}ms`);
          }
        } else {
          if(context.argv['list-different']) {
            context.logger.log(filename);
          } else {
            context.logger.log(`${filename} ${Date.now() - start}ms`);
          }

          try {
            fs.writeFileSync(filename, output, 'utf8');
          } catch(error) {
            context.logger.error(
              `Unable to write file: ${filename}\n${error.message}`
            );
            // Don't exit the process if one file failed
            process.exitCode = 2;
          }
        }
      } else if(context.argv['debug-check']) {
        if(output) {
          context.logger.log(output);
        } else {
          process.exitCode = 2;
        }
      } else if(!context.argv['list-different']) {
        Utils.writeOutput(result, options);
      }
    });
  }

  static getOptionsWithOpposites(options): any {
    // Add --no-foo after --foo.
    const optionsWithOpposites = options.map((option) => [
      option.description ? option : null,
      option.oppositeDescription
        ? {
          ...option,
          description: option.oppositeDescription,
          name: `no-${option.name}`,
          type: 'boolean'
        }
        : null
    ]);

    return flatten(optionsWithOpposites).filter(Boolean);
  }

  static createUsage(context): string {
    const options = Utils.getOptionsWithOpposites(context.detailedOptions).filter(
      // remove unnecessary option (e.g. `semi`, `color`, etc.), which is only used for --help <flag>
      (option) =>
        !(
          option.type === 'boolean' &&
          option.oppositeDescription &&
          !option.name.startsWith('no-')
        )
    );

    const groupedOptions = groupBy(options, (option) => option.category);
    const firstCategories = CLIConstants.categoryOrder.slice(0, -1);
    const lastCategories = CLIConstants.categoryOrder.slice(-1);
    const restCategories = Object.keys(groupedOptions).filter(
      (category) =>
        firstCategories.indexOf(category) === -1 &&
        lastCategories.indexOf(category) === -1
    );
    const allCategories = firstCategories.concat(restCategories, lastCategories);

    const optionsUsage = allCategories.map((category) => {
      const categoryOptions = groupedOptions[category]
        .map((option) => Utils.createOptionUsage(context, option, Utils.OPTION_USAGE_THRESHOLD))
        .join('\n');
      return `${category} options:\n\n${Utils.indent(categoryOptions, 2)}`;
    });

    return [CLIConstants.usageSummary].concat(optionsUsage, ['']).join('\n\n');
  }

  static createOptionUsage(context, option, threshold): string {
    const header = Utils.createOptionUsageHeader(option);
    const optionDefaultValue = Utils.getOptionDefaultValue(context, option.name);
    return Utils.createOptionUsageRow(
      header,
      `${option.description}${
      optionDefaultValue === undefined
        ? ''
        : `\nDefaults to ${Utils.createDefaultValueDisplay(optionDefaultValue)}.`
      }`,
      threshold
    );
  }

  static createDefaultValueDisplay(value): string {
    return Array.isArray(value)
      ? `[${value.map(Utils.createDefaultValueDisplay).join(', ')}]`
      : value;
  }

  static createOptionUsageHeader(option): string {
    const name = `--${option.name}`;
    const alias = option.alias ? `-${option.alias},` : null;
    const type = Utils.createOptionUsageType(option);
    return [alias, name, type].filter(Boolean).join(' ');
  }

  static createOptionUsageRow(header, content, threshold): string {
    const separator =
      header.length >= threshold
        ? `\n${' '.repeat(threshold)}`
        : ' '.repeat(threshold - header.length);

    const description = content.replace(/\n/g, `\n${' '.repeat(threshold)}`);

    return `${header}${separator}${description}`;
  }

  static createOptionUsageType(option): string {
    switch(option.type) {
      case 'boolean':
        return null;
      case 'choice':
        return `<${option.choices
          .filter((choice) => !choice.deprecated)
          .map((choice) => choice.value)
          .join('|')}>`;
      default:
        return `<${option.type}>`;
    }
  }

  static getOptionWithLevenSuggestion(context, options, optionName): any {
    // support aliases
    const optionNameContainers = flatten(
      options.map((option, index) => [
        {value: option.name, index},
        option.alias ? {value: option.alias, index} : null
      ])
    ).filter(Boolean);

    const optionNameContainer = optionNameContainers.find((container) => container.value === optionName);

    if(optionNameContainer !== undefined) {
      return options[optionNameContainer.index];
    }

    const suggestedOptionNameContainer = optionNameContainers
      .find((container) => leven(container.value, optionName) < 3);

    if(suggestedOptionNameContainer !== undefined) {
      const suggestedOptionName = suggestedOptionNameContainer.value;
      context.logger.warn(`Unknown option name "${optionName}", did you mean "${suggestedOptionName}"?`);
      return options[suggestedOptionNameContainer.index];
    }

    context.logger.warn(`Unknown option name "${optionName}"`);
    return options.find((option) => option.name === 'help');
  }

  static createChoiceUsages(choices, margin, indentation): any {
    const activeChoices = choices.filter((choice) => !choice.deprecated);
    const threshold =
      activeChoices
        .map((choice) => choice.value.length)
        .reduce((current, length) => Math.max(current, length), 0) + margin;
    return activeChoices.map((choice) =>
      Utils.indent(
        Utils.createOptionUsageRow(choice.value, choice.description, threshold),
        indentation
      )
    );
  }

  static createDetailedUsage(context, optionName): any {
    const option = Utils.getOptionWithLevenSuggestion(
      context,
      Utils.getOptionsWithOpposites(context.detailedOptions),
      optionName
    );

    const header = Utils.createOptionUsageHeader(option);
    const description = `\n\n${Utils.indent(option.description, 2)}`;

    const choices =
      option.type !== 'choice'
        ? ''
        : `\n\nValid options:\n\n${Utils.createChoiceUsages(
          option.choices,
          Utils.CHOICE_USAGE_MARGIN,
          Utils.CHOICE_USAGE_INDENTATION
        ).join('\n')}`;

    const optionDefaultValue = Utils.getOptionDefaultValue(context, option.name);
    const defaults =
      optionDefaultValue !== undefined
        ? `\n\nDefault: ${Utils.createDefaultValueDisplay(optionDefaultValue)}`
        : '';

    const pluginDefaults =
      option.pluginDefaults && Object.keys(option.pluginDefaults).length
        ? `\nPlugin defaults:${Object.keys(option.pluginDefaults).map(
          (key) =>
            `\n* ${key}: ${Utils.createDefaultValueDisplay(
              option.pluginDefaults[key]
            )}`
        )}`
        : '';
    return `${header}${description}${choices}${defaults}${pluginDefaults}`;
  }

  static getOptionDefaultValue(context, optionName): any {
    // --no-option
    if(!(optionName in context.detailedOptionMap)) {
      return undefined;
    }

    const option = context.detailedOptionMap[optionName];

    if(option.default !== undefined) {
      return option.default;
    }

    const optionCamelName = camelCase(optionName);
    if(optionCamelName in context.apiDefaultOptions) {
      return context.apiDefaultOptions[optionCamelName];
    }

    return undefined;
  }

  static indent(str, spaces): string {
    return str.replace(/^/gm, ' '.repeat(spaces));
  }

  static createLogger(logLevel): LogFunctionType {
    const shouldLog = (loggerName) => {
      if(logLevel === 'silent') {
        return false;
      } else if(logLevel === 'debug' || logLevel === 'log' || logLevel === 'warn') {
        if(loggerName === 'debug' || loggerName === 'log' || loggerName === 'warn') {
          return true;
        } else {
          return loggerName === 'error';
        }
      } else {
        return true;
      }
    };

    const createLogFunc = (loggerName, color?) => {
      if(!shouldLog(loggerName)) {
        return () => {};
      }

      const prefix = color ? `[${chalk[color](loggerName)}] ` : '';

      return (message, opts) => {
        opts = {newline: true, ...opts};
        const stream = process[loggerName === 'log' ? 'stdout' : 'stderr'];
        stream.write(message.replace(/^/gm, prefix) + (opts.newline ? '\n' : ''));
      };
    };

    return {
      debug: createLogFunc('debug', 'blue'),
      error: createLogFunc('error', 'red'),
      log: createLogFunc('log'),
      warn: createLogFunc('warn', 'yellow')
    };
  }

  static normalizeDetailedOption(name, option): any {
    return {
      category: CLIConstants.CATEGORY_OTHER, ...option,
      choices:
        option.choices &&
        option.choices.map((choice) => {
          const newChoice = {
            deprecated: false,
            description: '',
            ...(typeof choice === 'object' ? choice : {value: choice})
          };
          if(newChoice.value === true) {
            newChoice.value = ''; // backward compability for original boolean option
          }
          return newChoice;
        })
    };
  }

  static normalizeDetailedOptionMap(detailedOptionMap): any {
    return Object.keys(detailedOptionMap)
      .sort()
      .reduce((normalized, name) => {
        const option = detailedOptionMap[name];
        return {
          ...normalized,
          [name]: Utils.normalizeDetailedOption(name, option)
        };
      }, {});
  }

  static createMinimistOptions(detailedOptions): any {
    return {
      alias: detailedOptions
        .filter((option) => option.alias !== undefined)
        .reduce(
          (current, option) =>
            ({[option.name]: option.alias, ...current}),
          {}
        ),
      boolean: detailedOptions
        .filter((option) => option.type === 'boolean')
        .map((option) => option.name),
      default: detailedOptions
        .filter((option) => !option.deprecated)
        .filter((option) => !option.forwardToApi || option.name === 'plugin')
        .filter((option) => option.default !== undefined)
        .reduce(
          (current, option) =>
            ({[option.name]: option.default, ...current}),
          {}
        ),
      string: detailedOptions
        .filter((option) => option.type !== 'boolean')
        .map((option) => option.name)
    };
  }

  static createApiDetailedOptionMap(detailedOptions): any {
    return detailedOptions.reduce(
      (current, option) =>
        option.forwardToApi && option.forwardToApi !== option.name
          ? {...current, [option.forwardToApi]: option}
          : current,
      {}
    );
  }

  static createDetailedOptionMap(supportOptions): any {
    return supportOptions.reduce((reduced, option) => {
      const newOption = {
        ...option,
        category: option.cliCategory || CLIConstants.CATEGORY_FORMAT,
        description: option.cliDescription || option.description,
        forwardToApi: option.name,
        name: option.cliName || dashify(option.name)
      };

      if(option.deprecated) {
        delete newOption.forwardToApi;
        delete newOption.description;
        delete newOption.oppositeDescription;
        newOption.deprecated = true;
      }

      return {...reduced, [newOption.name]: newOption};
    }, {});
  }

  static createContext(args): any {
    const context: CLIContextType = {args};

    Utils.updateContextArgv(context);
    Utils.normalizeContextArgv(context, ['loglevel', 'plugin']);

    context.logger = Utils.createLogger(context.argv['loglevel']);

    Utils.updateContextArgv(context, context.argv['plugin']);

    return context;
  }

  static initContext(context): void {
    // split into 2 step so that we could wrap this in a `try..catch` in cli/index.js
    Utils.normalizeContextArgv(context);
  }

  static updateContextOptions(context, plugins): void {
    const supportOptions = getSupportInfo(null, {
      plugins,
      showDeprecated: true,
      showInternal: true,
      showUnreleased: true
    }).options;
    const detailedOptionMap = Utils.normalizeDetailedOptionMap(
      {...Utils.createDetailedOptionMap(supportOptions), ...CLIConstants.options}
    );
    const detailedOptions = util.arrayify(detailedOptionMap, 'name');
    const apiDefaultOptions = supportOptions
      .filter((optionInfo) => !optionInfo.deprecated)
      .reduce(
        (reduced, optionInfo) =>
          ({...reduced, [optionInfo.name]: optionInfo.default}),
        {...optionsModule.hiddenDefaults}
      );

    context.supportOptions = supportOptions;
    context.detailedOptions = detailedOptions;
    context.detailedOptionMap = detailedOptionMap;
    context.apiDefaultOptions = apiDefaultOptions;
  }

  static pushContextPlugins(context, plugins): void {
    context._supportOptions = context.supportOptions;
    context._detailedOptions = context.detailedOptions;
    context._detailedOptionMap = context.detailedOptionMap;
    context._apiDefaultOptions = context.apiDefaultOptions;
    Utils.updateContextOptions(context, plugins);
  }

  static popContextPlugins(context): void {
    context.supportOptions = context._supportOptions;
    context.detailedOptions = context._detailedOptions;
    context.detailedOptionMap = context._detailedOptionMap;
    context.apiDefaultOptions = context._apiDefaultOptions;
  }

  static updateContextArgv(context, plugins?): void {
    Utils.pushContextPlugins(context, plugins);

    const minimistOptions = Utils.createMinimistOptions(context.detailedOptions);
    const argv = minimist(context.args, minimistOptions);

    context.argv = argv;
    context.filePatterns = argv['_'];
  }

  static normalizeContextArgv(context, keys?): void {
    const detailedOptions = !keys
      ? context.detailedOptions
      : context.detailedOptions.filter(
        (option) => keys.indexOf(option.name) !== -1
      );
    const argv = !keys ? context.argv : pick(context.argv, keys);

    context.argv = optionsNormalizer.normalizeCliOptions(argv, detailedOptions, {logger: context.logger});
  }
}
