# Built from the repository root, not from this directory:
#   docker build -f packages/web/Dockerfile -t dbml-schema-visualizer-web .
# The site is one package of a yarn workspace and depends on four of its
# siblings by source, so the build needs the whole monorepo in context.

FROM node:22-alpine AS build
WORKDIR /repo

# Manifests first, and only manifests: this layer is what `yarn install` reads,
# so it is rebuilt only when a dependency changes rather than on every edit to a
# source file.
#
# Each workspace is listed by hand because `COPY packages/*/package.json` would
# flatten them all into one directory and lose which package each belonged to.
#
# ADDING A PACKAGE TO THE MONOREPO MEANS ADDING IT HERE. Yarn resolves
# `workspaces: ["packages/*"]` against what is on disk, so a package present in
# the repository and missing from this list makes the install fail with an
# unresolvable workspace dependency — loudly, which is the intent. A package
# missing from BOTH is worse and is what this comment exists to prevent.
COPY package.json yarn.lock ./
COPY packages/db-to-dbml/package.json packages/db-to-dbml/
COPY packages/dbml-to-json-table-schema/package.json packages/dbml-to-json-table-schema/
COPY packages/dbml-vs-code-extension/package.json packages/dbml-vs-code-extension/
COPY packages/extension-shared/package.json packages/extension-shared/
COPY packages/json-table-schema-visualizer/package.json packages/json-table-schema-visualizer/
COPY packages/schema-diff/package.json packages/schema-diff/
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/

# `--frozen-lockfile` so the image cannot quietly build against versions the
# lockfile does not name. The package registry is the only network this stage
# needs; nothing is fetched at run time, which is the whole point of the site.
RUN yarn install --frozen-lockfile

COPY . .

# The bundle is about 14 MB, most of it the editor, and rolling it up needs more
# heap than Node allows itself by default inside a container — the build dies
# with "Reached heap limit" and a SIGABRT that says nothing about memory unless
# you read the whole log. Raised here rather than in the package's own build
# script, because on a developer's machine the default is already ample and this
# is a property of the container, not of the project.
#
# The container itself must be able to give it: a Docker daemon capped below
# ~2 GB will kill the build instead, which reads as an unexplained exit 137.
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN yarn workspace web build

FROM nginx:alpine AS serve

COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/packages/web/dist /usr/share/nginx/html

# Above 1024 so the server needs no privileged port and the image can run as a
# non-root user where the operator's platform asks for one.
EXPOSE 8080
