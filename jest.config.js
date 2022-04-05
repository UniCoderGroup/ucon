/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  transform: {},
  roots: [
    "<rootDir>/components/",
    "<rootDir>/core/",
    "<rootDir>/project/roadmap",
    "<rootDir>/utils/",
    "<rootDir>/utty/"
  ],
  moduleNameMapper: {
    chalk: "chalk/source/index.js",
    "#ansi-styles": "chalk/source/vendor/ansi-styles/index.js",
    "#supports-color": "chalk/source/vendor/supports-color/index.js",
  },
  testMatch: ["**/dist-test/**/?(*.)+(spec|test).[jt]s?(x)"]
};
