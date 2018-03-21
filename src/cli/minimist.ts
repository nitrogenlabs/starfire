import minimist from 'minimist';

const PLACEHOLDER = null;

/**
 * unspecified boolean flag without default value is parsed as `undefined` instead of `false`
 */
export default (args, options) => {
  const bool = options.boolean || [];
  const defaults = options.default || {};

  const booleanWithoutDefault = bool.filter((key) => !(key in defaults));
  const newDefaults = {
    ...defaults,
    ...booleanWithoutDefault.reduce((reduced, key) => ({...reduced, [key]: PLACEHOLDER}), {})
  };
  const parsed = minimist(args, {...options, default: newDefaults});

  return Object.keys(parsed).reduce((reduced, key) => {
    if(parsed[key] !== PLACEHOLDER) {
      reduced[key] = parsed[key];
    }

    return reduced;
  }, {});
};
