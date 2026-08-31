# Test cases

What this repository ships, said as things a person can check. One row per
behaviour, written so that someone who has never opened the code can run it.

Three products come out of these packages, and they share a diagram:

| Product                             | Where                              | Runs on                               |
| ----------------------------------- | ---------------------------------- | ------------------------------------- |
| **Web app**                         | `packages/web`                     | a browser, at `/`                     |
| **Embedded frame**                  | `packages/web`, entry `embed.html` | an `<iframe>` in a documentation page |
| **VS Code extension** (DBML Studio) | `packages/dbml-vs-code-extension`  | VS Code                               |

The diagram itself is `packages/json-table-schema-visualizer`, and all three
hosts draw with it. A case marked **all hosts** has to hold in each of them.

**Automated** in the last column names the test that already covers the case, so
a case with a name there is not a manual chore — it is there to say what the
automation is asserting. **Manual** means nobody has automated it yet.

Run the automation with:

```bash
yarn typecheck && yarn test && yarn build:web && yarn test:e2e
```

and the extension's own suite, which is not in that sweep, with:

```bash
yarn workspace dbml-studio test:integration
```

---

## 1. Reading a schema

| #   | Case                                   | Steps                                            | Expected                                                                     | Automated                              |
| --- | -------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------- |
| 1.1 | A valid file draws                     | Open a `.dbml` file with two related tables      | Both tables are drawn, with a line between them                              | `site.spec.ts` — built site works      |
| 1.2 | A syntax error is named, not swallowed | Type `Table {` into the editor                   | The message names the line and column; the last good diagram stays on screen | Manual                                 |
| 1.3 | An empty file                          | Open a file with no tables                       | An empty-state message, no canvas errors                                     | Manual                                 |
| 1.4 | Enums draw                             | Open a file with an `Enum` used by a column      | The column's type shows the enum name; hovering it lists the values          | Manual                                 |
| 1.5 | Notes draw                             | Give a column a `note`                           | Hovering the column shows the note                                           | Manual                                 |
| 1.6 | Schema-qualified names                 | Two tables of the same name in different schemas | Both are drawn, each headed with its schema                                  | `dbml-to-json-table-schema` unit tests |
| 1.7 | A large model opens                    | Open a model of 100+ tables                      | It opens framed, and panning stays responsive                                | Manual                                 |

## 2. Column notation — all hosts

The marks a reader sees on a column. Their meanings are also listed in the
legend; case 6.3 checks the two agree.

| #   | Case                                    | Steps                                                    | Expected                                                                          | Automated             |
| --- | --------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------- |
| 2.1 | Primary key                             | A column with `[pk]`                                     | Name in bold in the table's colour, and a `PK` pill                               | `fieldMarks.test.ts`  |
| 2.2 | Foreign key                             | The many side of a `Ref`                                 | An `FK` pill on that column and not on the one it points at                       | `foreignKeys.test.ts` |
| 2.3 | Unique                                  | A column with `[unique]` and no `[pk]`                   | A `UK` pill                                                                       | `fieldMarks.test.ts`  |
| 2.4 | A primary key is not also badged unique | `[pk, unique]`                                           | `PK` only — the second pill would say nothing                                     | `fieldMarks.test.ts`  |
| 2.5 | Mandatory                               | A column with `[not null]`                               | `*` after the type                                                                | `fieldMarks.test.ts`  |
| 2.6 | Optional                                | A column with neither                                    | No mark at all, and the legend says an unmarked column may be null                | `fieldMarks.test.ts`  |
| 2.7 | One-to-one is not guessed               | `Ref: a.id - b.id`, both primary keys                    | Neither column is badged `FK`                                                     | `foreignKeys.test.ts` |
| 2.8 | A badge never overhangs                 | A table whose widest column carries `PK FK`              | The pill's right edge is inside the table's box                                   | `fieldMarks.test.ts`  |
| 2.9 | Badges survive a filtered diagram       | Embed frame with `tables=` naming one side of a relation | The kept table draws, and no badge claims a relation to a table that is not there | `foreignKeys.test.ts` |

