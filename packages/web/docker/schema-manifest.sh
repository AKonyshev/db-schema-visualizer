#!/bin/sh
#
# The schema catalogue's manifest, rebuilt every time the container starts.
#
# At start rather than at build, so one script serves both an image with the
# folder baked in and an image whose folder arrived as a mounted volume: swap
# the volume, restart, and the list is current. The official nginx image runs
# everything executable in /docker-entrypoint.d before starting the server,
# which is why there is no ENTRYPOINT of our own.
#
# Everything here has to survive BusyBox sh and BusyBox awk — the runtime layer
# is nginx:alpine, and gawk extensions are not there.
#
# Deliberately without `set -e`. A failure here must not stop nginx from coming
# up: no manifest means the site serves a 404 for it and behaves exactly as it
# does without a catalogue, which is a far smaller problem than a site that does
# not start at all.

SCHEMAS_DIR="${SCHEMAS_DIR:-/srv/schemas}"
SCHEMAS_MANIFEST="${SCHEMAS_MANIFEST:-/var/lib/dbml-schema-visualizer/index.json}"
SCHEMAS_DEFAULT="${SCHEMAS_DEFAULT:-}"

list_paths() {
  [ -d "$SCHEMAS_DIR" ] || return 0

  # Relative to the folder, so the manifest says `billing/invoices.dbml` and the
  # browser can ask for exactly that under /schemas/. Sorted in the C locale so
  # the order does not depend on the container's configured language.
  ( cd "$SCHEMAS_DIR" && find . -type f -name '*.dbml' ) |
    sed 's|^\./||' |
    LC_ALL=C sort
}

mkdir -p "$(dirname "$SCHEMAS_MANIFEST")" 2>/dev/null

tmp="${SCHEMAS_MANIFEST}.tmp"

# Written to a temporary file and renamed, so nginx can never serve a manifest
# that is still being written.
list_paths | awk -v root="$SCHEMAS_DIR" -v want="$SCHEMAS_DEFAULT" -v q="'" '
# JSON escaping character by character rather than through gsub: in a gsub
# replacement a backslash has a second meaning, and how many of them it takes to
# emit one differs between awk implementations. Concatenation has one meaning
# everywhere.
function esc(s,   i, c, out) {
  out = ""
  for (i = 1; i <= length(s); i++) {
    c = substr(s, i, 1)
    if (c == "\\") out = out "\\" "\\"
    else if (c == "\"") out = out "\\" "\""
    else if (c == "\t" || c == "\r") out = out " "
    else out = out c
  }
  return out
}

function base(path,   name) {
  name = path
  sub(/^.*\//, "", name)
  sub(/\.dbml$/, "", name)
  return name
}

# What a file is called, in the order the design settled on: the name from a
# DBML Project block, else the first line comment, else the file name.
#
# An empty return means the file could not be opened at all, and the caller
# drops it. That covers a path that vanished between the listing and now, and a
# file name containing a newline — which arrives here as pieces naming nothing.
function title_of(path,   line, status, title, comment, value) {
  title = ""
  comment = ""

  status = (getline line < path)
  if (status < 0) { close(path); return "" }

  while (status > 0) {
    if (title == "" && line ~ /^[ \t]*[Pp]roject[ \t]/) {
      value = line
      sub(/^[ \t]*[Pp]roject[ \t]+/, "", value)
      sub(/[ \t]*\{.*$/, "", value)
      sub(/[ \t]+$/, "", value)
      sub("^\"", "", value); sub("\"$", "", value)
      sub("^" q, "", value); sub(q "$", "", value)
      if (value != "") title = value
    }

    if (comment == "" && line ~ /^[ \t]*\/\//) {
      value = line
      sub(/^[ \t]*\/\/[ \t]*/, "", value)
      sub(/[ \t]+$/, "", value)
      if (value != "") comment = value
    }

    status = (getline line < path)
  }
  close(path)

  if (title != "") return title
  if (comment != "") return comment
  return base(path)
}

{ paths[++seen] = $0 }

END {
  kept = 0
  for (i = 1; i <= seen; i++) {
    title = title_of(root "/" paths[i])
    if (title == "") continue
    kept++
    keptPath[kept] = paths[i]
    keptTitle[kept] = title
  }

  # An override naming a file that is not in the folder is ignored: the site
  # asks for `default` on a first visit, and a name that 404s would leave a new
  # reader with an error instead of a schema.
  chosen = ""
  for (i = 1; i <= kept; i++) if (keptPath[i] == want) chosen = want
  if (chosen == "" && kept > 0) chosen = keptPath[1]

  printf "{\n"
  printf "  \"version\": 1,\n"
  if (chosen == "") printf "  \"default\": null,\n"
  else printf "  \"default\": \"%s\",\n", esc(chosen)
  printf "  \"files\": ["
  for (i = 1; i <= kept; i++) {
    printf "%s\n    { \"path\": \"%s\", \"title\": \"%s\" }",
      (i == 1 ? "" : ","), esc(keptPath[i]), esc(keptTitle[i])
  }
  printf "%s]\n}\n", (kept == 0 ? "" : "\n  ")
}
' > "$tmp" && mv "$tmp" "$SCHEMAS_MANIFEST"
