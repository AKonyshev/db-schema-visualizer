# Change Log

All notable changes to the "dbml-schema-visualizer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.9.0] - 2026-07-17

Fork release published under publisher `konyshevav`. Based on [BOCOVO/db-schema-visualizer](https://github.com/BOCOVO/db-schema-visualizer) (MIT).

### Added

- **DBML: Import from database** — generate a `.dbml` file from a PostgreSQL schema
- **DBML: Compare with database** — diff the active `.dbml` file against a live PostgreSQL schema (Markdown report)
- Saved PostgreSQL connection strings in VS Code SecretStorage
- MetaInfo block sync: table positions are saved into `/*MetaInfo ... MetaInfo*/` in the DBML file
- Export diagram to SVG and AsciiDoc
- Toggle relation visibility per table on the canvas
- Alt+H command to comment/uncomment refs in DBML for the hovered table
- Toolbar options: short table names and always-on relation highlighting
- Hidden refs indicator on tables when MetaInfo marks refs as hidden

### Changed

- Independent fork maintenance; see repository README for upstream attribution and license

## [0.8.0]

### Added

- Export diagram to png

## [0.7.0]

### Added

- Added search feature

## [0.6.0]

### Added

- Added support for controlling scroll behavior via the prismaERDPreviewer.scrollDirection setting
- Added an option to automatically fit the diagram to the viewport dimensions

## [0.5.0]

### Added

- Display diagnostic errors directly on code editor lines instead of displaying toast messages
- Showing `not_null` label for not null columns

## [0.4.0]

### Added

- Improve auto layout with dagrejs

## [0.3.4]

### Added

- Added DBML logo as file icon for dbml file

### Fixed

- Dependence with the `vscode-dbml` VS Code plugin

## [0.3.3]

### Fixed

- Prevent table names from being truncated for long table name
- Typo in preview tab name

## [0.3.2]

### Fixed

- Remove `languages` section from the package.json

## [0.3.1]

### Fixed

- Improved multi-schema code handling

## [0.3.0]

### Added

- Ability to toggle table visualization mode. Display all columns, relational columns only or table headers only by [@tv-long](https://github.com/tv-long)

## [0.2.0]

### Added

- Support table header customization via table settings in the dbml code by [@tv-long](https://github.com/tv-long)

## [0.1.0]

### Added

- Make the table width fit the table content
- Save and restore tables positions on exiting
- Save and restore stage position on exiting

## [0.0.3]

### Added

- Display an `empty content message` when there is no table in the schema
- Enhance message for undefined schema

### Fixed

- Remove mention of Prisma from plugin description

## [0.0.2]

### Added

- Create diagram from DBML code
- Add light and dark theme
