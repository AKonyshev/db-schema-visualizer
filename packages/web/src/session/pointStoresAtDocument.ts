import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";

import { parseDbmlText } from "../document/parseDbmlText";

import { documentText, type LoadedTexts } from "./documentText";
import { documentKeyOf, type DocumentId, type Session } from "./session";

/**
 * The per-document stores, pointed at one document.
 *
 * Shared by the entry point and the page for the same reason it is a function
 * at all: both have to do it before a render rather than in an effect —
 * `DiagramViewer` is keyed on the document key, so React mounts the new one
 * during the render that follows, and an effect would arrive after the viewer
 * had already read the previous document's table positions.
 */
export const pointStoresAtDocument = (
  session: Session,
  loaded: LoadedTexts,
  id: DocumentId,
): void => {
  const { schema } = parseDbmlText(documentText(session, loaded, id));

  switchDocument(documentKeyOf(id), schema?.tables ?? [], schema?.refs ?? []);
};
