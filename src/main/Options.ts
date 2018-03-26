import path from 'path';
import {LoadPlugins} from '../common/LoadPlugins';
import {Support} from '../common/Support';
import {SFParserType} from '../types/doc';
import {SFOptionsType} from '../types/options';
import {OptionsNormalizer} from './OptionsNormalizer';
import {Parser} from './Parser';
import {Plugins} from './Plugins';

export class Options {
  static hiddenDefaults: SFParserType = {
    astFormat: 'estree',
    locEnd: null,
    locStart: null,
    printer: {}
  };

  // Copy options and fill in default values.
  static normalize(options: SFOptionsType, opts: SFOptionsType = {}) {
    const rawOptions = {...options};
    const plugins = LoadPlugins.loadPlugins(rawOptions.plugins);
    rawOptions.plugins = plugins;

    const supportOptions = Support.getSupportInfo(null, {
      plugins,
      pluginsLoaded: true,
      showDeprecated: true,
      showUnreleased: true
    }).options;
    const defaults = supportOptions.reduce(
      (reduced, optionInfo) => ({...reduced, [optionInfo.name]: optionInfo.default}), {...Options.hiddenDefaults}
    );

    if(opts.inferParser !== false) {
      const {filepath: rawPath, parser: rawParser, plugins: rawPlugins} = rawOptions;

      if(rawPath && (!rawParser || rawParser === defaults.parser)) {
        const inferredParser = Options.inferParser(rawPath, rawPlugins);

        if(inferredParser) {
          rawOptions.parser = inferredParser;
        }
      }
    }

    const parser = Parser.resolveParser(
      !rawOptions.parser
        ? rawOptions
        : // handle deprecated parsers
        OptionsNormalizer.normalizeApiOptions(
          rawOptions,
          [supportOptions.find((x) => x.name === 'parser')],
          {passThrough: true, logger: false}
        )
    );

    rawOptions.astFormat = parser.astFormat;
    rawOptions.locEnd = parser.locEnd;
    rawOptions.locStart = parser.locStart;

    const plugin = Plugins.getPlugin(rawOptions);
    rawOptions.printer = plugin.printers[rawOptions.astFormat];

    const pluginDefaults = supportOptions
      .filter((optionInfo) => optionInfo.pluginDefaults && optionInfo.pluginDefaults[plugin.name])
      .reduce((reduced, optionInfo) => ({...reduced, [optionInfo.name]: optionInfo.pluginDefaults[plugin.name]}), {});

    const mixedDefaults = {...defaults, ...pluginDefaults};

    Object.keys(mixedDefaults).forEach((k) => {
      if(!rawOptions[k]) {
        rawOptions[k] = mixedDefaults[k];
      }
    });

    if(rawOptions.parser === 'json') {
      rawOptions.trailingComma = 'none';
    }

    return OptionsNormalizer.normalizeApiOptions(
      rawOptions,
      supportOptions,
      {passThrough: Object.keys(Options.hiddenDefaults), ...opts}
    );
  }

  static inferParser(filepath: string, plugins) {
    const extension: string = path.extname(filepath);
    const filename: string = path.basename(filepath).toLowerCase();
    const languageParser = Support.getSupportInfo(null, {plugins, pluginsLoaded: true})
      .languages
      .find((language) => language.since !== null && (language.extensions.indexOf(extension) > -1 ||
        (language.filenames && language.filenames.find((name) => name.toLowerCase() === filename))));

    return languageParser && languageParser.parsers[0];
  }
}
