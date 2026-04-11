# Contributing

Thank you for contributing to `com.dajour`.

This repository is structured as a small application with a generated build output, Docker paths for local and CI use, and both automated unit and UAT coverage. The goal of this guide is to keep changes easy to review, easy to run, and easy to trust.

## Principles

- Keep source and generated output separate.
- Prefer small, reviewable changes.
- Preserve the current user experience unless the change intentionally updates design or behavior.
- Verify changes locally before asking others to trust them.

## Project Layout

- [src/client](/c:/Users/dajou/Documents/com.dajour/src/client): browser TypeScript source
- [src/service](/c:/Users/dajou/Documents/com.dajour/src/service): Express service TypeScript source
- [assets/scss](/c:/Users/dajou/Documents/com.dajour/assets/scss): SCSS source
- [template](/c:/Users/dajou/Documents/com.dajour/template): Pug template source
- [test/unit](/c:/Users/dajou/Documents/com.dajour/test/unit): unit tests
- [test/uat-cross-browser.js](/c:/Users/dajou/Documents/com.dajour/test/uat-cross-browser.js): UAT runner
- [build](/c:/Users/dajou/Documents/com.dajour/build): generated artifacts
- [infra/docker](/c:/Users/dajou/Documents/com.dajour/infra/docker): Docker and Compose definitions

## Setup

Install dependencies:

```powershell
npm.cmd install
```

Install Playwright browsers if you plan to run UAT:

```powershell
npx.cmd playwright install
```

## Development Workflow

Use the dev build while working:

```powershell
npm.cmd run build:dev
```

Serve the application locally:

```powershell
npm.cmd run serve
```

## Required Verification

Before finalizing a change, run the checks that match its scope.

Recommended minimum:

```powershell
npm.cmd run build:dev
npm.cmd run test:unit
```

For UI, routing, template, layout, or browser-facing changes:

```powershell
npm.cmd run uat
```

For a full validation pass:

```powershell
npm.cmd run ci
```

## Build Conventions

- Do not hand-edit generated files under [build](/c:/Users/dajou/Documents/com.dajour/build).
- Make source changes in:
  - [src/client](/c:/Users/dajou/Documents/com.dajour/src/client)
  - [src/service](/c:/Users/dajou/Documents/com.dajour/src/service)
  - [assets/scss](/c:/Users/dajou/Documents/com.dajour/assets/scss)
  - [template](/c:/Users/dajou/Documents/com.dajour/template)
- Let Gulp regenerate build output.

## Code Style

- Keep TypeScript in `strict` mode.
- Prefer explicit types when they improve readability or API clarity.
- Add documentation comments to exported APIs and non-obvious modules.
- Keep SCSS modular by editing the correct partial rather than creating one-off style blocks.
- Keep templates modular through the Pug partial structure.

## Testing Guidance

- Add or update unit tests when service behavior changes.
- Keep UAT states aligned with the real UI tabs and routes.
- Treat visual regressions seriously, especially in responsive or cross-browser behavior.

## Docker Paths

Development:

```powershell
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

CI:

```powershell
docker compose -f infra/docker/docker-compose.ci.yml up --build --abort-on-container-exit
```

Production:

```powershell
docker compose -f infra/docker/docker-compose.prod.yml up --build
```

## Documentation

If you change build structure, runtime expectations, or contributor workflow, update the root documentation in the same change.