## 3. Moving about the diagram — all hosts

| #   | Case                                          | Steps                                           | Expected                                                   | Automated                                |
| --- | --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| 3.1 | Pan                                           | Drag empty canvas in pan mode                   | The view moves; nothing is selected                        | Manual                                   |
| 3.2 | Zoom                                          | Scroll over the canvas                          | Zoom centres on the pointer                                | `computeWheelZoom` unit tests            |
| 3.3 | Scroll direction setting                      | Flip the setting, scroll again                  | Zoom goes the other way                                    | `computeWheelZoom` unit tests            |
| 3.4 | Fit to view                                   | Press `F` after panning away                    | The whole diagram is framed                                | `embed.spec.ts` — arrives already framed |
| 3.5 | Move one table                                | Drag a table                                    | It follows the pointer and its relations follow it         | `site.spec.ts` — group drag              |
| 3.6 | Auto-arrange                                  | Press `L`                                       | Tables are rearranged and the view is re-framed onto them  | Manual                                   |
| 3.7 | The container loses its size and gets it back | Hide the pane holding the diagram, then show it | The diagram is drawn again at the new size, not left blank | `site.spec.ts` — recovers after no size  |

## 4. Group selection — all hosts

| #    | Case                                      | Steps                                                    | Expected                                                                 | Automated                                  |
| ---- | ----------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| 4.1  | Enter and leave the mode                  | Press `V`, then `V` again                                | The toolbar button reads Select, then Pan                                | Manual                                     |
| 4.2  | The mode does not survive a reload        | Press `V`, reload                                        | Back in pan mode                                                         | `interactionModeStore.test.ts`             |
| 4.3  | Marquee catches by overlap                | Drag a rectangle that clips a table's corner             | That table is selected                                                   | `selectionFromMarquee.test.ts`             |
| 4.4  | Marquee dragged up and left               | Drag from bottom-right to top-left                       | Same tables caught as the other way round                                | `selectionFromMarquee.test.ts`             |
| 4.5  | Shift adds                                | Shift-drag a second rectangle                            | The first selection is kept and added to                                 | `selectionFromMarquee.test.ts`             |
| 4.6  | Click selects one                         | Click a table in select mode                             | Only it is selected                                                      | `site.spec.ts` — shift adds and takes away |
| 4.7  | Shift-click toggles                       | Shift-click a selected table                             | It leaves the selection                                                  | `site.spec.ts`                             |
| 4.8  | Click on empty canvas clears              | Click nothing                                            | Nothing is selected                                                      | `selectionFromMarquee.test.ts`             |
| 4.9  | Group move                                | Select two tables, drag one                              | Both move by the same amount, relations follow                           | `site.spec.ts`                             |
| 4.10 | The move is stored                        | After a group move, reload                               | The tables are where they were left                                      | `site.spec.ts`                             |
| 4.11 | Dragging an unselected table              | With a group selected, drag a table outside it           | The selection becomes that one table, and only it moves                  | Manual                                     |
| 4.12 | Escape clears                             | Press Escape with a selection                            | Nothing is selected                                                      | `site.spec.ts`                             |
| 4.13 | Escape with nothing selected is not taken | Press Escape with no selection, inside an expanded frame | The frame collapses — the key was not spent                              | `embed.spec.ts` — Escape puts it back      |
| 4.14 | Escape in the editor is not taken         | Type in the editor with a selection, press Escape        | The editor gets the key; the selection is left alone                     | Manual                                     |
| 4.15 | Leaving the mode clears                   | Select tables, press `V`                                 | Nothing is selected                                                      | `site.spec.ts`                             |
| 4.16 | Space pans without losing the selection   | Hold space, drag, release                                | The view moves, nothing is deselected, no marquee is drawn               | `site.spec.ts`                             |
| 4.17 | Space is left to a focused button         | Focus a toolbar button in select mode, press space       | The button activates                                                     | `isTypingTarget.test.ts`                   |
| 4.18 | Middle button pans                        | Middle-drag in select mode                               | The view moves                                                           | Manual                                     |
| 4.19 | A pan released off the canvas             | Middle-drag, leave the canvas, release                   | Select mode still works — the next drag draws a marquee and does not pan | `site.spec.ts`                             |
| 4.20 | Selection does not cross documents        | Select tables, open another schema                       | Nothing is selected                                                      | Manual                                     |

