#!/bin/bash
set -e

CURRENT=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
read -p "Current version: $CURRENT — New version: " VERSION

if [ -z "$VERSION" ]; then
  echo "No version provided, aborting."
  exit 1
fi

sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$VERSION\"/" package.json
sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
sed -i "s/^version = \"$CURRENT\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

echo "Updated to $VERSION in package.json, tauri.conf.json, Cargo.toml"
