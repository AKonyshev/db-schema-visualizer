# Toolbar legibility: label rule, real tooltips, one export menu

Status: ready-for-agent

## Problem Statement

The diagram toolbar does not explain itself.

Half its buttons carry a text label and half do not, with no discernible reason for the split. The result is the worst of both worlds: it is as wide as a labelled toolbar while being as opaque as an icon-only one.

The sharpest edge is export. Three buttons sit side by side — PNG, SVG and AsciiDoc — with icons that look nearly identical. There is no way to pick a format except by trial and error, and picking wrong means downloading a file you then have to delete.

Tooltips appear to be missing entirely. They are in fact present, but they are the operating system's own: they take about a second to appear and look nothing like the rest of the editor. In a dense toolbar nobody waits that long, so in practice the buttons that most need explaining — the unlabelled ones — explain nothing.

## Solution

Every button becomes understandable, and the toolbar gets narrower rather than wider.

Whether a button shows text stops being arbitrary and follows one rule: controls that hold a state show their name, one-shot actions do not. A toggle's value has to be readable at a glance — you need to know whether coloured relations are on without hovering — whereas an action has nothing to read once it has run.

The three export buttons collapse into one that opens a short menu naming the formats, so choosing a format is a choice rather than a guess.

Tooltips are replaced with ones that belong to the interface: they appear immediately, match the surrounding styling, and name the keyboard shortcut where the action has one. Buttons that lose their label keep an accessible name, so nothing regresses for anyone using a screen reader.

## User Stories

1. As someone reading a schema, I want to know what a toolbar button does before clicking it, so that I do not trigger something unexpected.
2. As someone reading a schema, I want a tooltip to appear as soon as I hover, so that I get the answer while my pointer is still on the button.
3. As someone reading a schema, I want tooltips that look like the rest of the editor, so that the interface feels like one product.
4. As someone exporting a diagram, I want to choose the file format by name, so that I do not download the wrong one and repeat the export.
5. As someone exporting a diagram, I want the format choice to be one button rather than three lookalike icons, so that the toolbar stops asking me to decode pictures.
6. As someone exporting a diagram, I want the menu to close when I press Escape or click away, so that I can back out without committing to a format.
7. As someone exporting a diagram, I want picking a format to both download the file and close the menu, so that the interface does not linger in a half-finished state.
8. As someone using the diagram, I want to see at a glance which view modes are currently on, so that I can tell why the diagram looks the way it does.
9. As someone using the diagram, I want the toolbar to fit on one line, so that it does not eat the canvas I am trying to read.
10. As a keyboard user, I want the tooltip to tell me the shortcut for an action, so that I learn the keyboard path at the moment I reach for the mouse.
11. As a keyboard user, I want the shortcut shown in the tooltip to be the one that actually fires, so that I do not learn something false.
12. As a keyboard user, I want actions without a shortcut to simply omit it, so that I am not shown empty brackets or placeholder text.
13. As a screen-reader user, I want every toolbar button to have an accessible name, so that an icon-only button is not announced as an unlabelled control.
14. As a screen-reader user, I want the keyboard shortcut included in that name, so that I learn the shortcuts that sighted users see on hover.
15. As a screen-reader user, I want the visual tooltip not to be announced separately, so that the same text is not read to me twice.
16. As a new user, I want the toolbar to be learnable without documentation, so that I can start using the diagram immediately.
17. As a returning user, I want the button positions to stay stable, so that the muscle memory I built still works.
18. As a maintainer, I want one rule that decides whether a new button gets a label, so that the question is settled before the debate starts.
19. As a maintainer, I want the rule to have its exception written down, so that the theme toggle does not look like an oversight.
20. As a maintainer, I want tooltips to come from the shared button component, so that a new button cannot ship without one.
21. As a maintainer, I want the tooltip's text assembled in one tested place, so that a missing shortcut cannot leak "undefined" into the interface.
22. As a maintainer, I want the shortcut text to come from the existing shortcut registry, so that it cannot drift from the real bindings.
23. As a maintainer, I want the button component to stay presentational, so that it does not acquire knowledge of the shortcut registry.
24. As a maintainer, I want no new runtime dependency for a tooltip, so that an already-large webview bundle does not grow for a hover effect.
25. As a maintainer, I want the export menu to dismiss the same way the shortcuts legend does, so that the app has one way of closing a popup rather than two.
26. As a maintainer, I want the export flow to stay inside the webview, so that a three-item menu does not couple this package to the editor host.
27. As a translator, I want the export menu items to name formats only, so that the word "Export" is not repeated in every row of a menu already titled "Export".
28. As a translator, I want a new interface string to fail the build until every locale has it, so that a partially translated toolbar cannot ship.
29. As a reviewer, I want the buttons that lose their labels to be listed explicitly, so that the change is a decision rather than a side effect.
30. As a reviewer, I want to know which parts cannot be covered by tests, so that I know what still needs a human to look at it.

## Implementation Decisions

**One rule governs labels: a control that holds state shows its name; a one-shot action does not.** Under it, the detail-level cycle, short table names, coloured relations and relation animation keep their labels; auto-arrange, fit-to-view, export and the shortcuts legend become icon-only. The toolbar goes from eleven buttons with six labels to nine buttons with four, so it ends up narrower than before.

