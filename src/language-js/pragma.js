"use strict";

const docblock = require("jest-docblock");

function hasPragma(text) {
  const pragmas = Object.keys(docblock.parse(docblock.extract(text)));
  return pragmas.indexOf("starfire") !== -1 || pragmas.indexOf("format") !== -1;
}

function insertPragma(text) {
  const parsedDocblock = docblock.parseWithComments(docblock.extract(text));
  const pragmas = Object.assign({ format: "" }, parsedDocblock.pragmas);
  const newDocblock = docblock.print({
    pragmas,
    comments: parsedDocblock.comments.replace(/^(\s+?\r?\n)+/, "") // remove leading newlines
  });
  const strippedText = docblock.strip(text);
  const separatingNewlines = strippedText.startsWith("\n") ? "\n" : "\n\n";
  return newDocblock + separatingNewlines + strippedText;
}

module.exports = {
  hasPragma,
  insertPragma
};