## 5. Detail levels, relations and appearance — all hosts

| #    | Case                                        | Steps                                        | Expected                                                                           | Automated                               |
| ---- | ------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| 5.1  | Detail level cycles                         | Press `D` three times                        | Full → headers → keys → full                                                       | Manual                                  |
| 5.2  | Each level has its own layout               | Arrange at full detail, press `D`, come back | The arrangement you made is back, exactly                                          | `detailLevelLayout.test.ts`             |
| 5.3  | Changing level re-frames                    | Press `D` in a short frame                   | The diagram is framed for what is now drawn                                        | `embed.spec.ts` — re-frames the diagram |
| 5.4  | Table widths do not move with the level     | Press `D`                                    | Tables keep their width; only height changes                                       | `computeTableDimension.test.ts`         |
| 5.5  | Relation style                              | Toggle right angles / curves                 | Lines redraw, and auto-arrange leaves more room for right angles                   | `computeOrthogonalEdge.test.ts`         |
| 5.6  | Hide one table's relations                  | Click the link glyph in a table header       | Its relations vanish, the glyph is struck through, the table gets a dashed outline | Manual                                  |
| 5.7  | `Alt+H` does the same                       | Hover a table, press `Alt+H`                 | Exactly as 5.6                                                                     | `matchesToggleRefsShortcut.test.ts`     |
| 5.8  | Hiding relations writes nothing to the file | Watch the editor through 5.6                 | The text is untouched; no `Ref` is commented out                                   | Manual                                  |
| 5.9  | Hidden relations survive a reload           | Hide, reload                                 | Still hidden — remembered per document, not in the file                            | Manual                                  |
| 5.10 | Coloured relations                          | Press `C`                                    | Every relation takes its source table's colour                                     | Manual                                  |
| 5.11 | Animation                                   | Press `A`, hover a table                     | Its relations show travelling dashes; others stay still                            | Manual                                  |
| 5.12 | Short table names                           | Press `S`                                    | Schema prefixes drop from the headers                                              | Manual                                  |
| 5.13 | Hover highlight                             | Hover a table                                | It and its related columns are picked out                                          | Manual — see gap 6                      |
| 5.14 | Always-hover setting                        | Turn it on                                   | Highlighting stays without the pointer                                             | Manual                                  |
| 5.15 | Theme                                       | Toggle light / dark                          | Canvas, toolbar and legend all change together                                     | Manual                                  |
| 5.16 | Jump along a relation                       | Click the disc on a relation line            | The view moves to the other end                                                    | Manual                                  |

## 6. Search and legend — all hosts

| #   | Case                               | Steps                           | Expected                                                                                   | Automated                                         |
| --- | ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 6.1 | Find a table                       | `Ctrl/Cmd+F`, type a table name | It is listed; choosing it centres the diagram on it and flashes its border                 | Manual                                            |
| 6.2 | Find a column                      | Type a column name              | Listed with its table; choosing it highlights the column                                   | Manual                                            |
| 6.3 | Legend matches the diagram         | Press `?`                       | Two sections — Notation and Keyboard shortcuts — and every mark in section 2 above appears | `embed.spec.ts` — legend says what the marks mean |
| 6.4 | Every shortcut in the legend fires | Press each key the legend lists | Each does what its row says                                                                | `matchShortcut.test.ts`                           |
| 6.5 | The legend fits a short frame      | Open it in a 420px-tall frame   | It scrolls inside the frame rather than overflowing                                        | `embed.spec.ts`                                   |
| 6.6 | Escape closes the legend           | Press Escape                    | It closes, and nothing else reacts to that keypress                                        | Manual                                            |

