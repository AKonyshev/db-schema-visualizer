# DBML ERD Visualizer

Visualize a database schema as an entity-relationship diagram from a `.dbml` file in VS Code.

> **Fork.** Published as [konyshevav.dbml-schema-visualizer](https://marketplace.visualstudio.com/items?itemName=konyshevav.dbml-schema-visualizer). Based on [BOCOVO/db-schema-visualizer](https://github.com/BOCOVO/db-schema-visualizer) ([MIT License](./LICENCE)).

## Features

![Demo](https://github.com/BOCOVO/db-schema-visualizer/assets/51182814/a59fd0c0-246d-4f00-be39-9885d88b8b85)

- Entity-relationship diagram from your DBML file
- Drag tables; positions can be stored in a `MetaInfo` block inside the DBML file
- Light and dark themes
- Display modes: all columns, relational columns only, or table headers only
- Export diagram as PNG, SVG, or AsciiDoc
- Hide/show relations per table via the icon in the table header; **Alt+H** comments refs in DBML for the table under the cursor
- Colored relations: either one neutral colour for all of them, or each relation painted in its source table's colour
- Relation animation: the relations of the table under the cursor animate to show their direction
- **Import from PostgreSQL** — command palette → **DBML: Import from database**
- **Compare with database** — open a `.dbml` file, then **DBML: Compare with database**

## Keyboard shortcuts

Available while the diagram webview has focus. Keys are ignored while you are typing in a field, so the search box is unaffected.

| Key          | Action                                     |
| ------------ | ------------------------------------------ |
| `C`          | Colored relations                          |
| `A`          | Relation animation                         |
| `S`          | Short table names                          |
| `D`          | Cycle detail level                         |
| `L`          | Auto-arrange                               |
| `F`          | Fit to view                                |
| `?`          | Show the shortcuts legend                  |
| `Esc`        | Close the legend                           |
| `Ctrl/Cmd+F` | Search tables                              |
| `Alt+H`      | Comment/uncomment refs for a hovered table |

The same list is available in the app: press `?` or use the keyboard button in the toolbar.

## Languages

The interface follows your VS Code display language: English, Russian (`ru`) and Simplified Chinese (`zh-cn`). Any other display language falls back to English — including Traditional Chinese (`zh-tw`), because mainland and Taiwan terminology differ enough that showing Simplified would be misleading.

The Chinese translation is a community contribution and has not been reviewed by a native speaker. Corrections are welcome — the catalogs live in `packages/json-table-schema-visualizer/src/i18n/locales/` and `packages/dbml-vs-code-extension/l10n/`.

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
