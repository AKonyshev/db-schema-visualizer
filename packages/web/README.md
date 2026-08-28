# The site

The same schema visualizer as the VS Code extension, as a web page: a DBML
editor on the left, the diagram it describes on the right.

It is the extension's viewer, not a reimplementation of it. Both hosts mount the
same `DiagramApp` from `json-table-schema-visualizer`; the difference is only
where the schema comes from — the extension is handed messages by its extension
host, this package hands over the text in its editor.

## There is no backend

Nothing you open here leaves the browser. There is no server to talk to, no
telemetry, and nothing fetched from anywhere but the origin the page itself came
from — the editor is bundled into the page rather than pulled from a CDN, which
is what makes the site usable inside a closed network. Schemas you open, edit and
download are read and written by the page itself, and table layouts are
remembered in the browser's own storage.

The one thing the page does ask its own server for is the schema catalogue, when
the image was built with one: a manifest and the `.dbml` files behind it, static
files an operator put there. Nothing is written back — there is no endpoint that
could accept it.

The [smoke test](./e2e/site.spec.ts) asserts exactly that: it records every
request the built page makes and fails if any of them leaves the origin.

## Local development

From the repository root:

```bash
yarn install
yarn workspace web dev
```

The dev server prints a URL. Edits to this package and to the visualizer package
both hot-reload.

## Building

```bash
yarn build:web
```

Output lands in `packages/web/dist` — an entry document plus fingerprinted
assets, ready to be served by any static web server.

## Running the container image

Built from the repository root, because the site depends on four sibling
packages by source and the build needs the whole workspace in context.

```bash
docker compose up --build
```

The equivalent without Compose:

```bash
docker build -f packages/web/Dockerfile -t dbml-schema-visualizer-web .
docker run --rm -p 8080:8080 dbml-schema-visualizer-web
```

The site is then on <http://localhost:8080>.

The image is two stages: a Node stage that installs and builds, and an nginx
stage that serves `dist` and nothing else. [`nginx.conf`](./nginx.conf) caches
the fingerprinted assets for a year and refuses to cache the entry document, so
a deployment reaches readers without anyone having to hard-refresh. There is
deliberately no single-page fallback — the site has no routing, so a catch-all
could only turn a missing asset into a 200 serving HTML.

### Project schemas inside the image

The image can be built around a folder of `.dbml` files. The site then shows them
as a tree on the left and opens the first of them the moment the container is up,
so nobody has to find a schema and drag it into the window.

```bash
docker build -f packages/web/Dockerfile --build-context schemas=/path/to/my-project -t my-schemas .
```

The folder can live anywhere on disk: it arrives as a build context of its own
rather than out of this repository. A layer on top of the published image does
the same thing:

```dockerfile
FROM dbml-schema-visualizer-web
COPY ./my-project /srv/schemas
```

And for a stand whose schemas change more often than its image, mount them:

```bash
docker run --rm -p 8080:8080 -v "$PWD/my-project:/srv/schemas:ro" dbml-schema-visualizer-web
```

The list is rebuilt at every container start, so a swapped volume needs a restart
and nothing more. A row is named after the `Project` block if the file has one,
otherwise after the file's first `//` comment, otherwise after the file itself.
`SCHEMAS_DEFAULT=billing/invoices.dbml` picks what a first visit opens; without
it that is the first file alphabetically. Sub-folders become folders in the tree,
and only `.dbml` files are served — a README or an `.env` sitting next to the
schemas stays unreachable.

The files are read-only. Edits live in the browser and leave through the download
button; nothing is written back into the image or the volume.

**Adding a package to the monorepo means adding it to the `Dockerfile` too.** The
dependency layer lists each workspace manifest by hand so that the install layer
is cached; a package present in the repository and missing from that list makes
the build fail on an unresolvable workspace.

## Tests

```bash
yarn workspace web test
```

Unit tests, in Node with no DOM, over the pure functions: parsing DBML text,
deriving a download filename, the workspace of tabs, the editor's grammar, the
browser-locale resolver, and the catalogue — its manifest, its folder tree, and
the two functions that fetch them.

One test in that suite is not over a pure function:
`src/catalog/__tests__/schemaManifestScript.test.ts` spawns `sh` on the
container's manifest scanner against fixture folders in the temp directory. It
is the only way to test the script that ships instead of a TypeScript copy of
it, and it cannot see BusyBox — the shell and awk it runs are this machine's,
not the image's, which is why the container is also checked by hand.

```bash
yarn build:web && yarn test:e2e
```

Two browser tests, against the built output rather than the dev server. The
first is the only check in the repository capable of catching an editor that is
fetched at run time instead of bundled — with that mistake the types compile,
the unit tests pass, the container starts, and the left half of the page is
empty. The second covers the schema catalogue, supplying one with `page.route`
because the built output has none: the catalogue is the container's, not the
bundle's.

It needs a build first, and deliberately does not run one: a stale `dist` should
fail the test rather than be quietly repaired by it.
