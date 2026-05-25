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
