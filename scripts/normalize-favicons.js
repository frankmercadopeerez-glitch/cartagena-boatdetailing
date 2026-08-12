"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const excludedDirectories = new Set([
  ".git",
  ".claude",
  ".vscode",
  "contratos",
  "cotizaciones",
  "facturas",
  "node_modules",
  "output",
  "social",
  "tests",
  "tmp",
  "tools",
  "vendor",
]);

function listHtmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listHtmlFiles(absolute));
    else if (entry.name.toLowerCase().endsWith(".html")) files.push(absolute);
  }
  return files;
}

const iconPattern =
  /[ \t]*<link\b[^>]*rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*>[ \t]*(?:\r?\n)?/gi;

let changed = 0;
for (const file of listHtmlFiles(root)) {
  const source = fs.readFileSync(file, "utf8");
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const faviconBlock = [
    '    <link rel="icon" href="/favicon.ico?v=20260812" sizes="any" />',
    '    <link rel="icon" href="/favicon.svg?v=20260812" type="image/svg+xml" />',
    '    <link rel="apple-touch-icon" href="/images/icon-192.png?v=20260812" />',
  ].join(newline);

  let output = source.replace(iconPattern, "");
  const charset = output.match(/<meta\b[^>]*charset=[^>]*>/i);
  if (charset) output = output.replace(charset[0], `${charset[0]}${newline}${faviconBlock}`);
  else output = output.replace(/<head\b[^>]*>/i, (head) => `${head}${newline}${faviconBlock}`);

  if (output !== source) {
    fs.writeFileSync(file, output, "utf8");
    changed += 1;
  }
}

console.log(`Favicons normalizados en ${changed} páginas públicas.`);
