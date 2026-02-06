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
