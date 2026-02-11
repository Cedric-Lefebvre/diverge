import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

interface ToolbarProps {
  leftDir: string;
  rightDir: string;
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
}

export function Toolbar({
  leftDir,
  rightDir,
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
}: ToolbarProps) {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const pickFolder = async (side: "left" | "right") => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: `Select ${side === "left" ? "Left (Source)" : "Right (Target)"} Folder`,
      });
      if (typeof selected === "string") {
        if (side === "left") onSetLeftDir(selected);
        else onSetRightDir(selected);
      }
    } catch (err) {
      console.error("Folder picker failed:", err);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus("saving");
      const count = await onSaveAll();
      setSaveStatus(`Saved ${count} file${count !== 1 ? "s" : ""}`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(null), 3000);
      console.error("Save failed:", err);
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
            onClick={handleSave}
            disabled={!hasModified || saveStatus === "saving"}
            title="Save all modified files to disk"
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus ?? "💾 Save All"}
          </button>
          <button className="btn btn-ghost" onClick={onRefresh} title="Re-scan directories">
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}
