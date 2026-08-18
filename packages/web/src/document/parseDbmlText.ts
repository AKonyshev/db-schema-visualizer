import { parseDBMLToJSON } from "dbml-to-json-table-schema";

import type { JSONTableSchema } from "shared/types/tableSchema";

export interface ParsedDocument {
  schema: JSONTableSchema | null;
  errorMessage: string | null;
}

const EMPTY_SCHEMA: JSONTableSchema = { tables: [], refs: [], enums: [] };

// The editor spends most of its time holding text that is not yet valid DBML, so
// a parse failure is a state to render, not an exception to propagate. The parser
// throws for anything from a stray brace to a reference pointing at a table that
// does not exist yet — all of which are just what a half-finished schema looks
// like.
export const parseDbmlText = (text: string): ParsedDocument => {
  if (text.trim() === "") {
    return { schema: EMPTY_SCHEMA, errorMessage: null };
  }

  try {
    return { schema: parseDBMLToJSON(text), errorMessage: null };
  } catch (error) {
    return {
      schema: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
};
