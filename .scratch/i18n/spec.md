# Localized interface (English / Russian / Simplified Chinese)

Status: ready-for-agent

## Problem Statement

The extension speaks only one language at a time, and right now it does not even do that consistently: the diagram toolbar mixes English and Russian labels side by side, one generated document comes out in Russian while another comes out in English, and every message from the extension host is English regardless of who is reading it.

For a developer whose working language is not English, this makes the tool harder to use than it needs to be — the vocabulary of a schema tool is narrow and specific, and reading it in a second language costs attention that should go to the schema. For a developer whose working language _is_ English, the stray Russian labels look like a defect.

There is no way for anyone to fix this: no message catalog exists, so every string is welded into the component that renders it.

## Solution

The interface follows the language already chosen in VS Code. A developer working in Russian sees the diagram, the toolbar, the shortcuts legend, the command palette entries and the error messages in Russian; a developer working in Simplified Chinese sees them in Chinese; everyone else sees English.

Nothing new to configure and nothing to discover — the language the user already picked for their editor is the language the extension speaks.

Every user-facing string moves out of the components into catalogs, which makes the translation surface visible, reviewable, and open to contribution. English becomes the source language of the repository, so the mixed-language toolbar stops being possible.

## User Stories

1. As a Russian-speaking developer, I want the diagram toolbar in Russian, so that I can read the controls in my working language.
2. As a Russian-speaking developer, I want the keyboard shortcuts legend in Russian, so that I can learn the shortcuts without translating them first.
3. As a Russian-speaking developer, I want error messages from the database import in Russian, so that I understand what went wrong without re-reading.
4. As a Russian-speaking developer, I want the command palette entries in Russian, so that I can find commands by typing what I mean.
5. As a Chinese-speaking developer, I want the same coverage in Simplified Chinese, so that the tool is usable in my working language.
6. As an English-speaking developer, I want no stray Russian labels in the toolbar, so that the tool does not look broken.
7. As a developer whose VS Code is in German, Japanese or any other unsupported language, I want the interface in English rather than a half-translated mixture, so that I get one coherent language.
8. As a developer whose VS Code is in German, I want never to see a raw message key such as `action.autoArrange`, so that a missing translation degrades into readable English rather than internals.
9. As a Traditional Chinese reader, I want English rather than Simplified Chinese, so that I am not shown mainland terminology that differs from what I use.
10. As a developer, I want the language to follow my editor without an extension-specific setting, so that I do not have to configure the same thing twice.
11. As a developer, I want the command palette and the diagram to agree on their language, so that the interface does not feel split in half.
12. As a developer exporting an AsciiDoc document, I want its headings in my language, so that the exported document matches the rest of my work.
13. As a developer comparing a DBML file with a live database, I want the drift report headings in my language, so that I can read the result without switching context.
14. As a developer, I want table and column names in generated documents to stay exactly as they are in the schema, so that translation never corrupts identifiers.
15. As a developer using the Prisma extension, I want the shared diagram to be localized too, so that the two extensions behave the same way.
16. As a maintainer, I want a missing translation to fail the build rather than reach a user, so that an incomplete locale cannot ship unnoticed.
17. As a maintainer, I want adding a new user-facing string to force a decision about every locale, so that translations cannot silently drift behind the source.
18. As a maintainer, I want a check that fails when non-English text appears in the sources, so that the mixed-language state cannot come back through review fatigue.
19. As a maintainer, I want that check to name the file, the line and the offending text, so that I can act on the failure without investigating.
20. As a maintainer, I want the diff-rendering module to stay free of any editor dependency, so that it remains testable as a plain function.
21. As a maintainer, I want no new runtime dependency for translation, so that the already-large webview bundle does not grow for features we do not use.
22. As a maintainer, I want the locale decision expressed as one small pure function, so that its rules are provable rather than assumed.
23. As a community contributor, I want the Chinese translation to live in an obvious, editable place, so that I can submit a correction without reading the whole codebase.
24. As a community contributor, I want to know that the Chinese translation is unverified, so that I understand corrections are welcome rather than presumptuous.
25. As a user of the Chinese interface, I want honesty about the translation's provenance in the documentation rather than a warning banner in the app, so that my daily use is not interrupted by something I cannot act on.
26. As a maintainer, I want code comments in English, so that any contributor can read the reasoning behind a decision.
27. As a maintainer reviewing a pull request, I want translation changes to be isolated to catalog files, so that I can review wording separately from logic.
28. As a developer who already enabled a diagram setting, I want my settings preserved across this change, so that localization does not silently reset my preferences.
29. As a developer, I want the toolbar tooltips and the legend to use the same wording for the same action, so that the two never contradict each other.
30. As a maintainer, I want the language of the interface to be decided in one place, so that adding a fourth language later is a data change rather than a code change.

## Implementation Decisions

**Two localization mechanisms, split along the runtime boundary.** This is not a preference: the editor's localization API is a Node-side facility and does not reach the webview's browser context, and the platform provides no bridge. The extension host and the extension manifest use the platform mechanism; the diagram webview uses its own catalog.

**The webview's catalog is self-contained inside the visualizer package.** That package is consumed by both the DBML extension and the Prisma extension. An alternative design — resolving every string on the host and pushing a finished map into the webview, giving a single source of truth — was rejected because it would leave the Prisma extension either unlocalized or maintaining a duplicate catalog.

**The locale travels to the webview over the existing bootstrap channel** that already carries the theme and the scroll direction. No new transport.

**The language is taken from the editor's display language only; no extension-specific setting is introduced.** The manifest's contributed strings — command titles and setting descriptions — are resolved by the editor when it loads the manifest, before any extension code runs. An extension-level setting therefore could not influence them, and would guarantee a permanently split interface: palette in the editor's language, diagram in the setting's. If the need appears later, such a setting can be added scoped to the webview only, with that limitation documented.

