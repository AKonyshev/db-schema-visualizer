#!/usr/bin/env bash
# Publish VS Code extensions to the Marketplace (publisher: konyshevav).
#
# Usage:
#   ./scripts/publish-extension.sh dbml              # test, build, publish DBML extension
#   ./scripts/publish-extension.sh prisma            # test, build, publish Prisma extension
#   ./scripts/publish-extension.sh all               # publish both
#   ./scripts/publish-extension.sh dbml --package    # build .vsix only (no upload)
#   ./scripts/publish-extension.sh dbml --skip-tests # publish without running tests
#
# Requires VSCE_PAT (Marketplace → Manage) or run: npx @vscode/vsce login konyshevav

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISHER="${VSCE_PUBLISHER:-konyshevav}"
VSCE=(npx --yes @vscode/vsce)

PACKAGE_ONLY=false
SKIP_TESTS=false
TARGETS=()

usage() {
  sed -n '2,11p' "$0"
  exit "${1:-0}"
}

for arg in "$@"; do
  case "$arg" in
    -h | --help) usage 0 ;;
    --package | --package-only) PACKAGE_ONLY=true ;;
    --skip-tests) SKIP_TESTS=true ;;
    dbml | prisma | all) TARGETS+=("$arg") ;;
    *)
      echo "Unknown argument: $arg" >&2
      usage 1
      ;;
  esac
done

if ((${#TARGETS[@]} == 0)); then
  TARGETS=(dbml)
fi

resolve_package_dir() {
  case "$1" in
    dbml) echo "packages/dbml-vs-code-extension" ;;
    prisma) echo "packages/prisma-vs-code-extension" ;;
    *) echo "Unknown extension: $1" >&2; exit 1 ;;
  esac
}

read_version() {
  node -p "require('${1}/package.json').version"
}

publish_one() {
  local name="$1"
  local pkg_dir
  pkg_dir="$(resolve_package_dir "$name")"
  local abs_dir="$ROOT/$pkg_dir"

  if [[ ! -f "$abs_dir/package.json" ]]; then
    echo "Missing package.json: $abs_dir" >&2
    exit 1
  fi

  local version
  version="$(read_version "$abs_dir")"
  echo "==> $name v$version ($pkg_dir)"

  pushd "$abs_dir" >/dev/null

  if [[ "$SKIP_TESTS" == false ]]; then
    echo "    running tests..."
    yarn test
  else
    echo "    skipping tests"
  fi

  echo "    building..."
  yarn package

  if [[ "$PACKAGE_ONLY" == true ]]; then
    echo "    packaging .vsix..."
    "${VSCE[@]}" package --out "$ROOT/dist"
    echo "    wrote $ROOT/dist/${name}-*.vsix (see dist/)"
  else
    if [[ -z "${VSCE_PAT:-}" ]]; then
      echo "VSCE_PAT is not set. Create a PAT with Marketplace → Manage scope," >&2
      echo "or run: npx @vscode/vsce login $PUBLISHER" >&2
      exit 1
    fi
    echo "    publishing to $PUBLISHER..."
    "${VSCE[@]}" publish -p "$PUBLISHER"
    echo "    published $PUBLISHER.$(node -p "require('./package.json').name")@$version"
  fi

  popd >/dev/null
}

echo "Installing workspace dependencies..."
yarn --cwd "$ROOT" install --frozen-lockfile 2>/dev/null || yarn --cwd "$ROOT" install

mkdir -p "$ROOT/dist"

expanded=()
for t in "${TARGETS[@]}"; do
  if [[ "$t" == all ]]; then
    expanded+=(dbml prisma)
  else
    expanded+=("$t")
  fi
done

for name in "${expanded[@]}"; do
  publish_one "$name"
done

echo "Done."
