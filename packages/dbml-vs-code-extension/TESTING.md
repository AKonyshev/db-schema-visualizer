# Manual test plan (DBML extension)

## MetaInfo persistence

1. Open a `.dbml` file and launch **Show diagram**.
2. Drag a table on the diagram; wait ~0.5s.
3. Confirm `/*MetaInfo ... MetaInfo*/` appears or updates at the end of the file with table coordinates.
4. Close and reopen the diagram; positions should match MetaInfo.
5. Use editor **Undo**; MetaInfo block should revert.

## Relation visibility

1. Hover a table and click **🔗** in the toolbar; relations for that table should hide on the canvas.
2. Click again; relations should reappear.
3. Press **Alt+H** with the webview focused and a table hovered; related `Ref` lines in DBML should be commented/uncommented.

## Export

1. Export PNG from toolbar (download).
2. Export SVG (download `.svg` file).
3. Export AsciiDoc (download `.adoc` file with table sections).

## Prisma extension regression

1. Open a `.prisma` file and launch diagram preview.
2. Confirm diagram renders; new toolbar items work; no MetaInfo writes to the schema file.

## Import from database (PostgreSQL)

1. Command palette → **DBML: Import from database**.
2. Choose **New connection**, enter a `postgres://` connection string.
3. When multiple schemas exist, pick one from the list.
4. Choose a save location; confirm the `.dbml` file is written and the diagram opens.
5. If cross-schema foreign keys exist, confirm the "N cross-schema references were omitted" notice.
6. Re-run the command; confirm the saved connection appears in the list and works.
7. Error cases: wrong password, unreachable host, and a non-`postgres://` string each show a clear message with no password leaked.

## Compare with database (PostgreSQL)

1. Open a `.dbml` file; command palette → **DBML: Compare with database**.
2. Choose a connection; when multiple schemas exist, pick one.
3. Confirm a Markdown report opens beside the editor with tables/columns/enums/FK/index differences (or "Schemas are identical").
4. On a `.dbml` file with a syntax error, confirm a clear "DBML parse error at line N:M" message and no crash.
5. Wrong password / unreachable host each show a clear message with no password leaked.

## Sidebar panel (Activity Bar)

1. Click the DBML icon in the Activity Bar — the panel opens with **Actions** and **Connections** groups.
2. Under Actions, click **Show diagram** / **Import from database** / **Compare with database** — each runs the same command as the palette.
3. Click **＋** in the panel title, enter a name + `postgres://` string — the connection appears under Connections (name only; no password shown).
4. On a connection, use the inline **Import** / **Compare** icons — the flow runs against that connection without asking to pick one.
5. Use the inline **Delete** icon — confirm the modal; the connection disappears. Click **⟳** to refresh.
