/**
 * Template generation - Create .env from .env.example
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

export interface TemplateOptions {
  source: string;
  target: string;
  overwrite?: boolean;
  preserveComments?: boolean;
  placeholder?: string;
}

/**
 * Generate .env file from .env.example template
 */
export function generateFromTemplate(options: TemplateOptions): void {
  const {
    source,
    target,
    overwrite = false,
    preserveComments = true,
    placeholder = ''
  } = options;

  // Check if source exists
  if (!existsSync(source)) {
    throw new Error(`Source file not found: ${source}`);
  }

  // Check if target exists and overwrite is false
  if (existsSync(target) && !overwrite) {
    throw new Error(`Target file already exists: ${target}. Use --overwrite to replace it.`);
  }

  // Read source file
  const content = readFileSync(source, 'utf-8');
  const lines = content.split('\n');

  // Process each line
  const outputLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Preserve empty lines
    if (trimmed === '') {
      outputLines.push('');
      continue;
    }

    // Preserve comments
    if (trimmed.startsWith('#')) {
      if (preserveComments) {
        outputLines.push(line);
      }
      continue;
    }

    // Parse variable line: KEY=value
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;

      // Check if it's already a placeholder
      if (isPlaceholder(value)) {
        outputLines.push(`${key}=${placeholder}`);
      } else {
        // Generate placeholder from value hints
        const hint = generatePlaceholder(key, value, placeholder);
        outputLines.push(`${key}=${hint}`);
      }
    } else {
      // Keep line as-is if not a valid env variable
      outputLines.push(line);
    }
  }

  // Write to target file
  const output = outputLines.join('\n');
  writeFileSync(target, output, 'utf-8');
}

/**
 * Check if a value is a placeholder
 */
function isPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  const placeholders = [
    '',
    'your-',
    'todo',
    'change-me',
    'replace-me',
    'xxx',
    '***',
    '<',
    '{{',
  ];

  return placeholders.some(p => trimmed.toLowerCase().includes(p));
}

/**
 * Generate a helpful placeholder from key and value
 */
function generatePlaceholder(key: string, value: string, defaultPlaceholder: string): string {
  if (defaultPlaceholder) {
    return defaultPlaceholder;
  }

  // If value is already a placeholder-like string, keep it
  if (isPlaceholder(value)) {
    return value;
  }

  // Generate smart placeholders based on key patterns
  const keyLower = key.toLowerCase();

  // Database URLs
  if (keyLower.includes('database_url') || keyLower.includes('db_url')) {
    return 'postgresql://user:password@localhost:5432/dbname';
  }

  // Redis URLs
  if (keyLower.includes('redis')) {
    return 'redis://localhost:6379';
  }

  // API keys
  if (keyLower.includes('api_key') || keyLower.includes('apikey')) {
    return 'your-api-key-here';
  }

  // Secrets
  if (keyLower.includes('secret') || keyLower.includes('token')) {
    return 'your-secret-here';
  }

  // Passwords
  if (keyLower.includes('password') || keyLower.includes('pass')) {
    return 'your-password-here';
  }

  // Ports
  if (keyLower.includes('port')) {
    return '3000';
  }

  // Hosts
  if (keyLower.includes('host')) {
    return 'localhost';
  }

  // Emails
  if (keyLower.includes('email') || keyLower.includes('mail')) {
    return 'user@example.com';
  }

  // URLs
  if (keyLower.includes('url')) {
    return 'https://example.com';
  }

  // Booleans
  if (keyLower.includes('enable') || keyLower.includes('debug')) {
    return 'false';
  }

  // Default: empty or indicate change needed
  return 'CHANGE_ME';
}
