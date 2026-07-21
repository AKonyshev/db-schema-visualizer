# Manual test plan (DBML extension)

## MetaInfo persistence

1. Open a `.dbml` file and launch **Show diagram**.
2. Drag a table on the diagram; wait ~0.5s.
3. Confirm `/*MetaInfo ... MetaInfo*/` appears or updates at the end of the file with table coordinates.
4. Close and reopen the diagram; positions should match MetaInfo.
5. Use editor **Undo**; MetaInfo block should revert.

## Relation visibility

1. Hover a table that has relations; click the link icon in the **table header**; relations for that table should hide on the canvas.
2. Click again; relations should reappear.
3. Press **Alt+H** with the webview focused and a table hovered; related `Ref` lines in DBML should be commented/uncommented.

## Colored relations

1. With **Colored relations** off, relations are grey; hovering a table colours only its own relations.
2. Turn it on — every relation is permanently painted in its source table's colour.
3. Reload the webview; the setting survives.

## Relation animation

1. Turn on **Animation** and hover a table with relations — its relations show travelling dashes; all other relations stay static.
2. **Check the direction:** the dashes must travel from the source table towards the target. If they run backwards, flip the sign of the `dashOffset` step in `ConnectionPath.tsx`. A confidently wrong direction is worse than no animation, since reading direction is the whole point of the feature.
3. Confirm the cardinality symbols (crow's foot) at both ends stay intact while the dashes move.
4. Turn the setting off — the dashes disappear, and hovering/clicking relations behaves as before.

## Keyboard shortcuts and legend

1. Press `C`, `A`, `S`, `D`, `L`, `F` with the webview focused — each produces the same result as its toolbar button.
2. Open the search with `Ctrl/Cmd+F` and type text containing `c`, `a`, `s` — the view modes must **not** toggle and the text must type normally.
3. Press `?` — the legend opens and lists every shortcut. Close it with `Esc`, then reopen it with the keyboard button in the toolbar and close it by clicking the dimmed backdrop.
4. While the legend is open, press `L` and `D` — nothing behind the overlay may change.

## Toolbar tooltips

1. Hover any toolbar button — a dark tooltip appears above it immediately, styled like the rest of the interface.
2. Keep hovering for a few seconds — no second, system-styled tooltip appears on top of it.
3. Auto-arrange shows `(L)`, Fit to view `(F)`, the keyboard button `(?)`.
4. Export and the theme toggle have no shortcut — their tooltips show the label alone, with no empty brackets and no `undefined`.
5. The tooltip does not block the pointer: moving across a button and onto its neighbour switches tooltips cleanly, without flicker.

## Toolbar labels

1. Buttons that hold a state show their name: detail level, short table names, colored relations, relation animation.
2. One-shot actions show only an icon: auto-arrange, fit to view, export, the keyboard button.
3. The theme toggle is the stated exception — stateful but icon-only, because the icon itself swaps between a sun and a moon.
4. **Recognisability check:** look at auto-arrange and fit to view, which no longer carry a label. Are both still recognisable from the icon alone? If either is not, the icon is the thing to replace — do not restore the label, which would turn the rule back into a case-by-case argument.
5. At a normal window width the toolbar stays on a single line — no button wraps to a second row. (This replaces "no wider than before": with the change already made there is nothing left to compare against, and staying on one line is what the width actually had to protect.)

## Export

1. The toolbar has one export button, not three.
2. Click it — a menu lists PNG, SVG and AsciiDoc by name. The entries name the format only, without repeating the word "Export".
3. Pick PNG — the image downloads and the menu closes.
4. Pick SVG (download `.svg` file) and AsciiDoc (download `.adoc` file with table sections); each closes the menu too.
5. Open the menu and press `Esc` — it closes and nothing is exported.
6. Open the menu and click elsewhere on the diagram — it closes and nothing is exported.
7. Move the pointer across the export button on the way to a neighbouring button — the menu must not open on hover alone.
8. Keyboard only: Tab to the export button and press Enter — the list opens. Tab moves through PNG, SVG and AsciiDoc; Enter on one exports it. `Esc` closes the list. (Arrow keys are deliberately not wired: the list is plain buttons, not an ARIA menu.)

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
6. With a non-English display language, the group names and the three action labels are translated, and so is "No saved connections" when there are none. A saved connection's own name is user data and must stay exactly as typed, untranslated.
