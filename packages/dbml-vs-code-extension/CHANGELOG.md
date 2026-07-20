# Change Log

All notable changes to the "dbml-schema-visualizer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Localized interface following the VS Code display language: English, Russian and Simplified Chinese. Other display languages fall back to English, including Traditional Chinese. The Chinese translation is a community contribution and has not been reviewed by a native speaker.
- Keyboard shortcuts for the view actions, with an on-screen legend: `C` colored relations, `A` relation animation, `S` short table names, `D` detail level, `L` auto-arrange, `F` fit to view, `?` legend. The legend is generated from the same registry the shortcuts fire from, so it cannot drift from the actual bindings.
- **Анимация** — when enabled, the relations of the table under the cursor animate as travelling dashes, showing the direction of each relation.

### Changed

- The relation-highlight toolbar option is now **Colored relations** with a palette icon. Behaviour is unchanged (off: relations are grey and colour on hover; on: every relation is permanently coloured by its source table), and the stored setting is preserved.
- Relation visibility is now toggled by an icon in the table header instead of a toolbar button.
- **Auto-arrange** now always recomputes a fresh layout instead of restoring previously saved positions, and persists the result.

### Fixed

- Toolbar settings (colored relations, short table names) now take effect immediately instead of waiting for an unrelated re-render.
- Webview styles were missing when the extension ran under the debugger (F5); the CSS is now generated on every build, including watch rebuilds.
- Auto-layout was skewed by refs pointing at tables outside the schema and by self-references, which created phantom nodes.
- A connection string with surrounding whitespace passed validation but failed at connect time.
- Import: a file-write failure (read-only path, full disk) was reported as a database error.
- Import: a failure to open the saved file no longer swallows the "save this connection" prompt or the "N cross-schema references were omitted" notice.
- A saved connection whose name matched the "New connection" entry was indistinguishable from it in the picker; a vanished connection now reports itself instead of failing silently.
- Underlying causes of import/compare failures are now logged to the Extension Host log instead of being discarded.
- Panel: per-connection commands are hidden from the command palette, and the connections tree refreshes automatically.

## [0.10.0] - 2026-07-17

### Added

- Add an Activity Bar sidebar panel with quick actions (Show diagram, Import from database, Compare with database) and a saved-connections list with per-connection import, compare, and delete.

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