## 7. Export and layout — web app and extension

| #    | Case                                                | Steps                                                     | Expected                                                                              | Automated                                    |
| ---- | --------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| 7.1  | PNG                                                 | Export → PNG                                              | A `.png` downloads showing the whole diagram, not just the visible part               | Manual                                       |
| 7.2  | SVG                                                 | Export → SVG                                              | A `.svg` downloads and opens in a browser                                             | Manual                                       |
| 7.3  | AsciiDoc                                            | Export → AsciiDoc                                         | Tables and columns are listed as an AsciiDoc table                                    | `exportAsciiDoc.test.ts`                     |
| 7.4  | Markdown                                            | Export → Markdown                                         | The same, as Markdown                                                                 | `exportMarkdown.test.ts`                     |
| 7.5  | Download the schema                                 | Web app → Download                                        | The `.dbml` matches the editor's text                                                 | Manual                                       |
| 7.6  | Save the layout                                     | Arrange tables, Save layout                               | A `/*MetaInfo … MetaInfo*/` block appears at the end of the text with the coordinates | `writeLayoutIntoText.test.ts`                |
| 7.7  | A layout is per detail level                        | Save at two levels                                        | The block holds a set of coordinates for each                                         | `tableCoordsMetaInfo.test.ts`                |
| 7.8  | A saved layout is read back                         | Reopen a file carrying MetaInfo                           | Tables are where they were saved                                                      | `catalog.spec.ts` — layout saved and says so |
| 7.9  | A layout written at another level is not misapplied | Open a file whose MetaInfo is header-only, at full detail | Tables are arranged afresh, not piled on each other                                   | `detailLevelLayout.test.ts`                  |
| 7.10 | Undo                                                | In the extension, save a layout then press Undo           | The MetaInfo block reverts                                                            | Manual                                       |

## 8. Web app — files and sessions

| #   | Case                                      | Steps                                          | Expected                                                       | Automated                      |
| --- | ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- | ------------------------------ |
| 8.1 | Open a local file                         | Open `.dbml`                                   | It is added to the tree and drawn                              | Manual                         |
| 8.2 | Project catalogue                         | Deploy with `/schemas/`                        | The tree lists the project's models, and choosing one opens it | `catalog.spec.ts`              |
| 8.3 | A reader's edit of a project file is kept | Edit a project file, reload                    | The edit is still there, marked as the reader's own            | `catalog.spec.ts`              |
| 8.4 | Give a project file back                  | Use the revert action                          | The project's version returns                                  | `catalog.spec.ts`              |
| 8.5 | Remove a file                             | Remove one from the tree                       | It goes, including one that never parsed                       | `catalog.spec.ts`              |
| 8.6 | The tree can be hidden                    | Collapse the tree                              | The diagram takes the room, and the collapse survives a reload | Manual                         |
| 8.7 | The session survives a reload             | Open two files, reload                         | Both are still open, with the same one active                  | `session.test.ts`              |
| 8.8 | Nothing is fetched from the network       | Load the site with devtools open               | No request leaves the origin                                   | `site.spec.ts`                 |
| 8.9 | Interface language                        | Set the browser to ru / zh-CN / something else | The interface follows, falling back to English                 | `resolveBrowserLocale.test.ts` |

## 9. Embedded frame

The host page's half of this lives in the documentation repository
(`antora/docs/lib/dbml-frame-host.js`); cases 9.7–9.10 need both halves
deployed.

