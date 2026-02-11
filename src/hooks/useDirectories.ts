import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CliArgs, CompareResult } from "../types";

export function useDirectories() {
  const [leftDir, setLeftDir] = useState("");
  const [rightDir, setRightDir] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initDone = useRef(false);
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    invoke<CliArgs>("get_cli_args").then((args) => {
      if (args.left_dir && args.right_dir) {
        setLeftDir(args.left_dir);
        setRightDir(args.right_dir);
        runCompare(args.left_dir, args.right_dir);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCompare = useCallback(
    async (left: string, right: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await invoke<CompareResult>("compare_directories", {
          left,
          right,
        });
        setResult(res);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const compare = useCallback(() => {
    if (!leftDir || !rightDir) return Promise.resolve();
    return runCompare(leftDir, rightDir);
  }, [leftDir, rightDir, runCompare]);

  const clear = useCallback(() => {
    setResult(null);
    setLeftDir("");
    setRightDir("");
    setError(null);
  }, []);

  return {
    leftDir,
    rightDir,
    setLeftDir,
    setRightDir,
    result,
    setResult,
    loading,
    error,
    compare,
    clear,
  };
}
