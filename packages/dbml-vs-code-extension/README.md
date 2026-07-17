# DBML ERD Visualizer

Visualize a database schema as an entity-relationship diagram from a `.dbml` file in VS Code.

> **Fork.** Published as [konyshevav.dbml-erd-visualizer](https://marketplace.visualstudio.com/items?itemName=konyshevav.dbml-erd-visualizer). Based on [BOCOVO/db-schema-visualizer](https://github.com/BOCOVO/db-schema-visualizer) ([MIT License](./LICENCE)).

## Features

![Demo](https://github.com/BOCOVO/db-schema-visualizer/assets/51182814/a59fd0c0-246d-4f00-be39-9885d88b8b85)

- Entity-relationship diagram from your DBML file
- Drag tables; positions can be stored in a `MetaInfo` block inside the DBML file
- Light and dark themes
- Display modes: all columns, relational columns only, or table headers only
- Export diagram as PNG, SVG, or AsciiDoc
- Hide/show relations per table; **Alt+H** comments refs in DBML for the table under the cursor
- **Import from PostgreSQL** — command palette → **DBML: Import from database**
- **Compare with database** — open a `.dbml` file, then **DBML: Compare with database**

## Extension settings

- `dbmlERDPreviewer.preferredTheme` — `light` or `dark` (default: `dark`)
- `dbmlERDPreviewer.scrollDirection` — `up-out` or `up-in` (default: `up-out`)

## Release notes

[CHANGELOG.md](./CHANGELOG.md)

## Attribution

|               |                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Upstream**  | [BOCOVO/db-schema-visualizer](https://github.com/BOCOVO/db-schema-visualizer) by [@BOCOVO](https://github.com/BOCOVO)             |
| **This fork** | [AKonyshev/db-schema-visualizer](https://github.com/AKonyshev/db-schema-visualizer) by [@AKonyshev](https://github.com/AKonyshev) |

Licensed under the [MIT License](./LICENCE).
