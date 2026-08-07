import { METAINFO_END, METAINFO_START } from "dbml-to-json-table-schema";

import type { languages } from "monaco-editor";

const escapeForRegExp = (literal: string): string =>
  literal.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// The same identifier the extension declares in `contributes.languages`. Kept in
// step by a test, because a typo here does not fail — it just stops the
// highlighting applying, quietly.
export const DBML_LANGUAGE_ID = "dbml";

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
        { token: "metatag", next: "@metainfo" },
      ],

      [/\/\/.*$/, "comment"],
      [/\/\*/, { token: "comment", next: "@blockComment" }],

      [/'''/, { token: "string", next: "@multilineString" }],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],

      // `[pk]`, `[ref: > users.id]`, `[note: '…']` — one token class, so
      // settings read as metadata instead of competing with the column beside
      // them.
      [/\[/, { token: "attribute.name", next: "@settings" }],

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
        { token: "metatag", next: "@pop" },
      ],
      [/./, "metatag"],
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
      [/\]/, { token: "attribute.name", next: "@pop" }],
      [/'([^'\\]|\\.)*'/, "string"],
      [/"([^"\\]|\\.)*"/, "string"],
      [/[^\]'"]+/, "attribute.value"],
    ],
  },
};
