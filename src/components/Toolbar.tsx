import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { RecentComparison } from "../types";

interface ToolbarProps {
  leftDir: string;
  rightDir: string;
  cwd: string;
  onSetLeftDir: (dir: string) => void;
  onSetRightDir: (dir: string) => void;
  onCompare: () => void;
  onApplyAll: () => void;
  onApplySelected: () => void;
  onSaveAll: () => Promise<number>;
  onRefresh: () => void;
  onClear: () => void;
  loading: boolean;
  hasResult: boolean;
  hasModified: boolean;
  hasChecked: boolean;
  recentComparisons: RecentComparison[];
  onSelectRecent: (leftDir: string, rightDir: string) => void;
  onRemoveRecent: (leftDir: string, rightDir: string) => void;
}

function shortenPath(p: string): string {
  const home = p.replace(/^\/home\/[^/]+/, "~").replace(/^\/Users\/[^/]+/, "~");
  const parts = home.split("/");
  if (parts.length > 3) {
    return parts[0] + "/.../" + parts.slice(-2).join("/");
  }
  return home;
}

export function Toolbar({
  leftDir,
  rightDir,
  cwd,
  onSetLeftDir,
  onSetRightDir,
  onCompare,
  onApplyAll,
  onApplySelected,
  onSaveAll,
  onRefresh,
  onClear,
  loading,
  hasResult,
  hasModified,
  hasChecked,
  recentComparisons,
  onSelectRecent,
  onRemoveRecent,
}: ToolbarProps) {
  const [recentOpen, setRecentOpen] = useState(false);

  const pickFolder = async (side: "left" | "right") => {
    try {
      const defaultPath = (side === "left" ? leftDir : rightDir) || cwd || undefined;
      const selected = await open({
        directory: true,
        multiple: false,
        title: `Select ${side === "left" ? "Left (Source)" : "Right (Target)"} Folder`,
        defaultPath,
      });
      if (typeof selected === "string") {
        if (side === "left") onSetLeftDir(selected);
        else onSetRightDir(selected);
      }
    } catch (err) {
      console.error("Folder picker failed:", err);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="folder-picker">
          <label>Left (Source)</label>
          <div className="picker-input">
            <input
              type="text"
              value={leftDir}
              onChange={(e) => onSetLeftDir(e.target.value)}
              placeholder="Select left folder..."
              spellCheck={false}
            />
            <button className="btn-icon" onClick={() => pickFolder("left")} title="Browse...">
              📁
            </button>
          </div>
        </div>
        <div className="folder-picker">
          <label>Right (Target)</label>
          <div className="picker-input">
            <input
              type="text"
              value={rightDir}
              onChange={(e) => onSetRightDir(e.target.value)}
              placeholder="Select right folder..."
              spellCheck={false}
            />
            <button className="btn-icon" onClick={() => pickFolder("right")} title="Browse...">
              📁
            </button>
          </div>
        </div>
        <div className="toolbar-actions-primary">
          <button
            className="btn btn-primary"
            onClick={onCompare}
            disabled={!leftDir || !rightDir || loading}
          >
            {loading ? "Comparing..." : "Compare"}
          </button>
          <div className="recent-dropdown-wrapper">
            <button
              className="btn btn-ghost"
              onClick={() => recentComparisons.length > 0 && setRecentOpen(!recentOpen)}
              disabled={recentComparisons.length === 0}
              title={recentComparisons.length > 0 ? "Recent comparisons" : "No recent comparisons yet"}
            >
              ▾ Recent
            </button>
              {recentOpen && recentComparisons.length > 0 && (
                <>
                  <div className="recent-backdrop" onClick={() => setRecentOpen(false)} />
                  <div className="recent-dropdown">
                    {recentComparisons.map((r, i) => (
                      <div key={i} className="recent-item-row">
                        <button
                          className="recent-item"
                          onClick={() => {
                            onSelectRecent(r.left_dir, r.right_dir);
                            setRecentOpen(false);
                          }}
                          title={`${r.left_dir}\n↔\n${r.right_dir}`}
                        >
                          <span className="recent-left">{shortenPath(r.left_dir)}</span>
                          <span className="recent-arrow">↔</span>
                          <span className="recent-right">{shortenPath(r.right_dir)}</span>
                        </button>
                        <button
                          className="recent-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveRecent(r.left_dir, r.right_dir);
                          }}
                          title="Remove from recent"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>
          <button className="btn btn-ghost" onClick={onClear} title="Clear everything">
            Clear
          </button>
        </div>
      </div>

      {hasResult && (
        <div className="toolbar-row toolbar-actions">
          <button className="btn btn-accent" onClick={onApplyAll} title="Copy all left content to right side">
            ⟹ Apply All to Right
          </button>
          <button
            className="btn btn-secondary"
            onClick={onApplySelected}
            disabled={!hasChecked}
            title="Copy left content to right for checked files"
          >
            ⟹ Apply Selected
          </button>
          <button
            className="btn btn-success"
            onClick={onSaveAll}
            disabled={!hasModified}
            title="Save all modified files to disk"
          >
            💾 Save All
          </button>
          <button className="btn btn-ghost" onClick={onRefresh} title="Re-scan directories">
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}
