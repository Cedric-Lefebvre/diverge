import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CompareEntry, CompareResult, EffectiveStatus } from "../types";

export function useModifications(
  result: CompareResult | null,
  rightDir: string,
  refreshResult: (res: CompareResult) => void
) {
  const [modifiedContents, setModifiedContents] = useState<
    Record<string, string>
  >({});

  const getEffectiveStatus = useCallback(
    (entry: CompareEntry): EffectiveStatus => {
      const mod = modifiedContents[entry.rel_path];
      if (mod !== undefined) {
        return mod === entry.left_content ? "applied" : "different";
      }
      return entry.status;
    },
    [modifiedContents]
  );

  const updateModifiedContent = useCallback(
    (relPath: string, content: string) => {
      setModifiedContents((prev) => ({ ...prev, [relPath]: content }));
    },
    []
  );

  const applyLeftToRight = useCallback(
    (relPath: string) => {
      const entry = result?.entries.find((e) => e.rel_path === relPath);
      if (entry) {
        setModifiedContents((prev) => ({
          ...prev,
          [relPath]: entry.left_content,
        }));
      }
    },
    [result]
  );

  const applyAllToRight = useCallback(() => {
    if (!result) return;
    const updates: Record<string, string> = {};
    for (const entry of result.entries) {
      if (entry.status === "different") {
        updates[entry.rel_path] = entry.left_content;
      }
    }
    setModifiedContents((prev) => ({ ...prev, ...updates }));
  }, [result]);

  const applySelectedToRight = useCallback(
    (checkedFiles: Set<string>) => {
      if (!result) return;
      const updates: Record<string, string> = {};
      for (const entry of result.entries) {
        if (checkedFiles.has(entry.rel_path) && entry.status === "different") {
          updates[entry.rel_path] = entry.left_content;
        }
      }
      setModifiedContents((prev) => ({ ...prev, ...updates }));
    },
    [result]
  );

  const saveFile = useCallback(
    async (relPath: string) => {
      const entry = result?.entries.find((e) => e.rel_path === relPath);
      if (!entry) return;
      const content = modifiedContents[relPath];
      if (content === undefined) return;
      const targetPath = entry.right_path || `${rightDir}/${relPath}`;
      await invoke("write_file", { path: targetPath, content });
    },
    [result, modifiedContents, rightDir]
  );

  const saveAll = useCallback(
    async (leftDir: string) => {
      let saved = 0;
      for (const relPath of Object.keys(modifiedContents)) {
        try {
          await saveFile(relPath);
          saved++;
        } catch (e) {
          console.error(`Failed to save ${relPath}:`, e);
        }
      }
      if (saved > 0 && leftDir && rightDir) {
        const res = await invoke<CompareResult>("compare_directories", {
          left: leftDir,
          right: rightDir,
        });
        refreshResult(res);
        setModifiedContents({});
      }
      return saved;
    },
    [modifiedContents, saveFile, rightDir, refreshResult]
  );

  const reset = useCallback(() => {
    setModifiedContents({});
  }, []);

  return {
    modifiedContents,
    getEffectiveStatus,
    updateModifiedContent,
    applyLeftToRight,
    applyAllToRight,
    applySelectedToRight,
    saveFile,
    saveAll,
    reset,
  };
}