**The theme toggle is a stated exception.** It holds state but shows no label, because its icon already is the indicator — it changes between a sun and a moon. A label would restate what the icon says. Writing the exception down keeps it from reading as forgetfulness.

An alternative rule — "label whatever has an unclear icon" — was rejected. It is not a rule: clarity is subjective, so the argument would restart for every future button.

**Tooltip markup lives inside the shared toolbar button component**, not in a separate tooltip component that each button would opt into. Every toolbar button needs one and only toolbar buttons need one; putting it in the shared component means a new button gets a tooltip by construction, whereas an opt-in component would eventually be forgotten on one.

**The native tooltip is removed entirely.** Keeping it alongside a custom one would show both — ours immediately, the system's a second later on top of it.

**Because the native tooltip also supplied the accessible name, every button now sets one explicitly.** Removing it from an icon-only button without replacement would leave that button unnamed for assistive technology. This is not hypothetical: a recent review in this codebase caught exactly that gap on the theme toggle, where the tooltip had been localized and the accessible name forgotten.

**The accessible name includes the shortcut, and the visual tooltip is hidden from assistive technology.** The two carry identical text; announcing both would read it twice. An earlier draft marked the visual element with a tooltip role that nothing referenced, which conveys nothing — that was dropped.

**The tooltip names the keyboard shortcut, taken from the existing shortcut registry.** The registry is already the single source of truth for what the key handler fires and what the legend lists, so a tooltip built from it cannot claim a binding that does not exist.

**The button receives a resolved shortcut string, not an action identifier.** Passing an identifier would oblige the presentational button to look it up in the registry. A small lookup helper lives beside the registry instead, so the button stays unaware of the domain.

**Tooltip text is assembled by one pure function**, so a button without a shortcut degrades to the bare label rather than to empty brackets or the word "undefined".

**No tooltip or UI library is added.** The toolbar sits in a fixed position with its buttons in a row; the collision handling that justifies a positioning library is not needed here, and the same reasoning previously ruled out an internationalization library for this package.

**The export menu lives in the webview rather than using the editor's own picker.** Export is already entirely local — the canvas is turned into a blob and downloaded without the host being involved. Routing a three-item menu through the host would introduce message passing where none exists and tie a package that currently runs standalone to the editor, for no functional gain.

**The menu opens on click, not on hover.** The toolbar is dense; a hover menu would open whenever the pointer crossed the button on its way to a neighbour.

**The menu dismisses on Escape and on a click outside**, matching the existing shortcuts legend, so the application has one dismissal idiom rather than two.

**Export message keys are restructured, because the buttons' meaning changes.** A new key carries the button's own label; the three format keys become menu items naming only the format. Reusing the PNG key as the button's label was rejected: the key name would say "PNG" while its value meant "export in general", and that kind of name-meaning drift has already been caught by review in this codebase.

## Testing Decisions

**What a good test looks like here.** It calls a function with plain inputs and asserts on the returned value, through an entry point that will still exist after refactoring. It does not reach into rendering internals. The package's existing pure-function suites are the prior art — they take ordinary arguments and check the result, with no mocking of internal collaborators.

**One new seam: the tooltip text assembly.** It is the only branching logic the change introduces, and it guards a class of defect that is easy to miss by eye — a button with no shortcut rendering empty brackets, a lowercase key shown unshifted, a blank string treated as a real shortcut. Coverage: a label with a shortcut, a label without one, an explicitly undefined shortcut, an empty and a whitespace-only shortcut, a non-letter key, and a multi-character key. Prior art: the existing locale-resolution and shortcut-matching suites, which have the same shape.

**No new seam for rendering.** The package's test environment is Node with no DOM and no React testing library, matching how the rest of the diagram is verified. Tooltip visibility, menu open and close behaviour, and toolbar layout go into the manual test plan instead.

**Deliberately not automated: whether an icon is recognisable.** Two buttons lose their labels, and the only way to know whether that was acceptable is for a person to look at the toolbar and say whether they still recognise them. If either is not recognisable, the conclusion is that the icon is wrong — not that the label should come back, which would dissolve the rule into exceptions.

## Out of Scope

- **Redrawing icons.** If the manual check finds an icon unrecognisable, replacing it is separate work.
- **A setting to show or hide labels.** The rule decides; making it configurable would reintroduce the inconsistency it exists to remove.
- **Keyboard shortcuts for export or the theme toggle.** Their absence was a deliberate earlier decision — export is easy to trigger by accident and has no undo.
- **Moving export to the extension host.**
- **Reordering or regrouping the toolbar.** Button positions stay where they are.
- **The diagram canvas, the sidebar panel, and any host-side interface.**

## Further Notes

The claim that the missing tooltips are the operating system's own is a deduction, not an observation. What was verified is that the tooltip attribute is present on all eleven buttons, that the toolbar is an ordinary element rendered above the canvas, and that nothing in the project suppresses pointer events — so the attribute is not being ignored. The remaining explanation is the native tooltip's latency and appearance. If custom tooltips do not resolve the complaint, the real cause is something else and the investigation starts over.

The change slightly reduces the shortcuts legend's value, since part of its purpose — discovering shortcuts — now happens on hover. The legend remains the only place showing the complete list at once, including the search and DBML-ref shortcuts, which have no toolbar buttons at all.
