import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseEnvFile } from './parser.js';
import { compareEnvMaps } from './compare.js';

function createTestEnv(dir: string, filename: string, content: string): string {
  const path = join(dir, filename);
  writeFileSync(path, content);
  return path;
}

test('parseEnvFile - basic parsing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'envdiff-test-'));
  const file = createTestEnv(dir, '.env', `
KEY1=value1
KEY2=value2
# Comment line
KEY3="quoted value"
KEY4='single quoted'

  `.trim());

  const result = parseEnvFile(file);

  assert.equal(result.size, 4);
  assert.equal(result.get('KEY1'), 'value1');
  assert.equal(result.get('KEY2'), 'value2');
  assert.equal(result.get('KEY3'), 'quoted value');
  assert.equal(result.get('KEY4'), 'single quoted');

  rmSync(dir, { recursive: true });
});

test('compareEnvMaps - identical files', () => {
  const map1 = new Map([['KEY1', 'value1'], ['KEY2', 'value2']]);
  const map2 = new Map([['KEY1', 'value1'], ['KEY2', 'value2']]);

  const diff = compareEnvMaps(map1, map2);

  assert.equal(diff.missing.length, 0);
  assert.equal(diff.extra.length, 0);
  assert.equal(diff.different.length, 0);
});

test('compareEnvMaps - missing variables', () => {
  const map1 = new Map([['KEY1', 'value1'], ['KEY2', 'value2'], ['KEY3', 'value3']]);
  const map2 = new Map([['KEY1', 'value1']]);

  const diff = compareEnvMaps(map1, map2);

  assert.equal(diff.missing.length, 2);
  assert.ok(diff.missing.includes('KEY2'));
  assert.ok(diff.missing.includes('KEY3'));
  assert.equal(diff.extra.length, 0);
  assert.equal(diff.different.length, 0);
});

test('compareEnvMaps - extra variables', () => {
  const map1 = new Map([['KEY1', 'value1']]);
  const map2 = new Map([['KEY1', 'value1'], ['KEY2', 'value2'], ['KEY3', 'value3']]);

  const diff = compareEnvMaps(map1, map2);

  assert.equal(diff.missing.length, 0);
  assert.equal(diff.extra.length, 2);
  assert.ok(diff.extra.includes('KEY2'));
  assert.ok(diff.extra.includes('KEY3'));
  assert.equal(diff.different.length, 0);
});

test('compareEnvMaps - different values', () => {
  const map1 = new Map([['KEY1', 'value1'], ['KEY2', 'old']]);
  const map2 = new Map([['KEY1', 'value1'], ['KEY2', 'new']]);

  const diff = compareEnvMaps(map1, map2);

  assert.equal(diff.missing.length, 0);
  assert.equal(diff.extra.length, 0);
  assert.equal(diff.different.length, 1);
  assert.ok(diff.different.includes('KEY2'));
});

test('compareEnvMaps - complex scenario', () => {
  const map1 = new Map([
    ['SHARED', 'same'],
    ['MISSING', 'will be missing'],
    ['DIFFERENT', 'old value'],
  ]);
  const map2 = new Map([
    ['SHARED', 'same'],
    ['EXTRA', 'new variable'],
    ['DIFFERENT', 'new value'],
  ]);

  const diff = compareEnvMaps(map1, map2);

  assert.equal(diff.missing.length, 1);
  assert.ok(diff.missing.includes('MISSING'));
  assert.equal(diff.extra.length, 1);
  assert.ok(diff.extra.includes('EXTRA'));
  assert.equal(diff.different.length, 1);
  assert.ok(diff.different.includes('DIFFERENT'));
});

console.log('All tests passed!');
