import { DiffResult } from './compare.js';

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

export interface FormatOptions {
  showValues?: boolean;
  json?: boolean;
  color?: boolean;
  noColor?: boolean;
  file1Map?: Map<string, string>;
  file2Map?: Map<string, string>;
  file1Path?: string;
  file2Path?: string;
}

function maskValue(value: string): string {
  if (value.length <= 4) return '***';
  return value.slice(0, 2) + '***' + value.slice(-2);
}

function formatEnhancedDiff(
  diff: DiffResult,
  options: FormatOptions
): string {
  const lines: string[] = [];
  const file1Name = options.file1Path || 'File 1';
  const file2Name = options.file2Path || 'File 2';
  
  // Header
  lines.push('');
  lines.push(`${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  lines.push(`${colors.bold}${colors.cyan}║${colors.reset}  ${colors.bold}Environment File Diff${colors.reset}                              ${colors.cyan}║${colors.reset}`);
  lines.push(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  lines.push('');
  lines.push(`${colors.gray}Comparing:${colors.reset}`);
  lines.push(`  ${colors.cyan}◀${colors.reset} ${file1Name}`);
  lines.push(`  ${colors.cyan}▶${colors.reset} ${file2Name}`);
  lines.push('');
  
  const hasDiff = diff.missing.length > 0 || diff.extra.length > 0 || diff.different.length > 0;
  
  if (!hasDiff) {
    lines.push(`${colors.green}${colors.bold}✓ No differences found${colors.reset}`);
    lines.push('');
    return lines.join('\n');
  }
  
  // Summary
  lines.push(`${colors.bold}Summary:${colors.reset}`);
  if (diff.missing.length > 0) {
    lines.push(`  ${colors.red}⊖ ${diff.missing.length} missing${colors.reset} (in ◀ but not ▶)`);
  }
  if (diff.extra.length > 0) {
    lines.push(`  ${colors.green}⊕ ${diff.extra.length} extra${colors.reset} (in ▶ but not ◀)`);
  }
  if (diff.different.length > 0) {
    lines.push(`  ${colors.yellow}≠ ${diff.different.length} different${colors.reset} (different values)`);
  }
  lines.push('');
  
  // Missing variables
  if (diff.missing.length > 0) {
    lines.push(`${colors.red}${colors.bold}⊖ Missing Variables${colors.reset} ${colors.gray}(in ◀ but not ▶)${colors.reset}`);
    lines.push(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    for (const key of diff.missing) {
      const val = options.file1Map?.get(key) || '';
      const displayVal = options.showValues ? val : maskValue(val);
      lines.push(`  ${colors.red}✗${colors.reset} ${colors.bold}${key}${colors.reset} ${colors.gray}=${colors.reset} ${colors.red}${displayVal}${colors.reset}`);
    }
    lines.push('');
  }
  
  // Extra variables
  if (diff.extra.length > 0) {
    lines.push(`${colors.green}${colors.bold}⊕ Extra Variables${colors.reset} ${colors.gray}(in ▶ but not ◀)${colors.reset}`);
    lines.push(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    for (const key of diff.extra) {
      const val = options.file2Map?.get(key) || '';
      const displayVal = options.showValues ? val : maskValue(val);
      lines.push(`  ${colors.green}✓${colors.reset} ${colors.bold}${key}${colors.reset} ${colors.gray}=${colors.reset} ${colors.green}${displayVal}${colors.reset}`);
    }
    lines.push('');
  }
  
  // Different values
  if (diff.different.length > 0) {
    lines.push(`${colors.yellow}${colors.bold}≠ Different Values${colors.reset}`);
    lines.push(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    for (const key of diff.different) {
      const val1 = options.file1Map?.get(key) || '';
      const val2 = options.file2Map?.get(key) || '';
      const displayVal1 = options.showValues ? val1 : maskValue(val1);
      const displayVal2 = options.showValues ? val2 : maskValue(val2);
      
      lines.push(`  ${colors.yellow}~${colors.reset} ${colors.bold}${key}${colors.reset}`);
      lines.push(`    ${colors.cyan}◀${colors.reset} ${colors.red}${displayVal1}${colors.reset}`);
      lines.push(`    ${colors.cyan}▶${colors.reset} ${colors.green}${displayVal2}${colors.reset}`);
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

export function formatDiff(
  diff: DiffResult,
  options: FormatOptions = {}
): string {
  if (options.json) {
    return JSON.stringify(diff, null, 2);
  }

  // Use enhanced visual diff when --color is specified
  if (options.color) {
    return formatEnhancedDiff(diff, options);
  }

  // Helper to apply or strip colors
  const c = (colorCode: string, text: string) => {
    return options.noColor ? text : `${colorCode}${text}${colors.reset}`;
  };

  const lines: string[] = [];

  if (diff.missing.length > 0) {
    lines.push(c(colors.red, 'Missing variables (in first file but not second):'));
    for (const key of diff.missing) {
      if (options.showValues && options.file1Map) {
        const val = options.file1Map.get(key) || '';
        lines.push(`  ${c(colors.red, `- ${key}=${val}`)}`);
      } else {
        lines.push(`  ${c(colors.red, `- ${key}`)}`);
      }
    }
    lines.push('');
  }

  if (diff.extra.length > 0) {
    lines.push(c(colors.yellow, 'Extra variables (in second file but not first):'));
    for (const key of diff.extra) {
      if (options.showValues && options.file2Map) {
        const val = options.file2Map.get(key) || '';
        lines.push(`  ${c(colors.yellow, `+ ${key}=${val}`)}`);
      } else {
        lines.push(`  ${c(colors.yellow, `+ ${key}`)}`);
      }
    }
    lines.push('');
  }

  if (diff.different.length > 0) {
    lines.push(c(colors.blue, 'Different values:'));
    for (const key of diff.different) {
      if (options.showValues && options.file1Map && options.file2Map) {
        const val1 = options.file1Map.get(key) || '';
        const val2 = options.file2Map.get(key) || '';
        lines.push(`  ${c(colors.blue, `~ ${key}`)}`);
        lines.push(`    < ${val1}`);
        lines.push(`    > ${val2}`);
      } else {
        const val1 = options.file1Map?.get(key) || '';
        const val2 = options.file2Map?.get(key) || '';
        lines.push(`  ${c(colors.blue, `~ ${key} (${maskValue(val1)} vs ${maskValue(val2)})`)}`);
      }
    }
    lines.push('');
  }

  if (diff.missing.length === 0 && diff.extra.length === 0 && diff.different.length === 0) {
    lines.push('No differences found.');
  }

  return lines.join('\n');
}
