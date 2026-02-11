import { useCallback, useEffect, useRef, useState } from "react";
import { useCompare } from "./hooks/useCompare";
import { useSettings } from "./hooks/useSettings";
import { useToast } from "./hooks/useToast";
import { Toolbar } from "./components/Toolbar";
import { FileTree } from "./components/FileTree";
import { DiffEditorView } from "./components/DiffEditor";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusBar } from "./components/StatusBar";
import { ToastContainer } from "./components/Toast";
import { ConfirmDialog } from "./components/ConfirmDialog";
import "./App.css";

function App() {
  const cmp = useCompare();
  const settings = useSettings();
  const { toasts, showToast } = useToast();

  const modifiedCount = Object.keys(cmp.modifiedContents).length;
  const [confirm, setConfirm] = useState<"applyAll" | "saveAll" | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(
    settings.config?.editor_preferences.sidebar_width ?? 280
  );
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (!draggingRef.current && settings.config) {
      setSidebarWidth(settings.config.editor_preferences.sidebar_width ?? 280);
    }
  }, [settings.config]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sidebarWidth]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 180), 600);
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      settings.updateEditorPref({ sidebar_width: Math.round(sidebarWidth) });
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [settings, sidebarWidth]);

  const handleSaveAll = useCallback(async () => {
    try {
      const count = await cmp.saveAll();
      showToast(`Saved ${count} file${count !== 1 ? "s" : ""} to disk`);
      return count;
    } catch {
      showToast("Save failed", "error");
      return 0;
    }
  }, [cmp, showToast]);

  const handleSaveFile = useCallback(
    async (relPath: string) => {
      try {
        await cmp.saveFile(relPath);
        showToast(`Saved ${relPath.split("/").pop()}`);
      } catch {
        showToast(`Failed to save ${relPath}`, "error");
      }
    },
    [cmp, showToast]
  );

  const handleApplyAll = useCallback(() => {
    cmp.applyAllToRight();
    showToast("Applied all differences to right side");
  }, [cmp, showToast]);

  const handleApplySelected = useCallback(() => {
    const count = cmp.checkedFiles.size;
    cmp.applySelectedToRight();
    showToast(`Applied ${count} selected file${count !== 1 ? "s" : ""}`);
  }, [cmp, showToast]);

  const handleRefresh = useCallback(async () => {
    try {
      await cmp.compare();
      showToast("Directories re-scanned");
    } catch {
      showToast("Refresh failed", "error");
    }
  }, [cmp, showToast]);

  const handleSaveSettings = useCallback(async () => {
    try {
      await settings.save();
      showToast("Settings saved");
    } catch {
      showToast("Failed to save settings", "error");
    }
  }, [settings, showToast]);

  return (
    <div className="app">
      <Toolbar
        leftDir={cmp.leftDir}
        rightDir={cmp.rightDir}
        cwd={cmp.cwd}
        onSetLeftDir={cmp.setLeftDir}
        onSetRightDir={cmp.setRightDir}
        onCompare={cmp.compare}
        onApplyAll={() => setConfirm("applyAll")}
        onApplySelected={handleApplySelected}
        onSaveAll={() => { setConfirm("saveAll"); return Promise.resolve(0); }}
        onRefresh={handleRefresh}
        onClear={cmp.clear}
        loading={cmp.loading}
        hasResult={!!cmp.result}
        hasModified={modifiedCount > 0}
        hasChecked={cmp.checkedFiles.size > 0}
      />

      <SettingsPanel
        config={settings.config}
        dirty={settings.dirty}
        saving={settings.saving}
        onAdd={settings.addIgnoreDir}
        onRemove={settings.removeIgnoreDir}
        onEdit={settings.editIgnoreDir}
        onSave={handleSaveSettings}
      />

      {cmp.error && <div className="error-banner">{cmp.error}</div>}

      <div className="main-content">
        {cmp.result && (
          <>
            <FileTree
              entries={cmp.result.entries}
              selectedFile={cmp.selectedFile}
              checkedFiles={cmp.checkedFiles}
              collapsedFolders={cmp.collapsedFolders}
              ignoreDirs={cmp.result?.ignored_dirs ?? []}
              getEffectiveStatus={cmp.getEffectiveStatus}
              onSelect={cmp.selectFile}
              onToggleChecked={cmp.toggleChecked}
              onToggleFolderChecked={cmp.toggleFolderChecked}
              onToggleFolder={cmp.toggleFolder}
              onToggleAllFolders={cmp.toggleAllFolders}
              onCheckAllDifferent={cmp.checkAllDifferent}
              onUncheckAll={cmp.uncheckAll}
              width={sidebarWidth}
            />
            <div
              className="resize-handle"
              onMouseDown={onResizeStart}
            />
          </>
        )}

        <div className="editor-panel">
          {cmp.selectedEntry ? (
            <DiffEditorView
              key={cmp.selectedFile}
              entry={cmp.selectedEntry}
              modifiedContent={cmp.modifiedContents[cmp.selectedFile!]}
              minimapEnabled={settings.config?.editor_preferences.minimap_enabled ?? false}
              showFullContent={settings.config?.editor_preferences.show_full_content ?? true}
              onEditorPrefChange={settings.updateEditorPref}
              onContentChange={(content) =>
                cmp.updateModifiedContent(cmp.selectedFile!, content)
              }
              onApplyLeftToRight={() => {
                cmp.applyLeftToRight(cmp.selectedFile!);
                showToast("Applied left to right");
              }}
              onSaveFile={() => handleSaveFile(cmp.selectedFile!)}
            />
          ) : (
            <div className="editor-placeholder">
              {cmp.result ? (
                <>
                  <div className="placeholder-icon">⇄</div>
                  <div className="placeholder-text">Select a file to view differences</div>
                </>
              ) : (
                <>
                  <div className="placeholder-icon">📁</div>
                  <div className="placeholder-text">
                    Select two folders and click Compare to begin
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <StatusBar
        result={cmp.result}
        selectedFile={cmp.selectedFile}
        modifiedCount={modifiedCount}
      />

      <ToastContainer toasts={toasts} />

      {confirm === "applyAll" && (
        <ConfirmDialog
          title="Apply All to Right"
          message="This will overwrite the right side of all different files with the left side content. This cannot be undone."
          confirmLabel="Apply All"
          confirmVariant="accent"
          onConfirm={() => { setConfirm(null); handleApplyAll(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "saveAll" && (
        <ConfirmDialog
          title="Save All Modified Files"
          message={`This will write ${modifiedCount} modified file${modifiedCount !== 1 ? "s" : ""} to disk, overwriting the existing files. This cannot be undone.`}
          confirmLabel="Save All"
          confirmVariant="accent"
          onConfirm={() => { setConfirm(null); handleSaveAll(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export default App;
