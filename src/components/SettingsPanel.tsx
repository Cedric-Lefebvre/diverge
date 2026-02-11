import { useState, useRef, useEffect } from "react";
import type { AppConfig } from "../types";

interface SettingsPanelProps {
  config: AppConfig | null;
  dirty: boolean;
  saving: boolean;
  onAdd: (dir: string) => void;
  onRemove: (dir: string) => void;
  onEdit: (oldDir: string, newDir: string) => void;
  onSave: () => void;
}

export function SettingsPanel({
  config,
  dirty,
  saving,
  onAdd,
  onRemove,
  onEdit,
  onSave,
}: SettingsPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [newDir, setNewDir] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);

  if (!config) return null;

  const handleAdd = () => {
    if (!newDir.trim()) return;
    onAdd(newDir);
    setNewDir("");
  };

  const startEdit = (dir: string) => {
    setEditing(dir);
    setEditValue(dir);
  };

  const confirmEdit = () => {
    if (editing) onEdit(editing, editValue);
    setEditing(null);
  };

  return (
    <div className="settings-panel">
      <div className="settings-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="settings-chevron">{collapsed ? "▶" : "▼"}</span>
        <span className="settings-title">Ignored Directories</span>
        <span className="settings-count">{config.ignore_dirs.length}</span>
        {dirty && <span className="settings-dirty">unsaved</span>}
      </div>

      {!collapsed && (
        <div className="settings-body">
          <div className="settings-add-row">
            <input
              type="text"
              value={newDir}
              onChange={(e) => setNewDir(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add directory..."
              className="settings-add-input"
            />
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleAdd}
              disabled={!newDir.trim()}
            >
              Add
            </button>
          </div>

          <div className="settings-list">
            {config.ignore_dirs.map((dir) => (
              <div key={dir} className="settings-item">
                {editing === dir ? (
                  <input
                    ref={editRef}
                    className="settings-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    onBlur={confirmEdit}
                  />
                ) : (
                  <span
                    className="settings-item-label"
                    onDoubleClick={() => startEdit(dir)}
                    title="Double-click to edit"
                  >
                    {dir}
                  </span>
                )}
                <button
                  className="settings-item-remove"
                  onClick={() => onRemove(dir)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="settings-footer">
            <button
              className="btn btn-sm btn-primary"
              onClick={onSave}
              disabled={!dirty || saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
