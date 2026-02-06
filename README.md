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

### Compare Mode

Basic comparison:

```bash
envdiff .env.example .env
```

Enhanced visual diff with colors:

```bash
envdiff .env.example .env --color
```

Show actual values (careful with secrets):

```bash
envdiff .env.staging .env.production --show-values
```

Visual diff with actual values:

```bash
envdiff .env.local .env.production --color --show-values
```

JSON output for scripts:

```bash
envdiff .env.example .env --json
```

Disable colors (for CI/CD logs):

```bash
envdiff .env.example .env --no-color
```

Strict mode (exits with code 1 if differences found):

```bash
envdiff .env.example .env --strict
```

### Template Generation Mode (NEW!)

Generate .env from .env.example template:

```bash
envdiff --template .env.example .env
```

**What it does:**
- Creates `.env` from `.env.example`
- Preserves comments and structure
- Generates smart placeholders based on variable names
- Protects against accidental overwrites

**Smart Placeholders:**
```bash
# .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/db
API_KEY=sk-xxxxxxxxxxxxx
PORT=3000
DEBUG_MODE=false

# Generated .env (smart placeholders)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_KEY=your-api-key-here
PORT=3000
DEBUG_MODE=false
```

**Overwrite existing file:**
```bash
envdiff --template .env.example .env --overwrite
```

**Custom placeholder:**
```bash
envdiff --template .env.example .env --placeholder "TODO"
```

**Typical workflow:**
```bash
# 1. Clone a new project
git clone https://github.com/user/project
cd project

# 2. Generate .env from template
envdiff --template .env.example .env

# 3. Edit .env with your actual values
nano .env

# 4. Verify you have all required variables
envdiff .env.example .env
```

## Options

| Option | Description |
|--------|-------------|
| `--show-values` | Show actual values instead of masked (⚠️ careful with secrets) |
| `--color` | Enhanced visual diff with colors, icons, and side-by-side comparison |
| `--no-color` | Disable all colored output (useful for CI/CD logs) |
| `--strict` | Exit with code 1 if any differences found (for CI/CD) |
| `--json` | Output as JSON for programmatic parsing |
| `-h, --help` | Show help message |

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

### Example 1: Perfect match (no differences)

```bash
$ envdiff .env.example .env

Comparing .env.example → .env

✓ All variables match!

Variables in both files: 12
Missing: 0
Extra: 0
```

Exit code: 0 (safe to deploy)

### Example 2: Missing variables in target

```bash
$ envdiff .env.example .env

Comparing .env.example → .env

⚠️ Missing variables in .env:

  - DATABASE_POOL_SIZE
  - REDIS_URL
  - SENTRY_DSN

⚠️ 3 variables from .env.example are missing in .env

Variables in .env.example: 15
Variables in .env: 12
```

Exit code: 1 (blocks deployment in CI)

### Example 3: Extra variables (not in example)

```bash
$ envdiff .env.example .env

Comparing .env.example → .env

✓ All required variables present

ℹ️ Extra variables in .env (not in .env.example):

  - DEBUG_MODE
  - LOCAL_OVERRIDE_API
  - EXPERIMENTAL_FEATURE_FLAG

These might be intentional or leftover from testing.
```

Helps identify obsolete variables.

### Example 4: Comparing staging vs production

```bash
$ envdiff .env.staging .env.production

Comparing .env.staging → .env.production

⚠️ Missing variables in .env.production:

  - FEATURE_FLAG_NEW_UI
  - MOCK_PAYMENT_GATEWAY

ℹ️ Extra variables in .env.production:

  - STRIPE_WEBHOOK_SECRET
  - CLOUDFLARE_API_KEY

⚠️ 2 variables from .env.staging are missing in .env.production
ℹ️ 2 extra variables in .env.production
```

Catch environment-specific configuration drift.

### Example 5: Enhanced Visual Diff (--color)

```bash
$ envdiff .env.example .env --color

╔════════════════════════════════════════════════════════════╗
║  Environment File Diff                                     ║
╚════════════════════════════════════════════════════════════╝

Comparing:
  ◀ .env.example
  ▶ .env

Summary:
  ⊖ 2 missing (in ◀ but not ▶)
  ⊕ 1 extra (in ▶ but not ◀)
  ≠ 3 different (different values)

⊖ Missing Variables (in ◀ but not ▶)
────────────────────────────────────────────────────────────
  ✗ DATABASE_POOL_SIZE = 10
  ✗ REDIS_URL = re***db

⊕ Extra Variables (in ▶ but not ◀)
────────────────────────────────────────────────────────────
  ✓ DEBUG_MODE = tr***se

≠ Different Values
────────────────────────────────────────────────────────────
  ~ API_URL
    ◀ ht***om
    ▶ ht***io

  ~ DATABASE_HOST
    ◀ lo***st
    ▶ pr***om

  ~ LOG_LEVEL
    ◀ debug
    ▶ error
```

