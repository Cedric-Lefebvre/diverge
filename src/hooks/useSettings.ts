import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppConfig } from "../types";

export function useSettings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    invoke<AppConfig>("get_config").then(setConfig);
  }, []);

  const addIgnoreDir = useCallback((dir: string) => {
    const trimmed = dir.trim();
    if (!trimmed) return;
    setConfig((prev) => {
      if (!prev || prev.ignore_dirs.includes(trimmed)) return prev;
      return { ...prev, ignore_dirs: [...prev.ignore_dirs, trimmed] };
    });
    setDirty(true);
  }, []);

  const removeIgnoreDir = useCallback((dir: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, ignore_dirs: prev.ignore_dirs.filter((d) => d !== dir) };
    });
    setDirty(true);
  }, []);

  const editIgnoreDir = useCallback((oldDir: string, newDir: string) => {
    const trimmed = newDir.trim();
    if (!trimmed || trimmed === oldDir) return;
    setConfig((prev) => {
      if (!prev || prev.ignore_dirs.includes(trimmed)) return prev;
      return {
        ...prev,
        ignore_dirs: prev.ignore_dirs.map((d) => (d === oldDir ? trimmed : d)),
      };
    });
    setDirty(true);
  }, []);

  const updateEditorPref = useCallback((patch: Partial<AppConfig["editor_preferences"]>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        editor_preferences: { ...prev.editor_preferences, ...patch },
      };
      invoke("save_config", { newConfig: updated });
      return updated;
    });
  }, []);

  const addRecentComparison = useCallback((leftDir: string, rightDir: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const recent = (prev.recent_comparisons ?? []).filter(
        (r) => !(r.left_dir === leftDir && r.right_dir === rightDir)
      );
      recent.unshift({ left_dir: leftDir, right_dir: rightDir });
      const updated = { ...prev, recent_comparisons: recent.slice(0, 10) };
      invoke("save_config", { newConfig: updated });
      return updated;
    });
  }, []);

  const removeRecentComparison = useCallback((leftDir: string, rightDir: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const recent = (prev.recent_comparisons ?? []).filter(
        (r) => !(r.left_dir === leftDir && r.right_dir === rightDir)
      );
      const updated = { ...prev, recent_comparisons: recent };
      invoke("save_config", { newConfig: updated });
      return updated;
    });
  }, []);

  const save = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    try {
      await invoke("save_config", { newConfig: config });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [config]);

  return { config, dirty, saving, addIgnoreDir, removeIgnoreDir, editIgnoreDir, updateEditorPref, addRecentComparison, removeRecentComparison, save };
}
