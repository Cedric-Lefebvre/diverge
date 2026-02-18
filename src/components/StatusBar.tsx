import { useEffect, useMemo, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { CompareEntry, CompareResult } from "../types";

interface StatusBarProps {
  result: CompareResult | null;
  selectedFile: string | null;
  selectedEntry: CompareEntry | null;
  modifiedContent: string | undefined;
  modifiedCount: number;
}

function computeDiffStats(left: string, right: string) {
  const leftLines = left ? left.split("\n") : [];
  const rightLines = right ? right.split("\n") : [];
  const leftSet = new Set(leftLines);
  const rightSet = new Set(rightLines);
  let additions = 0;
  let deletions = 0;
  for (const line of rightLines) {
    if (!leftSet.has(line)) additions++;
  }
  for (const line of leftLines) {
    if (!rightSet.has(line)) deletions++;
  }
  return { additions, deletions, lines: rightLines.length };
}

export function StatusBar({ result, selectedFile, selectedEntry, modifiedContent, modifiedCount }: StatusBarProps) {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const diffStats = useMemo(() => {
    if (!selectedEntry) return null;
    const right = modifiedContent ?? selectedEntry.right_content;
    return computeDiffStats(selectedEntry.left_content, right);
  }, [selectedEntry, modifiedContent]);
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {result ? (
          <>
            <span className="status-item">
              <span className="status-count">{result.total}</span> files
            </span>
            <span className="status-sep">│</span>
            <span className="status-item status-identical">
              <span className="status-count">{result.identical}</span> identical
            </span>
            <span className="status-sep">│</span>
            <span className="status-item status-different">
              <span className="status-count">{result.different}</span> different
            </span>
            {result.only_left > 0 && (
              <>
                <span className="status-sep">│</span>
                <span className="status-item status-only-left">
                  <span className="status-count">{result.only_left}</span> only left
                </span>
              </>
            )}
            {result.only_right > 0 && (
              <>
                <span className="status-sep">│</span>
                <span className="status-item status-only-right">
                  <span className="status-count">{result.only_right}</span> only right
                </span>
              </>
            )}
          </>
        ) : (
          <span className="status-item">Select two folders to compare</span>
        )}
      </div>
      <div className="status-bar-right">
        {version && (
          <span className="status-item" style={{ opacity: 0.4 }}>v{version}</span>
        )}
        {modifiedCount > 0 && (
          <span className="status-item status-modified">
            {modifiedCount} unsaved
          </span>
        )}
        {diffStats && (
          <>
            <span className="status-item">
              Ln <span className="status-count">{diffStats.lines}</span>
            </span>
            <span className="status-sep">│</span>
            <span className="status-item" style={{ color: "#b5f5e0" }}>
              +{diffStats.additions}
            </span>
            <span className="status-item" style={{ color: "#ffb0b0" }}>
              −{diffStats.deletions}
            </span>
          </>
        )}
        {selectedFile && (
          <span className="status-item status-filepath">{selectedFile}</span>
        )}
      </div>
    </div>
  );
}
