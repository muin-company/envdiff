import { DiffResult } from './compare.js';

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

export interface FormatOptions {
  showValues?: boolean;
  json?: boolean;
  file1Map?: Map<string, string>;
  file2Map?: Map<string, string>;
}

function maskValue(value: string): string {
  if (value.length <= 4) return '***';
  return value.slice(0, 2) + '***' + value.slice(-2);
}

export function formatDiff(
  diff: DiffResult,
  options: FormatOptions = {}
): string {
  if (options.json) {
    return JSON.stringify(diff, null, 2);
  }

  const lines: string[] = [];

  if (diff.missing.length > 0) {
    lines.push(`${colors.red}Missing variables (in first file but not second):${colors.reset}`);
    for (const key of diff.missing) {
      if (options.showValues && options.file1Map) {
        const val = options.file1Map.get(key) || '';
        lines.push(`  ${colors.red}- ${key}=${val}${colors.reset}`);
      } else {
        lines.push(`  ${colors.red}- ${key}${colors.reset}`);
      }
    }
    lines.push('');
  }

  if (diff.extra.length > 0) {
    lines.push(`${colors.yellow}Extra variables (in second file but not first):${colors.reset}`);
    for (const key of diff.extra) {
      if (options.showValues && options.file2Map) {
        const val = options.file2Map.get(key) || '';
        lines.push(`  ${colors.yellow}+ ${key}=${val}${colors.reset}`);
      } else {
        lines.push(`  ${colors.yellow}+ ${key}${colors.reset}`);
      }
    }
    lines.push('');
  }

  if (diff.different.length > 0) {
    lines.push(`${colors.blue}Different values:${colors.reset}`);
    for (const key of diff.different) {
      if (options.showValues && options.file1Map && options.file2Map) {
        const val1 = options.file1Map.get(key) || '';
        const val2 = options.file2Map.get(key) || '';
        lines.push(`  ${colors.blue}~ ${key}${colors.reset}`);
        lines.push(`    < ${val1}`);
        lines.push(`    > ${val2}`);
      } else {
        const val1 = options.file1Map?.get(key) || '';
        const val2 = options.file2Map?.get(key) || '';
        lines.push(`  ${colors.blue}~ ${key} (${maskValue(val1)} vs ${maskValue(val2)})${colors.reset}`);
      }
    }
    lines.push('');
  }

  if (diff.missing.length === 0 && diff.extra.length === 0 && diff.different.length === 0) {
    lines.push('No differences found.');
  }

  return lines.join('\n');
}
