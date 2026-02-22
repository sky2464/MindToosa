#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "..", ".ai", "assistant-config.json");
function fail(msg) {
  console.error("assistant-config validation error:", msg);
  process.exitCode = 2;
}

try {
  const raw = fs.readFileSync(file, "utf8");
  const cfg = JSON.parse(raw);

  const errors = [];
  if (!cfg.version) errors.push('Missing top-level "version" field.');
  if (!cfg.framework || cfg.framework.name !== "next") errors.push('framework.name must be "next"');
  if (!cfg.framework || typeof cfg.framework.major !== "number")
    errors.push("framework.major must be a number");
  if (cfg.framework && cfg.framework.major !== 16)
    errors.push("framework.major should be 16 for this repo");
  if (!Array.isArray(cfg.rules)) errors.push("rules must be an array");
  else {
    cfg.rules.forEach((r, i) => {
      if (!r.id) errors.push(`rule[${i}].id missing`);
      if (!r.type) errors.push(`rule[${i}].type missing`);
      if (r.type === "hard") {
        if (!r.forbid && !r.require)
          errors.push(`rule[${i}] is hard but missing 'forbid' or 'require'`);
      }
    });
  }
  if (!Array.isArray(cfg.sensitive_paths)) errors.push("sensitive_paths should be an array");

  if (errors.length) {
    console.error("Found validation errors in .ai/assistant-config.json:");
    errors.forEach((e) => console.error(" -", e));
    process.exit(2);
  }

  console.log(".ai/assistant-config.json OK (version:", cfg.version + ")");
} catch (err) {
  console.error(
    "Failed to validate .ai/assistant-config.json:",
    err && err.message ? err.message : err
  );
  process.exit(3);
}
