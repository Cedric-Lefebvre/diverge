import { useCallback } from "react";
import { useCompare } from "./hooks/useCompare";
import { useSettings } from "./hooks/useSettings";
import { useToast } from "./hooks/useToast";
import { Toolbar } from "./components/Toolbar";
import { FileTree } from "./components/FileTree";
import { DiffEditorView } from "./components/DiffEditor";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusBar } from "./components/StatusBar";
import { ToastContainer } from "./components/Toast";
import "./App.css";

function App() {
  const cmp = useCompare();
  const settings = useSettings();
  const { toasts, showToast } = useToast();

  const modifiedCount = Object.keys(cmp.modifiedContents).length;

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
        onSetLeftDir={cmp.setLeftDir}
        onSetRightDir={cmp.setRightDir}
        onCompare={cmp.compare}
        onApplyAll={handleApplyAll}
        onApplySelected={handleApplySelected}
        onSaveAll={handleSaveAll}
        onRefresh={cmp.compare}
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
          />
        )}

        <div className="editor-panel">
          {cmp.selectedEntry ? (
            <DiffEditorView
              key={cmp.selectedFile}
              entry={cmp.selectedEntry}
              modifiedContent={cmp.modifiedContents[cmp.selectedFile!]}
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
    </div>
  );
}

export default App;