**Locale completeness is a compile-time property, not a test.** Message keys are declared once from the English source; every other locale is typed as a total record over those keys. A forgotten translation fails the type check. This shape encodes the decision more precisely than prose:

```ts
export type MessageKey = keyof typeof MESSAGES_EN;
export const MESSAGES_RU: Record<MessageKey, string> = {
  /* … */
};
```

**Runtime fallback exists for one case only: an unsupported display language.** Missing keys within a supported locale are impossible by the above. The English catalog is always present, so a raw key can never surface in the interface.

**Simplified Chinese is supported; Traditional Chinese falls back to English, not to Simplified.** Locale matching is exact rather than by prefix. Mainland and Taiwan technical terminology diverge materially, and the Chinese translation is itself unverified — widening its audience would widen the reach of an error nobody on the team can detect.

**One rule governs scope: everything user-facing follows the locale, including generated documents.** The AsciiDoc export and the schema drift report are covered. The alternative — treating generated documents as shared artifacts that stay English — was rejected because it requires remembering an exception every time a string is added. Only the prose around the data is translated; table, column and enum identifiers come from the schema and are never touched.

**The diff-rendering module receives its labels as an argument** rather than resolving them itself, so it acquires no dependency on the editor API and stays a plain, directly testable function. The host builds the label set.

**No internationalization library is added.** The webview's strings contain no interpolation, so plural rules and message formatting would be unused weight in a bundle that is already large. The host's strings do contain interpolation, and the platform API supports it natively — another reason the split above is the right one.

**English becomes the source language of the repository**, including code comments and test fixtures. This is both a prerequisite for the catalogs and the fix for the mixed-language interface that prompted the work.

**Existing stored settings keep their identifiers.** Renaming a stored preference key as part of this work would silently reset that preference for everyone who had enabled it.

## Testing Decisions

**What a good test looks like here.** It exercises externally observable behavior through a stable entry point and would fail if the behavior regressed. It does not assert on how the result was produced. The package's existing pure-function tests are the prior art: they call a function with plain inputs and assert on its return value, with no mocks of internal collaborators.

**One new seam: locale resolution.** A single pure function maps the editor's display language to a supported locale. It carries the only branching logic in the feature, so it is where tests earn their keep. Coverage: each supported language maps to itself; matching is case-insensitive; Traditional Chinese falls back to English rather than Simplified; an arbitrary unsupported language falls back to English; a missing or empty language falls back to English. Prior art: the existing shortcut-matching tests, which have the same shape — pure input, enumerated branches, node environment.

**Two existing seams are reused, not duplicated.** The AsciiDoc export already has a test, and the diff renderer already has tests in its own package. Both get updated expectations and, for the renderer, an updated call signature. No new test files are introduced for either — reusing a seam is preferred to adding one.

**Locale completeness is deliberately not tested.** The total-record type makes a missing key a compile error, which is strictly stronger than any test could be: a test can only check the locales it knows about, whereas the type checks every key by construction. Writing a test here would add maintenance for weaker guarantees.

**Component rendering is deliberately not tested.** The package's test environment is Node with no DOM and no React testing library, matching how the rest of the diagram is verified. Interface checks stay manual, in the existing manual test plan.

**A repository-wide guard, separate from the feature tests.** A check fails when Cyrillic or CJK characters appear anywhere in the sources outside the catalog files. It is an invariant closer to a lint rule than to a feature test, and it enforces the English-source rule mechanically rather than by discipline. Its failure output must name file, line and offending text.

**A caution carried over from designing that guard.** Its first formulation used the version-control tool's regular-expression search for Unicode script properties. On this machine that engine silently matches nothing for such patterns, and byte-matches false positives for literal character ranges — the check would have been permanently green and useless while appearing to work. It was moved to run in the runtime whose regular-expression support was verified first. Anyone revising this guard should re-verify that it still fails on known-bad input before trusting it.

## Out of Scope

- **Translating the repository's documentation.** README and other docs stay English. Maintaining three translations of documentation costs more than it returns, and diverged documentation is worse than none. The English README gains a section describing language support — that is a description of the feature, not a translation.
- **An extension-specific language setting.** Rationale above; revisit only if a concrete need appears.
- **Traditional Chinese as its own locale.** No reviewer is available even for the Simplified translation.
- **Plural rules and message formatting in the webview.** No interpolated strings exist there.
- **Localizing the Prisma extension's own host messages.** The shared diagram it renders is localized by this work; that extension's own commands and messages are a separate surface and a separate decision.
- **Verifying the Chinese translation.** Shipped as a community contribution; see below.
- **Any change to diagram behavior, layout or styling.**

## Further Notes

The Chinese translation ships **unverified**: nobody on the team reads Chinese. This was a deliberate, explicit choice rather than an oversight, made against the alternative of shipping English to Chinese users. The risk is specific rather than vague — schema tooling has narrow terminology that machine translation degrades in ways that look fluent, so a wrong term reads as correct. The provenance is stated in the README and in the release notes, where a potential corrector will look, and deliberately _not_ as an in-app banner: a warning shown to every Chinese user in every session is noise they cannot act on and does not make the translation better.

The Russian translation is authored and reviewed by the team and carries no such caveat.

The mixed-language toolbar that prompted this work is fixed by the first step alone, before any second locale exists. If the work is interrupted after that step, the original complaint is already resolved and the repository is left in a coherent state.

A detailed design document and a task-level implementation plan for this work already exist, but only in the author's working copy: this repository deliberately keeps design and plan artifacts out of version control, so they are not reachable from this ticket. Ask the author if you need them.
