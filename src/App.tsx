import { useCompare } from "./hooks/useCompare";
import { Toolbar } from "./components/Toolbar";
import { FileTree } from "./components/FileTree";
import { DiffEditorView } from "./components/DiffEditor";
import { StatusBar } from "./components/StatusBar";
import "./App.css";

function App() {
  const cmp = useCompare();

  const modifiedCount = Object.keys(cmp.modifiedContents).length;

  return (
    <div className="app">
      <Toolbar
        leftDir={cmp.leftDir}
        rightDir={cmp.rightDir}
        onSetLeftDir={cmp.setLeftDir}
        onSetRightDir={cmp.setRightDir}
        onCompare={cmp.compare}
        onApplyAll={cmp.applyAllToRight}
        onApplySelected={cmp.applySelectedToRight}
        onSaveAll={cmp.saveAll}
        onRefresh={cmp.compare}
        onClear={cmp.clear}
        loading={cmp.loading}
        hasResult={!!cmp.result}
        hasModified={modifiedCount > 0}
        hasChecked={cmp.checkedFiles.size > 0}
      />

      {cmp.error && <div className="error-banner">{cmp.error}</div>}

      <div className="main-content">
        {cmp.result && (
          <FileTree
            entries={cmp.result.entries}
            selectedFile={cmp.selectedFile}
            checkedFiles={cmp.checkedFiles}
            collapsedFolders={cmp.collapsedFolders}
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
              onApplyLeftToRight={() => cmp.applyLeftToRight(cmp.selectedFile!)}
              onSaveFile={() => cmp.saveFile(cmp.selectedFile!)}
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
    </div>
  );
}

export default App;
