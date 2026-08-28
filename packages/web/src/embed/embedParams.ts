import { Theme } from "json-table-schema-visualizer/src/types/theme";

import { type EmbedError } from "./embedError";

export interface EmbedParams {
  /** Path relative to the schema catalogue — what `loadSchemaText` takes. */
  src: string;
  /** Names to keep, or `null` for the whole schema. Never an empty array: an
   * empty list means the author filtered nothing, not that they filtered
   * everything away. */
  tables: string[] | null;
  theme: Theme;
}

export type EmbedParamsResult =
  | { ok: true; params: EmbedParams }
  | { ok: false; error: EmbedError };

/**
 * A path is only ever joined to `/schemas/`, so it must not be able to aim
 * anywhere else: no leading slash, no `..` segment, no scheme. Checked here
 * rather than trusted from the macro, because the address bar is editable and
 * the frame is what a reader ends up looking at.
 */
const isCatalogPath = (value: string): boolean => {
  if (value.startsWith("/") || value.includes("://")) {
    return false;
  }

  return !value.split("/").includes("..");
};

const parseTheme = (value: string | null): Theme =>
  value === Theme.dark ? Theme.dark : Theme.light;

const parseTables = (value: string | null): string[] | null => {
  if (value === null) {
    return null;
  }

  const names = value
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");

  return names.length === 0 ? null : names;
};

export const parseEmbedParams = (search: string): EmbedParamsResult => {
  const query = new URLSearchParams(search);
  const src = query.get("src") ?? "";

  if (src === "") {
    return { ok: false, error: { kind: "srcMissing" } };
  }

  if (!isCatalogPath(src)) {
    return { ok: false, error: { kind: "srcInvalid", value: src } };
  }

  return {
    ok: true,
    params: {
      src,
      tables: parseTables(query.get("tables")),
      theme: parseTheme(query.get("theme")),
    },
  };
};
