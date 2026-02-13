import { useCallback, useRef } from "react";
import { useDirectories } from "./useDirectories";
import { useFileTree } from "./useFileTree";
import { useModifications } from "./useModifications";

export function useCompare() {
  const dirs = useDirectories();
  const tree = useFileTree(dirs.result);
  const mods = useModifications(dirs.result, dirs.rightDir, dirs.setResult);

  const dirsRef = useRef(dirs);
  dirsRef.current = dirs;
  const treeRef = useRef(tree);
  treeRef.current = tree;
  const modsRef = useRef(mods);
  modsRef.current = mods;

  const compare = useCallback(async () => {
    await dirsRef.current.compare();
    treeRef.current.reset();
    modsRef.current.reset();
  }, []);

  const compareWith = useCallback(async (left: string, right: string) => {
    await dirsRef.current.compareWith(left, right);
    treeRef.current.reset();
    modsRef.current.reset();
  }, []);

  const clear = useCallback(() => {
    dirsRef.current.clear();
    treeRef.current.reset();
    modsRef.current.reset();
  }, []);

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
    cwd: dirs.cwd,

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
    compareWith,
    clear,
  };
}
