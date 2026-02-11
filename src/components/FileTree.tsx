import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import type { CompareEntry, EffectiveStatus } from "../types";
import { STATUS_STYLES } from "../constants/statusConfig";
import { getFolderForPath, getFileName } from "../utils/pathUtils";
import { getFileIcon } from "../utils/fileIcons";

type StatusFilter = "different" | "only_left" | "only_right" | "identical";
const ALL_STATUSES: StatusFilter[] = ["different", "only_left", "only_right", "identical"];

const FILTER_LABELS: Record<StatusFilter, { icon: string; label: string; color: string }> = {
  different: { icon: "≠", label: "Different", color: "#e5c07b" },
  only_left: { icon: "←", label: "Only left", color: "#e06c75" },
  only_right: { icon: "→", label: "Only right", color: "#c678dd" },
  identical: { icon: "✓", label: "Identical", color: "#4ec9b0" },
};

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
  width: number;
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
  width,
}: FileTreeProps) {
  const [ignoredCollapsed, setIgnoredCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<StatusFilter>>(
    new Set(ALL_STATUSES)
  );
  const treeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleStatus = (status: StatusFilter) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const statusMatchesFilter = (entry: CompareEntry): boolean => {
    const eff = getEffectiveStatus(entry);
    if (eff === "applied") return activeStatuses.has("different");
    return activeStatuses.has(eff as StatusFilter);
  };

  const filteredEntries = useMemo(() => {
    let result = entries.filter(statusMatchesFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.rel_path.toLowerCase().includes(q));
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, searchQuery, activeStatuses, getEffectiveStatus]);

  const { grouped, folderKeys } = useMemo(() => {
    const map = new Map<string, CompareEntry[]>();
    for (const entry of filteredEntries) {
      const dir = getFolderForPath(entry.rel_path);
      if (!map.has(dir)) map.set(dir, []);
      map.get(dir)!.push(entry);
    }
    return { grouped: map, folderKeys: [...map.keys()].sort() };
  }, [filteredEntries]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { different: 0, only_left: 0, only_right: 0, identical: 0 };
    for (const entry of entries) {
      const eff = getEffectiveStatus(entry);
      if (eff === "applied") counts.different++;
      else if (eff in counts) counts[eff as StatusFilter]++;
    }
    return counts;
  }, [entries, getEffectiveStatus]);

  const visiblePaths = useMemo(() => {
    const paths: string[] = [];
    for (const dir of folderKeys) {
      if (collapsedFolders.has(dir)) continue;
      for (const entry of grouped.get(dir)!) {
        paths.push(entry.rel_path);
      }
    }
    return paths;
  }, [folderKeys, grouped, collapsedFolders]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "/" || (e.key === "f" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (visiblePaths.length === 0) return;
      const currentIdx = selectedFile ? visiblePaths.indexOf(selectedFile) : -1;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = currentIdx < visiblePaths.length - 1 ? currentIdx + 1 : 0;
        onSelect(visiblePaths[next]);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = currentIdx > 0 ? currentIdx - 1 : visiblePaths.length - 1;
        onSelect(visiblePaths[prev]);
      } else if (e.key === " " && selectedFile) {
        e.preventDefault();
        onToggleChecked(selectedFile);
      }
    },
    [visiblePaths, selectedFile, onSelect, onToggleChecked]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
    <div className="file-tree" ref={treeRef} style={{ width }}>
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
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearchQuery("");
              (e.target as HTMLElement).blur();
            }
          }}
          placeholder="Filter files... ( / )"
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

      <div className="status-filters">
        {ALL_STATUSES.map((status) => {
          const f = FILTER_LABELS[status];
          const active = activeStatuses.has(status);
          const count = statusCounts[status];
          return (
            <button
              key={status}
              className={`status-filter-btn ${active ? "active" : ""}`}
              onClick={() => toggleStatus(status)}
              title={`${active ? "Hide" : "Show"} ${f.label}`}
              style={{
                borderColor: active ? f.color : undefined,
                color: active ? f.color : undefined,
              }}
            >
              <span>{f.icon}</span>
              <span>{count}</span>
            </button>
          );
        })}
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
                      {(() => {
                        const icon = getFileIcon(entry.rel_path);
                        return (
                          <span
                            className="file-type-badge"
                            style={{ color: icon.color }}
                            title={icon.label}
                          >
                            {icon.label}
                          </span>
                        );
                      })()}
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

        {filteredEntries.length === 0 && (
          <div className="file-tree-no-results">
            {searchQuery ? `No files match "${searchQuery}"` : "No files match current filters"}
          </div>
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
