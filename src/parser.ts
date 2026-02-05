import { readFileSync } from 'fs';

export interface EnvVar {
  key: string;
  value: string;
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = readFileSync(filePath, 'utf-8');
  const vars = new Map<string, string>();

  for (let line of content.split('\n')) {
    line = line.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Find first = sign
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    vars.set(key, value);
  }

  return vars;
}
