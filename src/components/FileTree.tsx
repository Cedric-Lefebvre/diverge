import { useMemo, useState } from "react";
import type { CompareEntry, EffectiveStatus } from "../types";
import { STATUS_STYLES } from "../constants/statusConfig";
import { getFolderForPath, getFileName } from "../utils/pathUtils";

interface FileTreeProps {
  entries: CompareEntry[];
  selectedFile: string | null;
  checkedFiles: Set<string>;
  collapsedFolders: Set<string>;
  ignoreDirs: string[];
  getEffectiveStatus: (entry: CompareEntry) => EffectiveStatus;
  onSelect: (relPath: string) => void;
  onToggleChecked: (relPath: string) => void;
  onToggleFolderChecked: (folder: string) => void;
  onToggleFolder: (folder: string) => void;
  onToggleAllFolders: () => void;
  onCheckAllDifferent: () => void;
  onUncheckAll: () => void;
}

export function FileTree({
  entries,
  selectedFile,
  checkedFiles,
  collapsedFolders,
  ignoreDirs,
  getEffectiveStatus,
  onSelect,
  onToggleChecked,
  onToggleFolderChecked,
  onToggleFolder,
  onToggleAllFolders,
  onCheckAllDifferent,
  onUncheckAll,
}: FileTreeProps) {
  const [ignoredCollapsed, setIgnoredCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter((e) => e.rel_path.toLowerCase().includes(q));
  }, [entries, searchQuery]);

  const { grouped, folderKeys } = useMemo(() => {
    const map = new Map<string, CompareEntry[]>();
    for (const entry of filteredEntries) {
      const dir = getFolderForPath(entry.rel_path);
      if (!map.has(dir)) map.set(dir, []);
      map.get(dir)!.push(entry);
    }
    return { grouped: map, folderKeys: [...map.keys()].sort() };
  }, [filteredEntries]);

  const getFolderCheckState = (folder: string): "all" | "some" | "none" => {
    const files = grouped.get(folder) ?? [];
    const checkedCount = files.filter((f) =>
      checkedFiles.has(f.rel_path)
    ).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === files.length) return "all";
    return "some";
  };

  const getFolderStatus = (folder: string): EffectiveStatus => {
    const files = grouped.get(folder) ?? [];
    const statuses = files.map(getEffectiveStatus);
    if (statuses.every((s) => s === "identical" || s === "applied"))
      return "identical";
    if (statuses.some((s) => s === "only_left" || s === "only_right"))
      return "only_left";
    if (statuses.some((s) => s === "different")) return "different";
    return "applied";
  };

  const allCollapsed =
    folderKeys.length > 0 && collapsedFolders.size === folderKeys.length;

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span className="file-tree-title">Files</span>
        <div className="file-tree-actions">
          <button
            className="btn-tiny"
            onClick={onToggleAllFolders}
            title={allCollapsed ? "Expand all" : "Collapse all"}
          >
            {allCollapsed ? "▶" : "▼"}
          </button>
          <button
            className="btn-tiny"
            onClick={onCheckAllDifferent}
            title="Check all different"
          >
            ☑
          </button>
          <button
            className="btn-tiny"
            onClick={onUncheckAll}
            title="Uncheck all"
          >
            ☐
          </button>
        </div>
      </div>

      <div className="file-tree-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter files..."
          spellCheck={false}
        />
        {searchQuery && (
          <button
            className="file-tree-search-clear"
            onClick={() => setSearchQuery("")}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>

      <div className="file-tree-list">
        {folderKeys.map((dir) => {
          const files = grouped.get(dir)!;
          const isCollapsed = collapsedFolders.has(dir);
          const folderCheck = getFolderCheckState(dir);
          const folderStyle = STATUS_STYLES[getFolderStatus(dir)];

          return (
            <div key={dir} className="file-tree-group">
              <div
                className="file-tree-folder"
                onClick={() => onToggleFolder(dir)}
              >
                <span className="folder-chevron">
                  {isCollapsed ? "▶" : "▼"}
                </span>
                <input
                  type="checkbox"
                  className="file-tree-check"
                  checked={folderCheck === "all"}
                  ref={(el) => {
                    if (el) el.indeterminate = folderCheck === "some";
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleFolderChecked(dir);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className="folder-status-icon"
                  style={{ color: folderStyle.color }}
                >
                  {folderStyle.icon}
                </span>
                <span className="folder-name">
                  {dir === "." ? "(root)" : dir + "/"}
                </span>
                <span className="folder-count">{files.length}</span>
              </div>

              {!isCollapsed &&
                files.map((entry) => {
                  const effStatus = getEffectiveStatus(entry);
                  const style = STATUS_STYLES[effStatus];
                  const isSelected = entry.rel_path === selectedFile;

                  return (
                    <div
                      key={entry.rel_path}
                      className={`file-tree-item ${isSelected ? "selected" : ""}`}
                      onClick={() => onSelect(entry.rel_path)}
                    >
                      <input
                        type="checkbox"
                        className="file-tree-check"
                        checked={checkedFiles.has(entry.rel_path)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleChecked(entry.rel_path);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className="file-status-icon"
                        style={{ color: style.color }}
                        title={style.label}
                      >
                        {style.icon}
                      </span>
                      <span className="file-name" title={entry.rel_path}>
                        {getFileName(entry.rel_path)}
                      </span>
                      {effStatus === "applied" && (
                        <span
                          className="file-applied-badge"
                          title="Applied — save to write to disk"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {searchQuery && folderKeys.length === 0 && (
          <div className="file-tree-no-results">No files match "{searchQuery}"</div>
        )}

        {ignoreDirs.length > 0 && (
          <div className="ignored-section">
            <div
              className="ignored-header"
              onClick={() => setIgnoredCollapsed(!ignoredCollapsed)}
            >
              <span className="folder-chevron">
                {ignoredCollapsed ? "▶" : "▼"}
              </span>
              <span className="ignored-title">Ignored</span>
              <span className="folder-count">{ignoreDirs.length}</span>
            </div>
            {!ignoredCollapsed &&
              ignoreDirs.map((dir) => (
                <div key={dir} className="ignored-item">
                  {dir}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
