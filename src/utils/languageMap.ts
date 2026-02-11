const EXTENSION_MAP: Record<string, string> = {
  ".yaml": "yaml",
  ".yml": "yaml",
  ".json": "json",
  ".toml": "toml",
  ".md": "markdown",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".sh": "shell",
  ".bash": "shell",
  ".css": "css",
  ".scss": "scss",
  ".html": "html",
  ".xml": "xml",
  ".sql": "sql",
  ".tf": "hcl",
  ".hcl": "hcl",
  ".dockerfile": "dockerfile",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
};

const FILENAME_MAP: Record<string, string> = {
  Dockerfile: "dockerfile",
  Makefile: "makefile",
  Jenkinsfile: "groovy",
};

export function getLanguageForFile(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? "";

  if (FILENAME_MAP[fileName]) return FILENAME_MAP[fileName];

  const dotIdx = fileName.lastIndexOf(".");
  if (dotIdx !== -1) {
    const ext = fileName.slice(dotIdx).toLowerCase();
    if (EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];
  }

  return "plaintext";
}
