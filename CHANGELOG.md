# Changelog

All notable changes to this project should be documented in this file.

## Unreleased

### Added

- modular TypeScript client architecture under [src/client](/c:/Users/dajou/Documents/com.dajour/src/client)
- Express service under [src/service](/c:/Users/dajou/Documents/com.dajour/src/service)
- Gulp-based development and production build pipeline
- unit test path for the service
- cross-browser and responsive UAT coverage
- Docker paths for development, CI, and production under [infra/docker](/c:/Users/dajou/Documents/com.dajour/infra/docker)

### Changed

- frontend source split across SCSS partials and Pug partials
- build output consolidated under [build](/c:/Users/dajou/Documents/com.dajour/build)
- service now serves generated client output from the build tree
- root documentation standardized and completed

### Removed

- generated artifacts from source directories and root-level Docker clutter
