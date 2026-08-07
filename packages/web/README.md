# The site

The same schema visualizer as the VS Code extension, as a web page: a DBML
editor on the left, the diagram it describes on the right.

It is the extension's viewer, not a reimplementation of it. Both hosts mount the
same `DiagramApp` from `json-table-schema-visualizer`; the difference is only
where the schema comes from — the extension is handed messages by its extension
host, this package hands over the text in its editor.

## There is no backend

Nothing you open here leaves the browser. There is no server to talk to, no
telemetry, and no request of any kind once the page has loaded — the editor is
bundled into the page rather than fetched from a CDN, which is what makes the
site usable inside a closed network. Schemas you open, edit and download are read
and written by the page itself, and table layouts are remembered in the browser's
own storage.

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
packages by source and the build needs the whole workspace in context:

```bash
docker build -f packages/web/Dockerfile -t dbml-schema-visualizer-web .
```

```bash
docker run --rm -p 8080:8080 dbml-schema-visualizer-web
```

The site is then on <http://localhost:8080>.

The image is two stages: a Node stage that installs and builds, and an nginx
stage that serves `dist` and nothing else. [`nginx.conf`](./nginx.conf) caches
the fingerprinted assets for a year and refuses to cache the entry document, so
a deployment reaches readers without anyone having to hard-refresh. There is
deliberately no single-page fallback — the site has no routing, so a catch-all
could only turn a missing asset into a 200 serving HTML.

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
browser-locale resolver.

```bash
yarn build:web && yarn test:e2e
```

One browser test, against the built output rather than the dev server. It is the
only check in the repository capable of catching an editor that is fetched at run
time instead of bundled — with that mistake the types compile, the unit tests
pass, the container starts, and the left half of the page is empty.

It needs a build first, and deliberately does not run one: a stale `dist` should
fail the test rather than be quietly repaired by it.
