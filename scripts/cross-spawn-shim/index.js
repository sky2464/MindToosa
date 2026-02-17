"use strict";

const cp = require("child_process"); // eslint-disable-line @typescript-eslint/no-require-imports

function spawn(command, args, options) {
  return cp.spawn(command, args, options);
}

function spawnSync(command, args, options) {
  return cp.spawnSync(command, args, options);
}

module.exports = spawn;
module.exports.spawn = spawn;
module.exports.spawnSync = spawnSync;
module.exports.sync = spawnSync;
