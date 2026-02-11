import type { CompareResult } from "../types";

interface StatusBarProps {
  result: CompareResult | null;
  selectedFile: string | null;
  modifiedCount: number;
}

export function StatusBar({ result, selectedFile, modifiedCount }: StatusBarProps) {
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
        {modifiedCount > 0 && (
          <span className="status-item status-modified">
            {modifiedCount} unsaved
          </span>
        )}
        {selectedFile && (
          <span className="status-item status-filepath">{selectedFile}</span>
        )}
      </div>
    </div>
  );
}
