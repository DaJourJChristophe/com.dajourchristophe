# Scripts

Automation and host-side helpers live here.

## Branch strategy

- `dev`: everyday integration branch with CI validation and no version bumping
- `stage`: promotion branch that validates and opens an auto-merge PR into `main`
- `main`: production release branch with automated minor version tagging and deploys

Recommended flow:

1. push to `dev`
2. open a PR from `dev` to `stage`
3. merge into `stage`
4. CI validates `stage` and opens an auto-merge PR into `main`
5. merging into `main` triggers the minor version bump, tag, and production deploy

## Remote AWS deploy

Run this on the EC2 instance:

```bash
bash scripts/deploy-aws-instance.sh
```

Optional overrides:

```bash
REPO_URL=https://github.com/DaJourJChristophe/com.dajourchristophe.git \
REPO_DIR=$HOME/com.dajourchristophe \
TARGET_REF=main \
bash scripts/deploy-aws-instance.sh
```

The deploy flow will:

1. install `git` if it is missing
2. clone or update the repository
3. install Docker and Docker Compose on Debian
4. deploy the production stack with `nginx` in front of the app

## Version bump helpers

Minor release bump:

```bash
node scripts/bump-version.mjs minor
```

Major release bump:

```bash
node scripts/bump-version.mjs major
```

## Protecting stage and main

Use a GitHub token with admin rights to the repository:

```bash
GITHUB_TOKEN=<admin-token> GITHUB_REPOSITORY=DaJourJChristophe/com.dajourchristophe node scripts/configure-branch-protection.mjs
```

That will:

1. enable repository auto-merge
2. require PR-based merges on `stage`
3. require PR-based merges on `main`
4. block force-pushes and branch deletions on both branches

The protection intentionally requires pull requests, not human approvals, so the automated `stage -> main` promotion can still auto-merge after CI passes.
