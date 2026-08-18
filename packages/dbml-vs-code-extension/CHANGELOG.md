# Change Log

All notable changes to the "dbml-schema-visualizer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Fixed

- Auto-arrange left relations hidden underneath tables when the diagram was drawn with curves. Curves had been given the tighter arrangement of the two, on the reasoning that a curve sweeps through whatever space there is — which it does, including the space a table is standing in. Right angles are routed around what stands between a relation's ends; a curve takes the direct line and passes under it, and tables are drawn over relations, so what it passes under is not drawn at all. Measured on a hub-and-spoke schema, a quarter of every relation's length was hidden. Curves now get the roomier arrangement of the two, which puts them at 8% against 10% for right angles, and the arrangement is about a tenth larger in each direction as a result.

## [0.14.0] - 2026-08-18

### Added

- **A `.dbml` file switches between text and diagram in the same tab.** The diagram is now a custom editor of the file rather than a panel opened beside it, with buttons in the editor title to move between the two views. Opening a file still gives you the text; the diagram is a deliberate choice, and either view can be the one you leave open. The segmented Preview|Markdown control that Markdown has is not reachable from the extension API — this is the closest equivalent that is.
- **Syntax highlighting for DBML.** The extension declared the language and gave it a file icon but contributed no grammar, so a `.dbml` file opened as plain text. Keywords, strings including the triple-quoted note, the settings bracket with its attribute names, numbers, comments and the cardinality operators are highlighted now. Column types are deliberately left out: DBML does not close that set, so listing the common ones would leave every other type looking wrong. A language configuration comes with it, so `Ctrl+/` comments and brackets match — neither of which worked before.
- **A choice of how relations are drawn**, curves or right angles, next to auto-arrange. Curves are the default: they read well for as long as a diagram is small enough to take in, which most are, and right angles earn their keep on the large ones. Auto-arrange is told which is in use, because right angles need a corridor wide enough to run a line down while curves sweep through whatever space there is.

### Changed

- **Hiding a table's relations no longer edits the file.** `Alt+H` used to comment `Ref:` lines out of the `.dbml` and mark the table in MetaInfo, while the icon in the table header hid the same relations on the canvas alone — two mechanisms for one idea, and only the destructive one drew the dashed outline. They are one view preference now, remembered per machine and never written to the file. Two consequences worth knowing: the state no longer travels between people through the file, and relations that an earlier version already commented out stay commented out — the extension leaves them alone, and they have to be restored by hand.
- **Auto-arrange rearranges the schema around its busiest table** instead of drawing layers. The most-connected table sits in the middle and the rest fan out left and right by level; tables with no relations — including those whose relations are hidden — are grouped into a compact block below. The height is chosen so the result fits on screen.
- **A schema too big to draw at full detail opens with table headers.** Every column row is about eight Konva nodes, so a 5,676-column schema arrived as 46,210 nodes and about 155 ms a frame; the same schema with headers only is 821 nodes and about 3 ms. Full detail is still one keypress away.
- **Only what is on screen is drawn, at the size it is seen.** Tables outside the view are no longer mounted, and column rows are drawn while a row is at least six screen pixels tall. Zoomed out past that, a table keeps its size and its header but not its rows — long before a name can be read, the rows still say how big a table is and where a relation arrives.
- **More room between tables at full detail.** Fifty pixels was most of a table when tables were small; at full detail they are around 450 wide and over a thousand tall, and the same fifty pixels left the relation lines lost somewhere behind a wall of blocks.
- Auto-arrange now reframes the view on the result. Pressing `L` while zoomed in could put the whole new arrangement off screen with nothing on screen changing to say why.
- A diagram now belongs to its document instead of there being one for the whole window, so several `.dbml` files can be open as diagrams at once.

### Fixed

- `Alt+H` did nothing in the extension while it worked on the site. Three things stood between the chord and the toggle: a workbench binding matching on the language alone consumed it while the diagram had focus, the command posted from inside the webview never reached the page, and once the diagram became a custom editor a single keypress reached both the in-webview shortcut and the extension command — two toggles that cancelled each other out.
- Hovering a table on a large schema cost about 100 ms. The column map was rebuilt on every pointer move, by an algorithm that was quadratic in the number of columns; it now depends only on the schema and the detail level, as it always did in principle.
- A hover re-rendered the whole diagram — 117 headers, 93 connections and, at full detail, 5,676 column rows — almost none of which were affected by the table under the pointer. Two tables wake up now.
- Zoom lagged behind the wheel. Wheel events are coalesced into one frame, and tables and connections are drawn on a layer each so dragging one no longer redraws the other.
- Auto-arrange could produce an unusable strip. On a 117-table schema the old layout came out 1,980 wide and 145,826 tall, which fit-to-view could only answer by shrinking everything to a blank canvas.
- Switching a file to the diagram left the original tab open beside it instead of taking it over.

## [0.13.0] - 2026-07-21

### Added

- **Export to Markdown** — the same table reference the AsciiDoc export produces, in Markdown: a section per table with its description, a column table and its relations.

## [0.12.0] - 2026-07-21

### Added

- Toolbar tooltips that appear immediately and are styled like the rest of the editor, replacing the native ones that took about a second and looked out of place. Where an action has a keyboard shortcut the tooltip names it, read from the same registry the shortcut fires from. The shortcut is part of each button's accessible name too, so it reaches screen-reader users as well.

### Changed

- Toolbar labels now follow one rule: a control that holds a state shows its name, so its value can be read at a glance; a one-shot action shows only an icon and explains itself through its tooltip. **Auto-arrange** and **Fit to view** therefore lost their labels, and the toolbar is narrower than before. The theme toggle is the one exception — it holds state but stays icon-only, because its icon already switches between a sun and a moon.
- The three export buttons (PNG, SVG, AsciiDoc) had near-identical icons and gave no way to tell the formats apart. They are now one **Export** button opening a menu that names each format; it closes on `Esc` or a click outside.

### Fixed

- The Activity Bar panel kept its group names, action labels and empty-state text in English while the command palette and the diagram followed the display language. All of them are translated now. A saved connection's own name is user data and is deliberately left as typed.

## [0.11.0] - 2026-07-20

### Added

- Localized interface following the VS Code display language: English, Russian and Simplified Chinese. Other display languages fall back to English, including Traditional Chinese. The Chinese translation is a community contribution and has not been reviewed by a native speaker.
- Keyboard shortcuts for the view actions, with an on-screen legend: `C` colored relations, `A` relation animation, `S` short table names, `D` detail level, `L` auto-arrange, `F` fit to view, `?` legend. The legend is generated from the same registry the shortcuts fire from, so it cannot drift from the actual bindings.
- **Relation animation** — when enabled, the relations of the table under the cursor animate as travelling dashes, showing the direction of each relation.

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
