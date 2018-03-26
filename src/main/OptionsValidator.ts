import {OptionsDescriptor} from './OptionsDescriptor';

export class OptionsValidator {
  static validateOption(value, optionInfo, opts) {
    opts = opts || {};
    const descriptor = opts.descriptor || OptionsDescriptor.apiDescriptor;

    if(typeof optionInfo.exception === 'function' && optionInfo.exception(value)) {
      return;
    }

    try {
      OptionsValidator.validateOptionType(value, optionInfo);
    } catch(error) {
      throw new Error(`Invalid \`${descriptor(optionInfo.name)}\` value. ${error.message}, but received \`${JSON
        .stringify(value)}\`.`);
    }
  }

  static validateOptionType(value, optionInfo) {
    if(optionInfo.array) {
      if(!Array.isArray(value)) {
        throw new Error(`Expected an array`);
      }

      value.forEach((v) => OptionsValidator.validateOptionType(v, {...optionInfo, array: false}));
    } else {
      switch(optionInfo.type) {
        case 'int':
          OptionsValidator.validateIntOption(value);
          break;
        case 'boolean':
          OptionsValidator.validateBooleanOption(value);
          break;
        case 'choice':
          OptionsValidator.validateChoiceOption(value, optionInfo.choices);
          break;
        default:
          break;
      }
    }
  }

  static validateBooleanOption(value) {
    if(typeof value !== 'boolean') {
      throw new Error(`Expected a boolean`);
    }
  }

  static validateIntOption(value) {
    if(!(typeof value === 'number' && Math.floor(value) === value && value >= 0 && value !== Infinity)) {
      throw new Error(`Expected an integer`);
    }
  }

  static validateChoiceOption(value, choiceInfos) {
    if(!choiceInfos.some((choiceInfo) => choiceInfo.value === value)) {
      const choices = choiceInfos
        .filter((choiceInfo) => !choiceInfo.deprecated)
        .map((choiceInfo) => JSON.stringify(choiceInfo.value))
        .sort();
      const head = choices.slice(0, -2);
      const tail = choices.slice(-2);
      throw new Error(`Expected ${head.concat(tail.join(' or ')).join(', ')}`);
    }
  }
}
