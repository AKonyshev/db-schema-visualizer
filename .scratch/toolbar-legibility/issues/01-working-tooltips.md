# 01 — Working tooltips on every toolbar button

**What to build:** Hovering any button in the diagram toolbar shows a tooltip straight away, styled like the rest of the interface, naming the action and — where the action has one — its keyboard shortcut. The operating system's own tooltip no longer appears behind it a second later. Buttons that show only an icon still announce themselves properly to a screen reader, including the shortcut, and the visual tooltip is not read out a second time on top of that.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Hovering any toolbar button shows a styled tooltip immediately, with no perceptible delay.
- [ ] No native browser tooltip appears on any toolbar button.
- [ ] Auto-arrange shows `(L)`, fit-to-view `(F)` and the shortcuts legend `(?)` in the tooltip.
- [ ] Export and the theme toggle, which have no shortcut, show the label alone — no empty brackets, no placeholder text.
- [ ] The shortcut shown is read from the existing shortcut registry, so it cannot disagree with the key that actually fires.
- [ ] Every toolbar button exposes an accessible name that includes the shortcut when there is one.
- [ ] The visual tooltip is hidden from assistive technology, so its text is not announced twice.
- [ ] The shared toolbar button component supplies the tooltip, so a button cannot be added without one.
- [ ] The component that renders a button does not read the shortcut registry itself — it receives a resolved shortcut.
- [ ] Tooltip text assembly is a pure function covered by tests: label with a shortcut, label without one, an explicitly absent shortcut, an empty and a whitespace-only shortcut, a non-letter key, and a multi-character key.
- [ ] No new runtime dependency is introduced.
- [ ] The manual test plan gains steps covering tooltip appearance, the shortcut suffix, and the absence of the native tooltip.
