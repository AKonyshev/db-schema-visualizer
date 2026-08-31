import { useContext } from "react";

import { ForeignKeysContext } from "@/providers/ForeignKeysProvider";

// Shared, so a component rendered outside a provider does not get a new empty
// set — and so a new render — on every pass.
const NONE: ReadonlySet<string> = new Set<string>();

/** Every foreign key on the diagram; see `computeForeignKeyFields`. */
export const useForeignKeys = (): ReadonlySet<string> =>
  useContext(ForeignKeysContext) ?? NONE;
