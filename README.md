# envdiff

Compare .env files. Find missing variables before they break your deploy.

[![npm version](https://img.shields.io/npm/v/envdiff.svg)](https://www.npmjs.com/package/envdiff)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why

You update .env.example but forget to add the new variable to your actual .env. Your app crashes in production.

Or you're debugging why staging works but production doesn't, and it turns out someone forgot to set DATABASE_POOL_SIZE.

This tool catches that.

## Install

```bash
npm install -g envdiff
```

Or use without installing:

```bash
npx envdiff .env.example .env
```

## Usage

Basic comparison:

```bash
envdiff .env.example .env
```

Show actual values (careful with secrets):

```bash
envdiff .env.staging .env.production --show-values
```

JSON output for scripts:

```bash
envdiff .env.example .env --json
```

Strict mode (exits with code 1 if differences found):

```bash
envdiff .env.example .env --strict
```

## CI Integration

Add to your CI pipeline to catch missing environment variables:

### GitHub Actions

```yaml
- name: Check environment variables
  run: npx envdiff .env.example .env --strict
```

### GitLab CI

```yaml
check-env:
  script:
    - npx envdiff .env.example .env --strict
```

### Pre-commit Hook

```bash
#!/bin/sh
npx envdiff .env.example .env --strict
```

## How It Works

Parses both files, compares keys, shows:
- Missing variables (in first file but not second)
- Extra variables (in second file but not first)
- Different values (masked by default)

Zero dependencies. Just reads files and compares strings.

## Options

```
envdiff <file1> <file2> [options]

Options:
  --show-values    Show actual values (default: masked)
  --strict         Exit with code 1 if any differences found
  --json           Output as JSON
  -h, --help       Show help
```

## Examples

Check if your .env has everything from .env.example:

```bash
envdiff .env.example .env
```

Compare staging and production configs:

```bash
envdiff .env.staging .env.production
```

Use in a script:

```bash
if envdiff .env.example .env --strict --json > diff.json; then
  echo "All good"
else
  echo "Missing variables found"
  cat diff.json
fi
```

## License

MIT
