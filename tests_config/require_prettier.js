"use strict";

const isProduction = process.env.NODE_ENV === "production";
const starfireRootDir = isProduction ? process.env.PRETTIER_DIR : "../";

const starfire = require(starfireRootDir);

module.exports = starfire;
