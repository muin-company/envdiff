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

## CI/CD Integration Examples

### GitHub Actions - Complete Pipeline Integration

**Example 1: Multi-Environment Validation**

```yaml
# .github/workflows/env-validation.yml
name: Environment Configuration Validation

on:
  pull_request:
    paths:
      - '.env.example'
      - '.env.*'
      - 'src/**'  # Trigger on code changes too
  push:
    branches: [main, staging, production]

jobs:
  validate-env-files:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [development, staging, production]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Install envdiff
        run: npm install -g envdiff
      
      - name: Create environment file from secrets
        run: |
          cat > .env.${{ matrix.environment }} << EOF
          DATABASE_URL=${{ secrets[format('{0}_DATABASE_URL', matrix.environment)] }}
          API_KEY=${{ secrets[format('{0}_API_KEY', matrix.environment)] }}
          REDIS_URL=${{ secrets[format('{0}_REDIS_URL', matrix.environment)] }}
          SENTRY_DSN=${{ secrets[format('{0}_SENTRY_DSN', matrix.environment)] }}
          EOF
      
      - name: Validate against template
        id: validate
        run: |
          echo "Validating ${{ matrix.environment }} environment..."
          
          if envdiff .env.example .env.${{ matrix.environment }} --strict --json > validation-result.json; then
            echo "✅ ${{ matrix.environment }} environment is valid"
            echo "valid=true" >> $GITHUB_OUTPUT
          else
            echo "❌ ${{ matrix.environment }} environment has issues"
            echo "valid=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Generate validation report
        if: always()
        run: |
          echo "## 🔍 ${{ matrix.environment }} Environment Validation" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          
          if [ -f validation-result.json ]; then
            MISSING=$(jq -r '.missing | length' validation-result.json)
            EXTRA=$(jq -r '.extra | length' validation-result.json)
            
            if [ "$MISSING" -gt 0 ]; then
              echo "### ⚠️ Missing Variables ($MISSING)" >> $GITHUB_STEP_SUMMARY
              jq -r '.missing[]' validation-result.json | sed 's/^/- /' >> $GITHUB_STEP_SUMMARY
              echo "" >> $GITHUB_STEP_SUMMARY
            fi
            
            if [ "$EXTRA" -gt 0 ]; then
              echo "### ℹ️ Extra Variables ($EXTRA)" >> $GITHUB_STEP_SUMMARY
              jq -r '.extra[]' validation-result.json | sed 's/^/- /' >> $GITHUB_STEP_SUMMARY
              echo "" >> $GITHUB_STEP_SUMMARY
            fi
            
            if [ "$MISSING" -eq 0 ] && [ "$EXTRA" -eq 0 ]; then
              echo "✅ All required variables are present" >> $GITHUB_STEP_SUMMARY
            fi
          fi
      
      - name: Upload validation artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: env-validation-${{ matrix.environment }}
          path: |
            validation-result.json
            .env.${{ matrix.environment }}
      
      - name: Fail if validation failed
        if: steps.validate.outputs.valid == 'false'
        run: |
          echo "Environment validation failed for ${{ matrix.environment }}"
          exit 1
```

---