| #    | Case                                        | Steps                                      | Expected                                                                          | Automated             |
| ---- | ------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- | --------------------- |
| 9.1  | Draw one model                              | `embed.html?src=acl.dbml`                  | The model is drawn, and nothing but that one file is fetched                      | `embed.spec.ts`       |
| 9.2  | Filter tables                               | `&tables=a,b`                              | Only those tables and the relations between them                                  | `embed.spec.ts`       |
| 9.3  | A filtered diagram is arranged as itself    | Filter two tables out of an arranged model | They are placed near each other, not at the coordinates the whole model gave them | `embed.spec.ts`       |
| 9.4  | Theme from the query                        | `&theme=dark`                              | The frame opens dark, before the first paint                                      | Manual                |
| 9.5  | A path that leaves the catalogue is refused | `?src=../secret`                           | An error, and no request for that path                                            | `embedParams.test.ts` |
| 9.6  | Missing model, missing table                | `?src=nope.dbml`, `&tables=nope`           | Each is named on screen                                                           | `embed.spec.ts`       |
| 9.7  | Controls stay out of the way                | Load the frame, do not touch it            | No toolbar, no search box; both appear when the pointer is over the diagram       | `embed.spec.ts`       |
| 9.8  | `Ctrl/Cmd+F` while the search is hidden     | Press it without hovering                  | The browser's own find opens — the diagram does not take the key                  | `embed.spec.ts`       |
| 9.9  | Expand across the page                      | Hover, press the expand button             | The frame covers the page; the diagram re-frames to the new size                  | `embed.spec.ts`       |
| 9.10 | Escape collapses                            | Press Escape while expanded                | Back to the author's height                                                       | `embed.spec.ts`       |
| 9.11 | No button without a host                    | Open `embed.html` directly                 | No expand button — nothing would answer it                                        | `embed.spec.ts`       |
| 9.12 | The frame stores nothing                    | Use the frame, then read `localStorage`    | No key for this frame, and the full app's theme is untouched                      | `embed.spec.ts`       |
| 9.13 | Several frames on one page                  | A page with two `dbml::` blocks            | Both draw; expanding one collapses the other                                      | Manual                |

## 10. VS Code extension — DBML Studio

| #     | Case                                    | Steps                                    | Expected                                                      | Automated                      |
| ----- | --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- | ------------------------------ |
| 10.1  | `.dbml` opens as text                   | Open the file                            | Text editor, language `dbml`, one title button — Show diagram | `test:integration`             |
| 10.2  | Open the diagram in place               | Alt-click the button                     | The diagram replaces the tab                                  | `test:integration`             |
| 10.3  | Open beside                             | Plain click                              | Text and diagram side by side                                 | `test:integration`             |
| 10.4  | Back to source                          | Show DBML source                         | The text replaces the diagram tab                             | `test:integration`             |
| 10.5  | Reopen Editor With…                     | Use the menu                             | Both the text editor and DBML Diagram are offered             | `test:integration`             |
| 10.6  | A dirty file switches without prompting | Edit, then switch views both ways        | No save prompt, and the dirty marker stays                    | Manual                         |
| 10.7  | Two diagrams at once                    | Open two files, break one                | The other's Problems entries are untouched                    | Manual                         |
| 10.8  | Live update                             | Edit the text with the diagram beside it | The diagram follows the text                                  | Manual                         |
| 10.9  | Theme setting                           | Change `dbmlStudio.preferredTheme`       | The diagram follows                                           | Manual                         |
| 10.10 | Scroll direction setting                | Change `dbmlStudio.scrollDirection`      | Zoom direction follows                                        | Manual                         |
| 10.11 | Add a connection                        | Add a PostgreSQL connection              | It appears in the DBML Studio view                            | `connectionStore.test.ts`      |
| 10.12 | Import from a database                  | Import from a connection                 | A `.dbml` is produced from the live schema                    | `importFromDatabase.test.ts`   |
| 10.13 | A bad connection is explained           | Import with wrong credentials            | The message says what failed, without the password in it      | `dbImportErrorMessage.test.ts` |
| 10.14 | Compare with a database                 | Compare a file against a connection      | A Markdown report of what differs                             | `compareWithDatabase.test.ts`  |
| 10.15 | Delete a connection                     | Delete it                                | It goes from the view and from storage                        | `connectionStore.test.ts`      |
| 10.16 | Commands are namespaced                 | Open the palette, type "DBML"            | Every command is `dbmlStudio.*`                               | Manual                         |