Perfect for visual review and debugging configuration issues!

### Example 6: Show actual values (dangerous!)

```bash
$ envdiff .env.staging .env.production --show-values

Comparing .env.staging → .env.production

Variables with different values:

  DATABASE_URL
    .env.staging:    postgres://staging-db:5432/app
    .env.production: postgres://prod-db:5432/app

  NODE_ENV
    .env.staging:    staging
    .env.production: production

  API_RATE_LIMIT
    .env.staging:    100
    .env.production: 1000

⚠️ 3 variables have different values
```

**Warning:** Only use `--show-values` in secure environments. Never log secrets!

### Example 6: JSON output for automation

```bash
$ envdiff .env.example .env --json

{
  "file1": ".env.example",
  "file2": ".env",
  "missing": [
    "DATABASE_POOL_SIZE",
    "REDIS_URL",
    "SENTRY_DSN"
  ],
  "extra": [
    "DEBUG_MODE"
  ],
  "different": [],
  "totalFile1": 15,
  "totalFile2": 13,
  "missingCount": 3,
  "extraCount": 1,
  "differentCount": 0
}
```

Use with jq for custom processing:

```bash
$ envdiff .env.example .env --json | jq -r '.missing[]'
DATABASE_POOL_SIZE
REDIS_URL
SENTRY_DSN

# Post to Slack
$ MISSING=$(envdiff .env.example .env --json | jq '.missingCount')
$ if [ $MISSING -gt 0 ]; then
    curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"⚠️ $MISSING env vars missing!\"}"
  fi
```

### Example 7: CI pipeline integration

```bash
# .github/workflows/deploy.yml
- name: Validate environment variables
  run: |
    npx envdiff .env.example .env.production --strict
    
# If differences exist, exit code 1 → workflow fails
```

Practical script for pre-deployment check:

```bash
#!/bin/bash
# scripts/check-env.sh

echo "🔍 Checking environment variables..."

if npx envdiff .env.example .env --strict; then
  echo "✅ Environment configuration is valid"
  exit 0
else
  echo "❌ Environment variables are incomplete!"
  echo ""
  echo "Fix by:"
  echo "  1. Copy missing variables from .env.example"
  echo "  2. Set appropriate values for your environment"
  echo "  3. Run this script again"
  exit 1
fi
```

### Example 8: Error handling

```bash
$ envdiff .env.example .env.missing

Error: File not found: .env.missing

Make sure both files exist:
  - .env.example ✓
  - .env.missing ✗

Exit code: 1

$ envdiff .env.malformed .env

Error: Failed to parse .env.malformed
Line 5: Invalid syntax (no = sign)

FOO=bar
BAZ=qux
INVALID LINE HERE  ← Parse error

Fix the syntax and try again.
```

### Example 9: Value masking (default behavior)

```bash
$ envdiff .env.staging .env.production

Comparing .env.staging → .env.production

Variables with different values:

  DATABASE_PASSWORD
    .env.staging:    ********
    .env.production: ********

  API_KEY
    .env.staging:    ********
    .env.production: ********

⚠️ 2 variables have different values (values masked for security)
```

Values are masked by default to prevent accidental secret exposure in logs.

## Real-World Examples

### 1. Multi-Environment Validation

Check all environments against the template:

```bash
# Verify all environments have required variables
for env in dev staging production; do
  echo "Checking .env.$env"
  envdiff .env.example .env.$env --strict || echo "❌ $env missing variables"
done

# Or parallel
parallel envdiff .env.example {} --strict ::: .env.dev .env.staging .env.production
```

### 2. CI/CD Environment Gate

Prevent deployments with missing env variables:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate environment variables
        run: |
          # Create .env from secrets
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" > .env.production
          echo "API_KEY=${{ secrets.API_KEY }}" >> .env.production
          
          # Compare with template
          npx envdiff .env.example .env.production --strict
      
      - name: Deploy
        if: success()
        run: npm run deploy
```

### 3. Pre-Deployment Checklist

Generate a checklist of required environment variables:

```bash
# Generate missing vars report
envdiff .env.example .env.production --json | \
  jq -r '.missing[]' > missing-vars.txt

