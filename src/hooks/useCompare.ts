import { useCallback } from "react";
import { useDirectories } from "./useDirectories";
import { useFileTree } from "./useFileTree";
import { useModifications } from "./useModifications";

export function useCompare() {
  const dirs = useDirectories();
  const tree = useFileTree(dirs.result);
  const mods = useModifications(dirs.result, dirs.rightDir, dirs.setResult);

  const compare = useCallback(async () => {
    await dirs.compare();
    tree.reset();
    mods.reset();
  }, [dirs, tree, mods]);

  const clear = useCallback(() => {
    dirs.clear();
    tree.reset();
    mods.reset();
  }, [dirs, tree, mods]);

  const applySelectedToRight = useCallback(() => {
    mods.applySelectedToRight(tree.checkedFiles);
  }, [mods, tree.checkedFiles]);

  const saveAll = useCallback(() => {
    return mods.saveAll(dirs.leftDir);
  }, [mods, dirs.leftDir]);

  return {
    // Directories
    leftDir: dirs.leftDir,
    rightDir: dirs.rightDir,
    setLeftDir: dirs.setLeftDir,
    setRightDir: dirs.setRightDir,
    result: dirs.result,
    loading: dirs.loading,
    error: dirs.error,

    // File tree
    selectedFile: tree.selectedFile,
    selectedEntry: tree.selectedEntry,
    checkedFiles: tree.checkedFiles,
    collapsedFolders: tree.collapsedFolders,
    folders: tree.folders,
    selectFile: tree.selectFile,
    toggleChecked: tree.toggleChecked,
    toggleFolderChecked: tree.toggleFolderChecked,
    checkAllDifferent: tree.checkAllDifferent,
    uncheckAll: tree.uncheckAll,
    toggleFolder: tree.toggleFolder,
    toggleAllFolders: tree.toggleAllFolders,

    // Modifications
    modifiedContents: mods.modifiedContents,
    getEffectiveStatus: mods.getEffectiveStatus,
    updateModifiedContent: mods.updateModifiedContent,
    applyLeftToRight: mods.applyLeftToRight,
    applyAllToRight: mods.applyAllToRight,
    applySelectedToRight,
    saveFile: mods.saveFile,
    saveAll,

    // Top-level actions
    compare,
    clear,
  };
}
