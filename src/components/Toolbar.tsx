import { open } from "@tauri-apps/plugin-dialog";

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
}: ToolbarProps) {
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
