import { METAINFO_END, METAINFO_START } from "dbml-to-json-table-schema";

// Types only, and from the same narrow entry the runtime uses — importing the
// package root here would be erased today but would put the whole of Monaco one
// dropped `type` keyword away from the bundle.
import type { editor, languages } from "monaco-editor/editor/editor.api";

const escapeForRegExp = (literal: string): string =>
  literal.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// The same identifier the extension declares in `contributes.languages`. Kept in
// step by a test, because a typo here does not fail — it just stops the
// highlighting applying, quietly.
export const DBML_LANGUAGE_ID = "dbml";

export const DBML_DARK_THEME_ID = "dbml-dark";
export const DBML_LIGHT_THEME_ID = "dbml-light";

// The stock `vs-dark` theme cannot express what this grammar means. Its
// `metatag` is a saturated salmon — the layout block would be the loudest thing
// on screen rather than the quietest — and its `attribute.value` is the exact
// same colour as `string`, so two of the categories the ticket asks to be
// distinct would render identically.
//
// So the token names above are this grammar's own, and this theme is what gives
// them meaning. Built on `vs-dark`, so anything not listed keeps its familiar
// colour.
export const DBML_DARK_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "569CD6" },
    { token: "identifier", foreground: "D4D4D4" },
    { token: "string", foreground: "CE9178" },
    { token: "number", foreground: "B5CEA8" },
    { token: "comment", foreground: "6A9955" },
    { token: "setting.bracket", foreground: "9CDCFE" },
    // Deliberately not the string colour: `[note: 'x']` puts a real string
    // beside a setting value, and they have to be tellable apart.
    { token: "setting.value", foreground: "C586C0" },
    // Machine-written bookkeeping. Dim enough to read past, still legible if
    // you go looking.
    { token: "metainfo", foreground: "6E6E6E", fontStyle: "italic" },
  ],
  // The editor sits in the page rather than in a window of its own, so it takes
  // the page's surface instead of Monaco's near-black. The values are the dark
  // palette's `surface-sunken` and `text`; a stylesheet cannot reach in here.
  colors: {
    "editor.background": "#0b0d11",
    "editor.foreground": "#e6e9ef",
    "editorLineNumber.foreground": "#3a4150",
    "editorLineNumber.activeForeground": "#98a2b3",
    "editorCursor.foreground": "#4f8cff",
    "editor.selectionBackground": "#1d4ed855",
    "editor.lineHighlightBackground": "#171a21",
  },
};

/**
 * The same grammar in daylight.
 *
 * Not `vs` with the dark rules left on: every foreground here is chosen against
 * a white page, and the two themes are the same categories in two keys — a
 * keyword is a keyword in both, and the layout block stays the quietest thing on
 * screen in both.
 */
export const DBML_LIGHT_THEME: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "1D4ED8" },
    { token: "identifier", foreground: "0F172A" },
    { token: "string", foreground: "B45309" },
    { token: "number", foreground: "15803D" },
    { token: "comment", foreground: "64748B" },
    { token: "setting.bracket", foreground: "0E7490" },
    { token: "setting.value", foreground: "9333EA" },
    { token: "metainfo", foreground: "94A3B8", fontStyle: "italic" },
  ],
  colors: {
    "editor.background": "#f1f5f9",
    "editor.foreground": "#0f172a",
    "editorLineNumber.foreground": "#cbd5e1",
    "editorLineNumber.activeForeground": "#64748b",
    "editorCursor.foreground": "#2563eb",
    "editor.selectionBackground": "#93c5fd66",
    "editor.lineHighlightBackground": "#e2e8f0",
  },
};

// Written from scratch: the extension declares the language and its file icon
// but contributes no grammar, so there was nothing to reuse.
export const DBML_TOKENS: languages.IMonarchLanguage = {
  ignoreCase: false,
  defaultToken: "",

  // Column types are deliberately absent. DBML does not close that set — a
  // database can name a type anything — so listing the common ones would leave
  // every other type looking like a mistake.
  keywords: [
    "Table",
    "Ref",
    "Enum",
    "Project",
    "TableGroup",
    "Note",
    "indexes",
  ],

  tokenizer: {
    root: [
      // The layout block first: it opens with `/*`, so the general block-comment
      // rule below would otherwise claim it and it could not be styled apart.
      // The delimiters come from the package that writes them, so the grammar
      // cannot fall behind a change to the format.
      [
        new RegExp(escapeForRegExp(METAINFO_START)),
        { token: "metainfo", next: "@metainfo" },
      ],

      [/\/\/.*$/, "comment"],
      [/\/\*/, { token: "comment", next: "@blockComment" }],

      [/'''/, { token: "string", next: "@multilineString" }],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],

      // `[pk]`, `[ref: > users.id]`, `[note: '…']` — one token class, so
      // settings read as metadata instead of competing with the column beside
      // them.
      [/\[/, { token: "setting.bracket", next: "@settings" }],

      [/\b\d+(\.\d+)?\b/, "number"],

      [
        /[A-Za-z_]\w*/,
        { cases: { "@keywords": "keyword", "@default": "identifier" } },
      ],

      [/[{}]/, "delimiter.curly"],
      [/[<>-]/, "operator"],
    ],

    // Machine-written bookkeeping rather than authored DBML, so the whole block
    // is one dim colour instead of being syntax-coloured like the schema.
    metainfo: [
      [
        new RegExp(escapeForRegExp(METAINFO_END)),
        { token: "metainfo", next: "@pop" },
      ],
      [/./, "metainfo"],
    ],

    blockComment: [
      [/[^/*]+/, "comment"],
      [/\*\//, { token: "comment", next: "@pop" }],
      [/[/*]/, "comment"],
    ],

    multilineString: [
      [/[^']+/, "string"],
      [/'''/, { token: "string", next: "@pop" }],
      [/'/, "string"],
    ],

    settings: [
      [/\]/, { token: "setting.bracket", next: "@pop" }],
      [/'([^'\\]|\\.)*'/, "string"],
      [/"([^"\\]|\\.)*"/, "string"],
      [/[^\]'"]+/, "setting.value"],
    ],
  },
};
