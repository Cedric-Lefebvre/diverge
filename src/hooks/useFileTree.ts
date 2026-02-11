import { useState, useCallback, useMemo } from "react";
import type { CompareResult } from "../types";
import { getFolderForPath } from "../utils/pathUtils";

export function useFileTree(result: CompareResult | null) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set()
  );

  const folders = useMemo(() => {
    if (!result) return [];
    const set = new Set<string>();
    for (const e of result.entries) set.add(getFolderForPath(e.rel_path));
    return [...set].sort();
  }, [result]);

  const selectedEntry = useMemo(
    () => result?.entries.find((e) => e.rel_path === selectedFile) ?? null,
    [result, selectedFile]
  );

  const selectFile = useCallback((relPath: string | null) => {
    setSelectedFile(relPath);
  }, []);

  const toggleChecked = useCallback((relPath: string) => {
    setCheckedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(relPath)) next.delete(relPath);
      else next.add(relPath);
      return next;
    });
  }, []);

  const toggleFolderChecked = useCallback(
    (folder: string) => {
      if (!result) return;
      const filesInFolder = result.entries
        .filter((e) => getFolderForPath(e.rel_path) === folder)
        .map((e) => e.rel_path);

      setCheckedFiles((prev) => {
        const next = new Set(prev);
        const allChecked = filesInFolder.every((f) => next.has(f));
        for (const f of filesInFolder) {
          if (allChecked) next.delete(f);
          else next.add(f);
        }
        return next;
      });
    },
    [result]
  );

  const checkAllDifferent = useCallback(() => {
    if (!result) return;
    const diffs = result.entries
      .filter((e) => e.status === "different")
      .map((e) => e.rel_path);
    setCheckedFiles(new Set(diffs));
  }, [result]);

  const uncheckAll = useCallback(() => {
    setCheckedFiles(new Set());
  }, []);

  const toggleFolder = useCallback((folder: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }, []);

  const toggleAllFolders = useCallback(() => {
    setCollapsedFolders((prev) =>
      prev.size === folders.length ? new Set() : new Set(folders)
    );
  }, [folders]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setCheckedFiles(new Set());
    setCollapsedFolders(new Set());
  }, []);

  return {
    selectedFile,
    selectedEntry,
    checkedFiles,
    collapsedFolders,
    folders,
    selectFile,
    toggleChecked,
    toggleFolderChecked,
    checkAllDifferent,
    uncheckAll,
    toggleFolder,
    toggleAllFolders,
    reset,
  };
}
