export function getFolderForPath(relPath: string): string {
  const lastSlash = relPath.lastIndexOf("/");
  return lastSlash === -1 ? "." : relPath.slice(0, lastSlash);
}

export function getFileName(relPath: string): string {
  const lastSlash = relPath.lastIndexOf("/");
  return lastSlash === -1 ? relPath : relPath.slice(lastSlash + 1);
}
