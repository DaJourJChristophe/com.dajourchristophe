# Scripts

Automation and host-side helpers live here.

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