if [ -s missing-vars.txt ]; then
  echo "⚠️  Missing environment variables for production:"
  cat missing-vars.txt
  echo ""
  echo "Set these before deploying:"
  while read var; do
    echo "  export $var=..."
  done < missing-vars.txt
  exit 1
fi
```

### 4. Developer Onboarding

Help new developers set up their environment:

```bash
#!/bin/bash
# scripts/setup-env.sh

echo "🚀 Setting up development environment..."

# Copy template
cp .env.example .env

# Check what's missing
missing=$(envdiff .env.example .env --json | jq -r '.missing[]')

if [ -z "$missing" ]; then
  echo "✅ All environment variables are set"
else
  echo "⚠️  Please set the following variables in .env:"
  echo "$missing" | while read var; do
    echo "  - $var"
  done
  
  echo ""
  echo "Ask your team lead for the values."
fi
```

Add to package.json:

```json
{
  "scripts": {
    "setup": "bash scripts/setup-env.sh",
    "check:env": "envdiff .env.example .env --strict"
  }
}
```

### 5. Automated .env.example Updates

Keep .env.example in sync:

```bash
# Find all used env variables in code
grep -rh "process.env." src/ | \
  sed -n 's/.*process\.env\.\([A-Z_]*\).*/\1/p' | \
  sort -u > used-vars.txt

# Generate new .env.example
echo "# Auto-generated from codebase" > .env.example.new
while read var; do
  echo "$var=" >> .env.example.new
done < used-vars.txt

# Compare with current
envdiff .env.example .env.example.new
```

### 6. Secret Rotation Verification

After rotating secrets, verify all environments updated:

```bash
# Check staging and production have new secret
if envdiff .env.staging .env.production --show-values | grep -q "API_KEY"; then
  echo "⚠️  API_KEY differs between staging and production"
  echo "Did you rotate in both environments?"
  exit 1
fi
```

### 7. Docker Compose Validation

Ensure docker-compose.yml environment matches .env:

```bash
# Extract env vars from docker-compose.yml
grep "^\s*-\s*[A-Z_]*=" docker-compose.yml | \
  sed 's/.*- \([A-Z_]*\)=.*/\1/' > docker-vars.txt

# Compare with .env
envdiff <(cat docker-vars.txt | awk '{print $1"="}') .env --strict
```

### 8. Environment Migration Helper

Migrate from .env to a secret manager:

```bash
# Generate upload script for AWS Secrets Manager
envdiff .env.old .env --json | jq -r '.extra[]' | while read var; do
  value=$(grep "^$var=" .env | cut -d= -f2-)
  echo "aws secretsmanager put-secret-value \\"
  echo "  --secret-id $var \\"
  echo "  --secret-string '$value'"
done > migrate-to-secrets.sh

# Or for HashiCorp Vault
envdiff .env.old .env --json | jq -r '.extra[]' | while read var; do
  value=$(grep "^$var=" .env | cut -d= -f2-)
  echo "vault kv put secret/$var value='$value'"
done > migrate-to-vault.sh
```

### 9. Cross-Project Consistency

Ensure microservices share common env structure:

```bash
# Check all services use same base variables
services="api gateway worker"

for service in $services; do
  echo "Checking $service"
  envdiff .env.base services/$service/.env.example --strict || {
    echo "❌ $service missing base variables"
    exit 1
  }
done
```

### 10. PR Environment Validation

Auto-comment on PRs if .env.example needs updating:

```yaml
# .github/workflows/env-check.yml
name: Environment Check

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.base_ref }}
          path: base
      
      - name: Compare .env.example changes
        id: diff
        run: |
          npx envdiff base/.env.example .env.example --json > diff.json
          echo "has_diff=$(jq -e '.missing | length > 0 or .extra | length > 0' diff.json)" >> $GITHUB_OUTPUT
      
      - name: Comment on PR
        if: steps.diff.outputs.has_diff == 'true'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const diff = JSON.parse(fs.readFileSync('diff.json'));
            let comment = '### ⚠️ Environment Variables Changed\n\n';
            
            if (diff.extra.length > 0) {
              comment += '**New variables added:**\n';
              diff.extra.forEach(v => comment += `- \`${v}\`\n`);
            }
            
            if (diff.missing.length > 0) {
              comment += '\n**Variables removed:**\n';
              diff.missing.forEach(v => comment += `- \`${v}\`\n`);
            }
            
            comment += '\nMake sure to update all environments before deploying.';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## License

MIT