## 11. Libraries

Covered by their own suites; listed so the coverage is visible in one place.

| #    | Package                     | What it must do                                                                    | Automated                      |
| ---- | --------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| 11.1 | `dbml-to-json-table-schema` | Turn parsed DBML into the diagram's schema — tables, columns, enums, indexes, refs | 21 tests                       |
| 11.2 | `dbml-to-json-table-schema` | Read and write the `MetaInfo` block without disturbing the rest of the file        | `metainfo.test.ts`             |
| 11.3 | `db-to-dbml`                | Read a live PostgreSQL schema and render it as DBML                                | 25 tests                       |
| 11.4 | `db-to-dbml`                | Filter to the schemas the reader asked for                                         | `filterDatabaseSchema.test.ts` |
| 11.5 | `schema-diff`               | Compare a DBML model against a database and render the difference                  | 22 tests                       |
| 11.6 | `schema-diff`               | Treat equivalent type spellings as equal                                           | `canonicalizeType.test.ts`     |
| 11.7 | `shared`                    | Build the key that ties a column to its table                                      | 3 tests                        |

## 12. Build and packaging

| #    | Case                                    | Steps                                          | Expected                                                                                | Automated                                                       |
| ---- | --------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 12.1 | Everything typechecks                   | `yarn typecheck`                               | Eight packages pass, and a package with TypeScript and no tsconfig is named as an error | `scripts/typecheck.js`                                          |
| 12.2 | Every suite runs                        | `yarn test`                                    | Seven packages pass, and a package with tests and no `test` script is named as an error | `scripts/test.js`                                               |
| 12.3 | The site builds and needs no CDN        | `yarn build:web`, then load it offline         | The editor works with the network down                                                  | `site.spec.ts`                                                  |
| 12.4 | The container serves the catalogue      | Build the image, run it                        | `/schemas/` lists the models the image was built with                                   | `schemaManifestScript.test.ts`, plus a run against a real image |
| 12.5 | The extension packages                  | `yarn workspace dbml-studio create:package`    | A `.vsix` is produced                                                                   | Manual                                                          |
| 12.6 | Stale test output cannot fail the suite | Delete a test's source, run `test:integration` | Its compiled copy does not run                                                          | `compile-tests` empties `out/`                                  |

---

## Gaps worth closing

Ordered by what would hurt most to get wrong.

1. **Export files are never opened.** 7.1 and 7.2 check that a download happens;
   nothing checks that the PNG holds the whole diagram or that the SVG opens.
   Both have gone wrong before in this kind of code.
2. **The extension's database features are unit-tested but never run against a
   database.** 10.12 and 10.14 mock the connector. A container with PostgreSQL
   in CI would turn six manual cases automatic.
3. **Themes and languages are eyeballed.** 5.15 and 8.9 have unit tests for the
   choosing, none for the result. Screenshot comparison over the four
   combinations would cover a lot of 5.10–5.15 at once.
4. **The relation-visibility feature is entirely manual** (5.6–5.9) apart from
   the shortcut matcher, and it is the one feature that deliberately writes
   nothing to the file — a regression there is silent.
5. **Nothing exercises a large model.** 1.7 is manual and vague. A fixture of a
   few hundred tables, opened with a time budget, would catch the layout
   regressions that only show at scale.
6. **`shouldHighLightCol` has no test at all.** It decides whether a column is
   painted as highlighted and is called for every column on every pointer move —
   the hot path the `hoverStore` rewrite was built around. `hoverStore.test.ts`
   covers the store beneath it and nothing covers the predicate itself. It is a
   pure function of six arguments; it should be the easiest thing here to test.