**Example 2: Pre-Deployment Environment Check**

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  validate-environment:
    runs-on: ubuntu-latest
    outputs:
      can-deploy: ${{ steps.check.outputs.can-deploy }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install -g envdiff
      
      - name: Fetch current environment config
        run: |
          # In real scenario, fetch from secret manager or config service
          # For demo, create from GitHub secrets
          
          cat > .env.current << EOF
          NODE_ENV=${{ github.event.inputs.environment }}
          DATABASE_URL=${{ secrets.DATABASE_URL }}
          REDIS_URL=${{ secrets.REDIS_URL }}
          API_KEY=${{ secrets.API_KEY }}
          SENTRY_DSN=${{ secrets.SENTRY_DSN }}
          FEATURE_FLAG_NEW_UI=${{ secrets.FEATURE_FLAG_NEW_UI }}
          EOF
      
      - name: Compare with template
        id: check
        run: |
          echo "🔍 Checking environment configuration..."
          
          # Run comparison
          envdiff .env.example .env.current --strict --json > diff.json
          
          # Parse results
          MISSING=$(jq -r '.missing | length' diff.json)
          
          if [ "$MISSING" -eq 0 ]; then
            echo "✅ Environment is ready for deployment"
            echo "can-deploy=true" >> $GITHUB_OUTPUT
          else
            echo "❌ Missing required variables"
            jq -r '.missing[]' diff.json
            echo "can-deploy=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Create deployment checklist
        run: |
          cat > deployment-checklist.md << EOF
          # Deployment Checklist - ${{ github.event.inputs.environment }}
          
          ## Environment Configuration
          
          - [x] Environment file validated
          - [${{ steps.check.outputs.can-deploy == 'true' && 'x' || ' ' }}] All required variables present
          - [ ] Database migrations ready
          - [ ] CDN cache purged (if needed)
          - [ ] Monitoring alerts configured
          
          ## Validation Results
          
          \`\`\`json
          $(cat diff.json)
          \`\`\`
          
          ## Next Steps
          
          ${{ steps.check.outputs.can-deploy == 'true' && '✅ Proceed with deployment' || '❌ Fix missing variables before deploying' }}
          EOF
          
          cat deployment-checklist.md >> $GITHUB_STEP_SUMMARY
      
      - name: Block deployment if validation fails
        if: steps.check.outputs.can-deploy == 'false'
        run: |
          echo "::error::Missing required environment variables"
          exit 1
  
  deploy:
    needs: validate-environment
    if: needs.validate-environment.outputs.can-deploy == 'true'
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy application
        run: |
          echo "🚀 Deploying to ${{ github.event.inputs.environment }}..."
          # Your deployment steps here
```

---

**Example 3: Environment Drift Detection**

```yaml
# .github/workflows/env-drift-check.yml
name: Environment Drift Detection

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  check-drift:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install envdiff
        run: npm install -g envdiff
      
      - name: Fetch production environment
        run: |
          # Example: Fetch from AWS Secrets Manager
          aws secretsmanager get-secret-value \
            --secret-id prod/app/env \
            --query SecretString \
            --output text > .env.production.current
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
      
      - name: Compare with baseline
        id: drift
        run: |
          # Compare current production with last known good config
          envdiff .env.production.baseline .env.production.current \
            --json > drift-report.json
          
          MISSING=$(jq -r '.missing | length' drift-report.json)
          EXTRA=$(jq -r '.extra | length' drift-report.json)
          DIFFERENT=$(jq -r '.different | length' drift-report.json)
          
          TOTAL=$((MISSING + EXTRA + DIFFERENT))
          
          echo "drift-count=$TOTAL" >> $GITHUB_OUTPUT
          
          if [ "$TOTAL" -gt 0 ]; then
            echo "⚠️ Environment drift detected: $TOTAL differences"
          else
            echo "✅ No drift detected"
          fi
      
      - name: Create drift report
        if: steps.drift.outputs.drift-count != '0'
        run: |
          cat > drift-report.md << EOF
          # ⚠️ Environment Drift Detected
          
          **Environment:** Production  
          **Checked:** $(date -u +"%Y-%m-%d %H:%M UTC")  
          **Differences:** ${{ steps.drift.outputs.drift-count }}
          
          ## Changes Detected
          
          \`\`\`json
          $(cat drift-report.json)
          \`\`\`
          
          ## Possible Causes
          
          - Manual changes made directly in production
          - Secrets rotated without updating baseline
          - Deployment script modified environment
          - Infrastructure team made changes
          
          ## Recommended Actions
          
          1. Review changes with the team
          2. Update baseline if changes are intentional
          3. Revert unauthorized changes
          4. Update deployment procedures to prevent drift
          EOF
          
          cat drift-report.md >> $GITHUB_STEP_SUMMARY
      
      - name: Send alert to Slack
        if: steps.drift.outputs.drift-count != '0'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Environment drift detected in production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Environment Drift Alert*\n${{ steps.drift.outputs.drift-count }} differences detected in production environment."
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Create issue if drift detected
        if: steps.drift.outputs.drift-count != '0'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('drift-report.md', 'utf8');
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Environment drift detected in production (${new Date().toISOString().split('T')[0]})`,
              body: report,
              labels: ['environment', 'production', 'drift-alert']
            });
