export interface DiffResult {
  missing: string[];      // In file1 but not in file2
  extra: string[];        // In file2 but not in file1
  different: string[];    // In both but different values
}

export function compareEnvMaps(
  file1: Map<string, string>,
  file2: Map<string, string>
): DiffResult {
  const missing: string[] = [];
  const extra: string[] = [];
  const different: string[] = [];

  // Check what's in file1
  for (const [key, value1] of file1.entries()) {
    if (!file2.has(key)) {
      missing.push(key);
    } else {
      const value2 = file2.get(key)!;
      if (value1 !== value2) {
        different.push(key);
      }
    }
  }

  // Check what's extra in file2
  for (const key of file2.keys()) {
    if (!file1.has(key)) {
      extra.push(key);
    }
  }

  return { missing, extra, different };
}
