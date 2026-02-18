/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const ajvDir = path.join(process.cwd(), "node_modules", "ajv", "lib", "refs");
const schemaSrc = path.join(
  process.cwd(),
  "node_modules",
  "ajv-draft-04",
  "dist",
  "refs",
  "json-schema-draft-04.json"
);
const schemaDest = path.join(ajvDir, "json-schema-draft-04.json");
const eslintAjvFile = path.join(process.cwd(), "node_modules", "eslint", "lib", "shared", "ajv.js");

const eslintAjvContent = `
"use strict";
const Ajv = require("ajv");
const metaSchema = require("ajv/lib/refs/json-schema-draft-04.json");

module.exports = (additionalOptions = {}) => {
    // Ajv 8 does not support these legacy options
    const { 
        missingRefs, 
        schemaId, 
        strictDefaults,
        strictKeywords,
        ...opts 
    } = additionalOptions;
    
    // Ajv 8 constructor
    const ajv = new Ajv({
        meta: false,
        useDefaults: true,
        validateSchema: false,
        verbose: true,
        strict: false, // Legacy schemas often violate strict mode
        ...opts,
    });

    ajv.addMetaSchema(metaSchema);
    
    // Mock legacy _opts if needed
    if (!ajv._opts) {
        ajv._opts = ajv.opts || {};
    }
    ajv._opts.defaultMeta = metaSchema.id || metaSchema.$id;

    return ajv;
};
`;

try {
  // 1. Copy the legacy schema file
  if (!fs.existsSync(ajvDir)) {
    fs.mkdirSync(ajvDir, { recursive: true });
  }

  if (fs.existsSync(schemaSrc)) {
    fs.copyFileSync(schemaSrc, schemaDest);
    console.log("✅ Ajv 8 compatibility: json-schema-draft-04.json copied");
  }

  // 2. Patch ESLint's ajv utility
  if (fs.existsSync(eslintAjvFile)) {
    fs.writeFileSync(eslintAjvFile, eslintAjvContent);
    console.log("✅ Ajv 8 compatibility: eslint/lib/shared/ajv.js patched");
  }
} catch (error) {
  console.error("❌ Failed to apply compatibility patch:", error.message);
}