```

---

### GitLab CI/CD Integration

**Example 4: Environment Validation Pipeline**

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - deploy

variables:
  ENVDIFF_VERSION: "latest"

.env-validate-template:
  image: node:18-alpine
  before_script:
    - npm install -g envdiff@${ENVDIFF_VERSION}
  script:
    - echo "Validating $ENV_NAME environment..."
    - envdiff .env.example .env.$ENV_NAME --strict --json | tee validation.json
    - |
      if [ $? -ne 0 ]; then
        echo "❌ Validation failed for $ENV_NAME"
        cat validation.json | jq .
        exit 1
      fi
    - echo "✅ $ENV_NAME environment validated successfully"
  artifacts:
    when: always
    paths:
      - validation.json
    reports:
      junit: validation.json
    expire_in: 7 days

validate:development:
  extends: .env-validate-template
  stage: validate
  variables:
    ENV_NAME: "development"
  before_script:
    - npm install -g envdiff
    - |
      cat > .env.development << EOF
      DATABASE_URL=$DEV_DATABASE_URL
      API_KEY=$DEV_API_KEY
      REDIS_URL=$DEV_REDIS_URL
      EOF
  only:
    - branches
  except:
    - main
    - production

validate:staging:
  extends: .env-validate-template
  stage: validate
  variables:
    ENV_NAME: "staging"
  before_script:
    - npm install -g envdiff
    - |
      cat > .env.staging << EOF
      DATABASE_URL=$STAGING_DATABASE_URL
      API_KEY=$STAGING_API_KEY
      REDIS_URL=$STAGING_REDIS_URL
      SENTRY_DSN=$STAGING_SENTRY_DSN
      EOF
  only:
    - main

validate:production:
  extends: .env-validate-template
  stage: validate
  variables:
    ENV_NAME: "production"
  before_script:
    - npm install -g envdiff
    - |
      cat > .env.production << EOF
      DATABASE_URL=$PROD_DATABASE_URL
      API_KEY=$PROD_API_KEY
      REDIS_URL=$PROD_REDIS_URL
      SENTRY_DSN=$PROD_SENTRY_DSN
      STRIPE_SECRET_KEY=$PROD_STRIPE_SECRET_KEY
      EOF
  only:
    - production
  when: manual

deploy:production:
  stage: deploy
  dependencies:
    - validate:production
  script:
    - echo "Deploying to production..."
    - ./deploy.sh production
  only:
    - production
  when: manual
  environment:
    name: production
    url: https://app.example.com
```

---

**Example 5: Merge Request Environment Check**

```yaml
# .gitlab-ci.yml
env-check-mr:
  stage: validate
  image: node:18-alpine
  only:
    - merge_requests
  script:
    - npm install -g envdiff
    
    # Check if .env.example was modified
    - |
      if git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA HEAD | grep -q ".env.example"; then
        echo "🔍 .env.example was modified, checking for impact..."
        
        # Compare old and new .env.example
        git show $CI_MERGE_REQUEST_DIFF_BASE_SHA:.env.example > .env.example.old
        
        envdiff .env.example.old .env.example --json > env-changes.json
        
        ADDED=$(jq -r '.extra | length' env-changes.json)
        REMOVED=$(jq -r '.missing | length' env-changes.json)
        
        # Create comment body
        cat > comment.md << EOF
      ## 🔧 Environment Variables Changed
      
      **Added variables:** $ADDED  
      **Removed variables:** $REMOVED
      
      ### New Variables
      $(jq -r '.extra[] | "- `" + . + "`"' env-changes.json)
      
      ### Removed Variables
      $(jq -r '.missing[] | "- `" + . + "`"' env-changes.json)
      
      ### ⚠️ Action Required
      - Update all environment files (.env.staging, .env.production)
      - Update deployment documentation
      - Update CI/CD secrets if needed
      - Notify team before merging
      EOF
        
        # Post comment to MR
        curl --request POST \
          --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
          "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes" \
          --form "body=@comment.md"
      else
        echo "✅ .env.example unchanged"
      fi
  artifacts:
    paths:
      - env-changes.json
      - comment.md
    expire_in: 1 week
```

---

### CircleCI Integration

**Example 6: Environment Configuration Workflow**

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.0

executors:
  env-validator:
    docker:
      - image: cimg/node:18.0
    working_directory: ~/project

