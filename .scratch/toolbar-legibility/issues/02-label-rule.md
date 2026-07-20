# 02 — Apply the label rule to the toolbar

**What to build:** Whether a toolbar button shows text stops being arbitrary. Controls that hold a state — the detail-level cycle, short table names, coloured relations, relation animation — keep their names, because you need to read their value at a glance without hovering. One-shot actions do not, because there is nothing to read once they have run. Auto-arrange and fit-to-view therefore become icon-only, and the toolbar ends up narrower than it was.

The theme toggle is the one stated exception: it holds state but shows no label, because its icon already changes between a sun and a moon and so is itself the indicator.

**Blocked by:** 01 — Working tooltips on every toolbar button. A button that loses its label before tooltips work would be an unexplained icon whose only description is the slow native tooltip, which is worse than the state we are fixing.

**Status:** ready-for-agent

- [ ] Auto-arrange and fit-to-view show their icon only, with no text.
- [ ] The detail-level cycle, short table names, coloured relations and relation animation keep their text.
- [ ] The theme toggle stays icon-only, and the reason is recorded in the code so it does not read as an oversight.
- [ ] Both buttons that lose their text still have a working tooltip and accessible name from ticket 01.
- [ ] The toolbar occupies less horizontal space than before the change and fits on one line at a normal window width.
- [ ] Button order and grouping are unchanged, so existing muscle memory still works.
- [ ] A human confirms both newly icon-only buttons are still recognisable. If either is not, the finding is that the icon needs replacing — the label is not restored, as that would dissolve the rule into exceptions.
- [ ] The manual test plan records that recognisability check, including what to conclude when it fails.
