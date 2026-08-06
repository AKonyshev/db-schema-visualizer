import { parseDBMLToJSON } from "dbml-to-json-table-schema";

import type { JSONTableSchema } from "shared/types/tableSchema";

// Scaffold-only. The point of this ticket is to prove the delivery path works
// end to end before anything is made editable; the next ticket replaces this
// with the editor's text.
const SAMPLE_DBML = `Table users {
  id integer [pk]
  email varchar [unique]
  created_at timestamp
}

Table posts {
  id integer [pk]
  author_id integer
  title varchar
  body text
}

Ref: posts.author_id > users.id
`;

export const sampleSchema: JSONTableSchema = parseDBMLToJSON(SAMPLE_DBML);
