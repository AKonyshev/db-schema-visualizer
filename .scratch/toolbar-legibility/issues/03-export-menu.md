# 03 — One export button with a format menu

**What to build:** Exporting a diagram becomes a choice instead of a guess. The three lookalike export icons are replaced by a single export button; clicking it opens a short menu naming the formats — PNG, SVG, AsciiDoc. Picking one downloads that file and closes the menu. Pressing Escape or clicking outside dismisses the menu without exporting anything.

**Blocked by:** 01 — Working tooltips on every toolbar button. The export button is built on the shared toolbar button component, whose interface changes in that ticket.

**Status:** ready-for-agent

- [ ] The toolbar has one export button in place of the previous three.
- [ ] Clicking it opens a menu listing PNG, SVG and AsciiDoc by name.
- [ ] Choosing a format downloads a file in that format and closes the menu.
- [ ] Escape closes the menu without exporting.
- [ ] A click outside the menu closes it without exporting.
- [ ] The menu opens on click, not on hover, so crossing the button on the way to a neighbour does not open it.
- [ ] Dismissal behaves the same way as the existing shortcuts legend, rather than introducing a second way to close a popup.
- [ ] Export stays entirely inside the webview — no message passing to the extension host is added.
- [ ] Menu entries name only the format; the word "Export" is not repeated inside a menu already titled "Export".
- [ ] The button carries its own label separate from the format entries, so no message key's name disagrees with its meaning.
- [ ] Every new interface string exists in all three locales, and a missing one fails the build.
- [ ] The three superseded export button components are removed rather than left unused.
- [ ] The manual test plan covers opening the menu, both dismissal routes, and downloading each of the three formats.
