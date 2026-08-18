// What the editor holds on a first visit — something to look at, and a shape to
// copy. Replaced the moment the reader types or opens a file.
export const INITIAL_DBML = `Table users {
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
