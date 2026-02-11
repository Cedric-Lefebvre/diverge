interface FileIcon {
  label: string;
  color: string;
}

const EXTENSION_ICONS: Record<string, FileIcon> = {
  ".rs": { label: "RS", color: "#dea584" },
  ".ts": { label: "TS", color: "#3178c6" },
  ".tsx": { label: "TX", color: "#3178c6" },
  ".js": { label: "JS", color: "#f1e05a" },
  ".jsx": { label: "JX", color: "#f1e05a" },
  ".py": { label: "PY", color: "#3572a5" },
  ".rb": { label: "RB", color: "#cc342d" },
  ".go": { label: "GO", color: "#00add8" },
  ".java": { label: "JV", color: "#b07219" },
  ".kt": { label: "KT", color: "#a97bff" },
  ".swift": { label: "SW", color: "#f05138" },
  ".c": { label: "C", color: "#555555" },
  ".cpp": { label: "C+", color: "#f34b7d" },
  ".h": { label: "H", color: "#555555" },
  ".hpp": { label: "H+", color: "#f34b7d" },
  ".cs": { label: "C#", color: "#178600" },
  ".php": { label: "PHP", color: "#4f5d95" },
  ".yaml": { label: "YML", color: "#cb171e" },
  ".yml": { label: "YML", color: "#cb171e" },
  ".json": { label: "{}", color: "#e5c07b" },
  ".toml": { label: "TML", color: "#9c4221" },
  ".xml": { label: "XML", color: "#e44d26" },
  ".html": { label: "HTM", color: "#e44d26" },
  ".css": { label: "CSS", color: "#563d7c" },
  ".scss": { label: "SCS", color: "#c6538c" },
  ".less": { label: "LES", color: "#1d365d" },
  ".md": { label: "MD", color: "#083fa1" },
  ".sql": { label: "SQL", color: "#e38c00" },
  ".sh": { label: "SH", color: "#89e051" },
  ".bash": { label: "SH", color: "#89e051" },
  ".zsh": { label: "SH", color: "#89e051" },
  ".tf": { label: "TF", color: "#7b42bc" },
  ".hcl": { label: "HCL", color: "#7b42bc" },
  ".lua": { label: "LUA", color: "#000080" },
  ".r": { label: "R", color: "#198ce7" },
  ".vue": { label: "VUE", color: "#41b883" },
  ".svelte": { label: "SVL", color: "#ff3e00" },
  ".lock": { label: "LCK", color: "#6a6a6a" },
  ".env": { label: "ENV", color: "#e5c07b" },
  ".ini": { label: "INI", color: "#6a6a6a" },
  ".cfg": { label: "CFG", color: "#6a6a6a" },
  ".txt": { label: "TXT", color: "#6a6a6a" },
  ".log": { label: "LOG", color: "#6a6a6a" },
  ".svg": { label: "SVG", color: "#ffb13b" },
  ".png": { label: "IMG", color: "#a074c4" },
  ".jpg": { label: "IMG", color: "#a074c4" },
  ".jpeg": { label: "IMG", color: "#a074c4" },
  ".gif": { label: "IMG", color: "#a074c4" },
  ".wasm": { label: "WAS", color: "#654ff0" },
};

const FILENAME_ICONS: Record<string, FileIcon> = {
  Dockerfile: { label: "DCK", color: "#384d54" },
  Makefile: { label: "MK", color: "#427819" },
  Jenkinsfile: { label: "JNK", color: "#d33833" },
  "Cargo.toml": { label: "CRG", color: "#dea584" },
  "package.json": { label: "NPM", color: "#cb3837" },
  "tsconfig.json": { label: "TSC", color: "#3178c6" },
  ".gitignore": { label: "GIT", color: "#f05032" },
  ".dockerignore": { label: "DCK", color: "#384d54" },
  LICENSE: { label: "LIC", color: "#6a6a6a" },
};

const DEFAULT_ICON: FileIcon = { label: "···", color: "#6a6a6a" };

export function getFileIcon(filePath: string): FileIcon {
  const fileName = filePath.split("/").pop() ?? "";

  if (FILENAME_ICONS[fileName]) return FILENAME_ICONS[fileName];

  const dotIdx = fileName.lastIndexOf(".");
  if (dotIdx !== -1) {
    const ext = fileName.slice(dotIdx).toLowerCase();
    if (EXTENSION_ICONS[ext]) return EXTENSION_ICONS[ext];
  }

  return DEFAULT_ICON;
}
