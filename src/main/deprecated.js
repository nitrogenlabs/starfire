"use strict";

const deprecated = {
  useFlowParser: config =>
    `  The ${'"useFlowParser"'} option is deprecated. Use ${'"parser"'} instead.

  Starfire now treats your configuration as:
  {
    ${'"parser"'}: ${config.useFlowParser ? '"flow"' : '"babylon"'}
  }`
};

module.exports = deprecated;
