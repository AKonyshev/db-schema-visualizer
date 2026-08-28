/**
 * Everything that can go wrong between a page's `dbml::` block and a drawn
 * diagram.
 *
 * One type for the whole frame rather than one per module: the reader sees a
 * single message wherever the trouble started, and the author reading it is
 * looking at their own macro either way.
 */
export type EmbedError =
  | { kind: "srcMissing" }
  | { kind: "srcInvalid"; value: string }
  | { kind: "notFound"; src: string }
  | { kind: "tableMissing"; name: string }
  | { kind: "tableAmbiguous"; name: string }
  | { kind: "noTablesLeft" };
