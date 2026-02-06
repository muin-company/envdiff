#!/usr/bin/env node

import { parseEnvFile } from './parser.js';
import { compareEnvMaps } from './compare.js';
import { formatDiff } from './formatter.js';
import { existsSync } from 'fs';

function printUsage() {
  console.log(`
Usage: envdiff <file1> <file2> [options]

Compare two .env files and show differences.

Options:
  --show-values    Show actual values (default: masked)
  --color          Enhanced visual diff with colors and side-by-side view
  --no-color       Disable colored output
  --strict         Exit with code 1 if any differences found
  --json           Output as JSON
  -h, --help       Show this help

Examples:
  envdiff .env.example .env
  envdiff .env.staging .env.production --show-values
  envdiff .env.example .env --strict --json
  envdiff .env.local .env.production --color --show-values
  `.trim());
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help') || args.length < 2) {
    printUsage();
    process.exit(0);
  }

  const files = args.filter(arg => !arg.startsWith('--'));
  const showValues = args.includes('--show-values');
  const strict = args.includes('--strict');
  const json = args.includes('--json');
  const color = args.includes('--color');
  const noColor = args.includes('--no-color');

  if (files.length < 2) {
    console.error('Error: Two file paths required');
    printUsage();
    process.exit(1);
  }

  const [file1Path, file2Path] = files;

  if (!existsSync(file1Path)) {
    console.error(`Error: File not found: ${file1Path}`);
    process.exit(1);
  }

  if (!existsSync(file2Path)) {
    console.error(`Error: File not found: ${file2Path}`);
    process.exit(1);
  }

  try {
    const file1 = parseEnvFile(file1Path);
    const file2 = parseEnvFile(file2Path);

    const diff = compareEnvMaps(file1, file2);

    const output = formatDiff(diff, {
      showValues,
      json,
      color,
      noColor,
      file1Map: file1,
      file2Map: file2,
      file1Path,
      file2Path,
    });

    console.log(output);

    if (strict && (diff.missing.length > 0 || diff.extra.length > 0 || diff.different.length > 0)) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
