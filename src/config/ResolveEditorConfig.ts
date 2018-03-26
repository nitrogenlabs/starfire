
import editorconfig from 'editorconfig';
import editorConfigToStarfire from 'editorconfig-to-prettier';
import findProjectRoot from 'find-project-root';
import mem from 'mem';
import path from 'path';

export class ResolveEditorConfig {
  static maybeParse(filePath, config, parse) {
    const root = findProjectRoot(path.dirname(path.resolve(filePath)));
    return filePath && parse(filePath, {root});
  }

  static editorconfigAsyncNoCache(filePath, config) {
    return Promise.resolve(ResolveEditorConfig.maybeParse(filePath, config, editorconfig.parse)).then(
      editorConfigToStarfire
    );
  }

  static get editorconfigAsyncWithCache() {
    return mem(ResolveEditorConfig.editorconfigAsyncNoCache);
  }

  static editorconfigSyncNoCache(filePath: string, config) {
    return editorConfigToStarfire(ResolveEditorConfig.maybeParse(filePath, config, editorconfig.parseSync));
  }

  static get editorconfigSyncWithCache() {
    return mem(ResolveEditorConfig.editorconfigSyncNoCache);
  }

  static getLoadFunction(opts) {
    if(!opts.editorconfig) {
      return () => null;
    }

    if(opts.sync) {
      return opts.cache ? ResolveEditorConfig.editorconfigSyncWithCache : ResolveEditorConfig.editorconfigSyncNoCache;
    }

    return opts.cache ? ResolveEditorConfig.editorconfigAsyncWithCache : ResolveEditorConfig.editorconfigAsyncNoCache;
  }

  static clearCache() {
    mem.clear(ResolveEditorConfig.editorconfigSyncWithCache);
    mem.clear(ResolveEditorConfig.editorconfigAsyncWithCache);
  }
}