commands:
  install-envdiff:
    steps:
      - run:
          name: Install envdiff
          command: npm install -g envdiff

  validate-environment:
    parameters:
      env-name:
        type: string
      env-file:
        type: string
    steps:
      - run:
          name: Validate << parameters.env-name >> environment
          command: |
            echo "🔍 Validating << parameters.env-name >>..."
            
            if envdiff .env.example << parameters.env-file >> --strict; then
              echo "✅ << parameters.env-name >> validation passed"
            else
              echo "❌ << parameters.env-name >> validation failed"
              
              # Generate detailed report
              envdiff .env.example << parameters.env-file >> --json > /tmp/validation-<< parameters.env-name >>.json
              
              echo "Missing variables:"
              jq -r '.missing[]' /tmp/validation-<< parameters.env-name >>.json
              
              exit 1
            fi
      
      - store_artifacts:
          path: /tmp/validation-<< parameters.env-name >>.json
          destination: env-validation/<< parameters.env-name >>

jobs:
  validate-all-environments:
    executor: env-validator
    steps:
      - checkout
      - install-envdiff
      
      - run:
          name: Create environment files from context
          command: |
            # Development
            cat > .env.development << EOF
            DATABASE_URL=${DEV_DATABASE_URL}
            API_KEY=${DEV_API_KEY}
            EOF
            
            # Staging
            cat > .env.staging << EOF
            DATABASE_URL=${STAGING_DATABASE_URL}
            API_KEY=${STAGING_API_KEY}
            SENTRY_DSN=${STAGING_SENTRY_DSN}
            EOF
            
            # Production
            cat > .env.production << EOF
            DATABASE_URL=${PROD_DATABASE_URL}
            API_KEY=${PROD_API_KEY}
            SENTRY_DSN=${PROD_SENTRY_DSN}
            STRIPE_KEY=${PROD_STRIPE_KEY}
            EOF
      
      - validate-environment:
          env-name: "development"
          env-file: ".env.development"
      
      - validate-environment:
          env-name: "staging"
          env-file: ".env.staging"
      
      - validate-environment:
          env-name: "production"
          env-file: ".env.production"
      
      - run:
          name: Generate validation summary
          command: |
            echo "# Environment Validation Summary" > /tmp/summary.md
            echo "" >> /tmp/summary.md
            echo "✅ All environments validated successfully" >> /tmp/summary.md
            echo "" >> /tmp/summary.md
            echo "- Development: OK" >> /tmp/summary.md
            echo "- Staging: OK" >> /tmp/summary.md
            echo "- Production: OK" >> /tmp/summary.md
      
      - store_artifacts:
          path: /tmp/summary.md
          destination: validation-summary.md

  deploy-with-env-check:
    executor: env-validator
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - install-envdiff
      
      - run:
          name: Pre-deployment environment check
          command: |
            # Fetch current production environment
            # (In real scenario, use AWS Secrets Manager, Vault, etc.)
            aws secretsmanager get-secret-value \
              --secret-id << parameters.environment >>/env \
              --query SecretString \
              --output text > .env.current
            
            # Validate
            if ! envdiff .env.example .env.current --strict; then
              echo "🚨 Environment validation failed - blocking deployment"
              exit 1
            fi
            
            echo "✅ Environment validated - proceeding with deployment"
      
      - run:
          name: Deploy
          command: |
            echo "🚀 Deploying to << parameters.environment >>..."
            ./deploy.sh << parameters.environment >>

workflows:
  version: 2
  validate-and-deploy:
    jobs:
      - validate-all-environments:
          context:
            - development
            - staging
            - production
      
      - deploy-with-env-check:
          name: deploy-staging
          environment: staging
          requires:
            - validate-all-environments
          filters:
            branches:
              only: main
      
      - approve-production:
          type: approval
          requires:
            - deploy-staging
          filters:
            branches:
              only: main
      
      - deploy-with-env-check:
          name: deploy-production
          environment: production
          requires:
            - approve-production
          filters:
            branches:
              only: main
