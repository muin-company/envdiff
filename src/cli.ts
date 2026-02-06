#!/usr/bin/env node

import { parseEnvFile } from './parser.js';
import { compareEnvMaps } from './compare.js';
import { formatDiff } from './formatter.js';
import { generateFromTemplate } from './template.js';
import { existsSync } from 'fs';

function printUsage() {
  console.log(`
Usage: 
  envdiff <file1> <file2> [options]           Compare two .env files
  envdiff --template <source> <target>        Generate .env from template

Compare Mode:
  --show-values    Show actual values (default: masked)
  --strict         Exit with code 1 if any differences found
  --json           Output as JSON

Template Mode (NEW!):
  --template       Generate .env from .env.example
  --overwrite      Overwrite existing target file
  --placeholder    Custom placeholder value (default: smart placeholders)
  -h, --help       Show this help

Examples:
  # Compare two files
  envdiff .env.example .env
  envdiff .env.staging .env.production --show-values
  envdiff .env.example .env --strict --json

  # Generate .env from template
  envdiff --template .env.example .env
  envdiff --template .env.example .env --overwrite
  envdiff --template .env.example .env --placeholder "TODO"
  `.trim());
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  // Template generation mode
  if (args.includes('--template')) {
    handleTemplateMode(args);
    return;
  }

  // Compare mode (default)
  if (args.length < 2) {
    printUsage();
    process.exit(0);
  }

  const files = args.filter(arg => !arg.startsWith('--'));
  const showValues = args.includes('--show-values');
  const strict = args.includes('--strict');
  const json = args.includes('--json');

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
      file1Map: file1,
      file2Map: file2,
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

function handleTemplateMode(args: string[]) {
  const files = args.filter(arg => !arg.startsWith('--'));
  const overwrite = args.includes('--overwrite');
  
  // Get placeholder value if provided
  const placeholderIndex = args.indexOf('--placeholder');
  const placeholder = placeholderIndex >= 0 && args[placeholderIndex + 1] 
    ? args[placeholderIndex + 1]
    : '';

  if (files.length < 2) {
    console.error('Error: Template mode requires source and target file paths');
    console.error('Usage: envdiff --template <source> <target>');
    process.exit(1);
  }

  const [source, target] = files;

  try {
    console.log(`Generating ${target} from ${source}...`);
    
    generateFromTemplate({
      source,
      target,
      overwrite,
      placeholder,
      preserveComments: true,
    });

    console.log(`✓ Successfully created ${target}`);
    console.log('\nNext steps:');
    console.log(`1. Edit ${target} and fill in your values`);
    console.log(`2. Never commit ${target} to version control`);
    console.log(`3. Add ${target} to .gitignore if not already there`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
