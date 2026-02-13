import { useEffect, useRef } from "react";
import { watch } from "@tauri-apps/plugin-fs";

export function useFileWatcher(
  leftDir: string,
  rightDir: string,
  hasResult: boolean,
  onRefresh: () => void
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unwatchRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!hasResult || !leftDir || !rightDir) return;

    const dirs = [leftDir, rightDir];
    let cancelled = false;

    const setup = async () => {
      // Clean up previous watchers
      for (const unwatch of unwatchRef.current) {
        unwatch();
      }
      unwatchRef.current = [];

      for (const dir of dirs) {
        try {
          const unwatch = await watch(dir, () => {
            if (cancelled) return;
            // Debounce — many events fire at once during saves
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              onRefresh();
            }, 1000);
          }, { recursive: true, delayMs: 500 });

          if (!cancelled) {
            unwatchRef.current.push(unwatch);
          } else {
            unwatch();
          }
        } catch (err) {
          console.warn(`Failed to watch ${dir}:`, err);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      for (const unwatch of unwatchRef.current) {
        unwatch();
      }
      unwatchRef.current = [];
    };
  }, [leftDir, rightDir, hasResult, onRefresh]);
}
