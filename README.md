# com.dajour

Personal portfolio application for Da'Jour J. Christophe.

The project includes:
- a modular TypeScript client under [src/client](/c:/Users/dajou/Documents/com.dajour/src/client)
- a small Express service under [src/service](/c:/Users/dajou/Documents/com.dajour/src/service)
- SCSS and Pug source for the frontend shell
- Gulp-based development and production builds
- unit tests and cross-browser UAT
- Docker paths for development, CI, and production under [infra/docker](/c:/Users/dajou/Documents/com.dajour/infra/docker)

## Structure

```text
assets/           source static assets and SCSS
build/            generated client, service, and UAT artifacts
doc/              project reference material and mockups
infra/docker/     Dockerfiles and Compose files
scripts/          local tooling and dev-container launchers
src/client/       browser TypeScript source
src/service/      Express service TypeScript source
template/         Pug template source
test/             unit tests and UAT runner source
```

## Prerequisites

- Node.js 24 or newer
- npm
- Playwright browsers for UAT:

```powershell
npx.cmd playwright install
```

## Local Commands

Install dependencies:

```powershell
npm.cmd install
```

Development build:

```powershell
npm.cmd run build:dev
```

Production build:

```powershell
npm.cmd run build:prod
```

Run the service locally:

```powershell
npm.cmd run serve
```

Run unit tests:

```powershell
npm.cmd run test:unit
```

Run full UAT:

```powershell
npm.cmd run uat
```

Run the full CI script locally:

```powershell
npm.cmd run ci
```

## Build Output

Generated artifacts are written to [build](/c:/Users/dajou/Documents/com.dajour/build):

- [build/client](/c:/Users/dajou/Documents/com.dajour/build/client) contains the generated HTML shell and browser assets
- [build/service](/c:/Users/dajou/Documents/com.dajour/build/service) contains the compiled Express service
- [build/test/uat](/c:/Users/dajou/Documents/com.dajour/build/test/uat) contains UAT screenshots

## Docker

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

## Quality Gates

The repo currently validates:
- TypeScript client and service builds
- unit tests for the Express service
- desktop cross-browser UAT in Chromium, Firefox, and WebKit
- responsive UAT across phone, large-phone, tablet, and desktop viewports

## Documentation

Supporting root documentation:
- [AUTHORS.md](/c:/Users/dajou/Documents/com.dajour/AUTHORS.md)
- [CONTRIBUTORS.md](/c:/Users/dajou/Documents/com.dajour/CONTRIBUTORS.md)
- [CONTRIBUTING.md](/c:/Users/dajou/Documents/com.dajour/CONTRIBUTING.md)
- [CHANGELOG.md](/c:/Users/dajou/Documents/com.dajour/CHANGELOG.md)
- [MAINTAINERS.md](/c:/Users/dajou/Documents/com.dajour/MAINTAINERS.md)
- [SECURITY.md](/c:/Users/dajou/Documents/com.dajour/SECURITY.md)
