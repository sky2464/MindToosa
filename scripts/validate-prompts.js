#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const roots = [".agents", ".gemini"];
const issues = [];

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function isMarkdown(file) {
  return file.endsWith(".md") || file.endsWith(".markdown") || file.endsWith(".SKILL.md");
}

for (const root of roots) {
  walk(root, (file) => {
    if (!isMarkdown(file)) return;
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("{{") || content.includes("}}")) {
      issues.push({ file, reason: "Unreplaced placeholder `{{` or `}}` found" });
    }
    const middlewareRegex = /\bmiddleware\b/i;
    if (middlewareRegex.test(content)) {
      const hasProxy = /proxy(\.ts)?/i.test(content);
      const hasHistorical =
        /historically\s+`middleware\.ts`/i.test(content) || /historical/i.test(content);
      if (!hasProxy && !hasHistorical) {
        issues.push({
          file,
          reason: 'References "middleware" without mentioning `proxy` or historical context',
        });
      }
    }
  });
}

if (issues.length) {
  console.error("validate-prompts: Issues found:");
  for (const it of issues) {
    console.error(`- ${it.file}: ${it.reason}`);
  }
  process.exit(1);
}

console.log("validate-prompts: OK");
process.exit(0);