```

---

### Jenkins Pipeline Integration

**Example 7: Declarative Pipeline with Environment Validation**

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        ENVDIFF_VERSION = 'latest'
    }
    
    stages {
        stage('Setup') {
            steps {
                script {
                    sh 'npm install -g envdiff@${ENVDIFF_VERSION}'
                }
            }
        }
        
        stage('Validate Environments') {
            parallel {
                stage('Validate Development') {
                    steps {
                        script {
                            withCredentials([
                                string(credentialsId: 'dev-database-url', variable: 'DB_URL'),
                                string(credentialsId: 'dev-api-key', variable: 'API_KEY')
                            ]) {
                                sh '''
                                    cat > .env.development << EOF
DATABASE_URL=${DB_URL}
API_KEY=${API_KEY}
EOF
                                    envdiff .env.example .env.development --strict --json > dev-validation.json
                                '''
                                
                                archiveArtifacts artifacts: 'dev-validation.json', allowEmptyArchive: true
                            }
                        }
                    }
                }
                
                stage('Validate Staging') {
                    steps {
                        script {
                            withCredentials([
                                string(credentialsId: 'staging-database-url', variable: 'DB_URL'),
                                string(credentialsId: 'staging-api-key', variable: 'API_KEY'),
                                string(credentialsId: 'staging-sentry-dsn', variable: 'SENTRY_DSN')
                            ]) {
                                sh '''
                                    cat > .env.staging << EOF
DATABASE_URL=${DB_URL}
API_KEY=${API_KEY}
SENTRY_DSN=${SENTRY_DSN}
EOF
                                    envdiff .env.example .env.staging --strict --json > staging-validation.json
                                '''
                                
                                archiveArtifacts artifacts: 'staging-validation.json', allowEmptyArchive: true
                            }
                        }
                    }
                }
                
                stage('Validate Production') {
                    when {
                        branch 'main'
                    }
                    steps {
                        script {
                            withCredentials([
                                string(credentialsId: 'prod-database-url', variable: 'DB_URL'),
                                string(credentialsId: 'prod-api-key', variable: 'API_KEY'),
                                string(credentialsId: 'prod-sentry-dsn', variable: 'SENTRY_DSN'),
                                string(credentialsId: 'prod-stripe-key', variable: 'STRIPE_KEY')
                            ]) {
                                sh '''
                                    cat > .env.production << EOF
DATABASE_URL=${DB_URL}
API_KEY=${API_KEY}
SENTRY_DSN=${SENTRY_DSN}
STRIPE_SECRET_KEY=${STRIPE_KEY}
EOF
                                    
                                    if ! envdiff .env.example .env.production --strict --json > prod-validation.json; then
                                        echo "❌ Production environment validation failed"
                                        cat prod-validation.json | jq .
                                        exit 1
                                    fi
                                    
                                    echo "✅ Production environment validated"
                                '''
                                
                                archiveArtifacts artifacts: 'prod-validation.json', allowEmptyArchive: true
                            }
                        }
                    }
                }
            }
        }
        
        stage('Generate Report') {
            steps {
                script {
                    sh '''
                        echo "# Environment Validation Report" > validation-report.md
                        echo "" >> validation-report.md
                        echo "**Build:** ${BUILD_NUMBER}" >> validation-report.md
                        echo "**Branch:** ${GIT_BRANCH}" >> validation-report.md
                        echo "**Date:** $(date)" >> validation-report.md
                        echo "" >> validation-report.md
                        
                        echo "## Results" >> validation-report.md
                        echo "" >> validation-report.md
                        
                        if [ -f dev-validation.json ]; then
                            echo "### Development" >> validation-report.md
                            jq . dev-validation.json >> validation-report.md
                            echo "" >> validation-report.md
                        fi
                        
                        if [ -f staging-validation.json ]; then
                            echo "### Staging" >> validation-report.md
                            jq . staging-validation.json >> validation-report.md
                            echo "" >> validation-report.md
                        fi
                        
                        if [ -f prod-validation.json ]; then
                            echo "### Production" >> validation-report.md
                            jq . prod-validation.json >> validation-report.md
                        fi
                    '''
                    
                    archiveArtifacts artifacts: 'validation-report.md'
                    publishHTML([
                        reportDir: '.',
                        reportFiles: 'validation-report.md',
                        reportName: 'Environment Validation Report'
                    ])
                }
            }
        }
        
        stage('Deploy') {
            when {
                allOf {
                    branch 'main'
                    expression {
                        currentBuild.result == null || currentBuild.result == 'SUCCESS'
                    }
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                
                script {
                    sh './deploy.sh production'
                }
            }
        }
    }
    
    post {
        failure {
            emailext (
                subject: "Environment Validation Failed - Build #${BUILD_NUMBER}",
                body: """
                    Environment validation failed for build #${BUILD_NUMBER}.
                    
                    Check the build console output for details:
                    ${BUILD_URL}console
                    
                    Validation reports:
                    ${BUILD_URL}artifact/
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

---

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
