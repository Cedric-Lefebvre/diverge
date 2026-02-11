import { DiffEditor as MonacoDiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useRef, useEffect, useCallback } from "react";
import type { CompareEntry } from "../types";
import { getLanguageForFile } from "../utils/languageMap";
import { MONACO_DIFF_OPTIONS } from "../constants/statusConfig";

interface DiffEditorProps {
  entry: CompareEntry;
  modifiedContent: string | undefined;
  onContentChange: (content: string) => void;
  onApplyLeftToRight: () => void;
  onSaveFile: () => void;
}

export function DiffEditorView({
  entry,
  modifiedContent,
  onContentChange,
  onApplyLeftToRight,
  onSaveFile,
}: DiffEditorProps) {
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const disposableRef = useRef<{ dispose: () => void } | null>(null);

  const language = getLanguageForFile(entry.rel_path);
  const rightContent = modifiedContent ?? entry.right_content;

  const handleMount = useCallback(
    (diffEditor: editor.IStandaloneDiffEditor) => {
      editorRef.current = diffEditor;
      const modifiedEditor = diffEditor.getModifiedEditor();
      disposableRef.current = modifiedEditor.onDidChangeModelContent(() => {
        onContentChange(modifiedEditor.getValue());
      });
    },
    [onContentChange]
  );

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      disposableRef.current?.dispose();
      disposableRef.current = null;
    };
  }, []);

  return (
    <div className="diff-editor-container">
      <div className="diff-editor-header">
        <div className="diff-editor-filepath">
          <span>{entry.rel_path}</span>
          <span className={`diff-editor-badge badge-${entry.status}`}>
            {entry.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
        <div className="diff-editor-actions">
          {entry.status === "different" && (
            <button
              className="btn btn-sm btn-accent"
              onClick={onApplyLeftToRight}
              title="Copy entire left content to right"
            >
              Apply Left → Right
            </button>
          )}
          {modifiedContent !== undefined && (
            <button
              className="btn btn-sm btn-success"
              onClick={onSaveFile}
              title="Save this file to disk"
            >
              Save
            </button>
          )}
        </div>
      </div>
      <div className="diff-editor-monaco">
        <MonacoDiffEditor
          original={entry.left_content}
          modified={rightContent}
          language={language}
          theme="vs-dark"
          onMount={handleMount}
          options={MONACO_DIFF_OPTIONS}
        />
      </div>
    </div>
  );
}
