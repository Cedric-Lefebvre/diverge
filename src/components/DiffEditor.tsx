import { DiffEditor as MonacoDiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import type { CompareEntry, EditorPreferences } from "../types";
import { getLanguageForFile } from "../utils/languageMap";
import { parseStructure } from "../utils/structureParser";
import { MONACO_DIFF_OPTIONS } from "../constants/statusConfig";
import { OutlineModal } from "./OutlineModal";

interface DiffEditorProps {
  entry: CompareEntry;
  modifiedContent: string | undefined;
  minimapEnabled: boolean;
  showFullContent: boolean;
  onEditorPrefChange: (patch: Partial<EditorPreferences>) => void;
  onContentChange: (content: string) => void;
  onApplyLeftToRight: () => void;
  onSaveFile: () => void;
}

export function DiffEditorView({
  entry,
  modifiedContent,
  minimapEnabled,
  showFullContent,
  onEditorPrefChange,
  onContentChange,
  onApplyLeftToRight,
  onSaveFile,
}: DiffEditorProps) {
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const disposableRef = useRef<{ dispose: () => void } | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const versionRef = useRef({ initial: 0, current: 0 });

  const language = getLanguageForFile(entry.rel_path);
  const rightContent = modifiedContent ?? entry.right_content;

  const outlineNodes = useMemo(
    () => parseStructure(rightContent, language),
    [rightContent, language]
  );

  const diffOptions = useMemo(() => ({
    ...MONACO_DIFF_OPTIONS,
    minimap: { enabled: minimapEnabled },
    hideUnchangedRegions: showFullContent
      ? { enabled: false }
      : MONACO_DIFF_OPTIONS.hideUnchangedRegions,
  }), [minimapEnabled, showFullContent]);

  const handleMount = useCallback(
    (diffEditor: editor.IStandaloneDiffEditor) => {
      editorRef.current = diffEditor;
      const modifiedEditor = diffEditor.getModifiedEditor();
      const model = modifiedEditor.getModel();
      if (model) {
        versionRef.current.initial = model.getAlternativeVersionId();
        versionRef.current.current = versionRef.current.initial;
      }
      disposableRef.current = modifiedEditor.onDidChangeModelContent(() => {
        onContentChange(modifiedEditor.getValue());
        if (model) {
          const ver = model.getAlternativeVersionId();
          versionRef.current.current = ver;
          setCanUndo(ver !== versionRef.current.initial);
          setCanRedo(false);
        }
      });
      // Check for diff changes once computed
      setTimeout(() => {
        const changes = diffEditor.getLineChanges();
        setHasChanges(!!changes && changes.length > 0);
      }, 500);
    },
    [onContentChange]
  );

  useEffect(() => {
    return () => {
      disposableRef.current?.dispose();
      disposableRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.getModifiedEditor().updateOptions({
      minimap: { enabled: minimapEnabled },
    });
    editorRef.current.getOriginalEditor().updateOptions({
      minimap: { enabled: minimapEnabled },
    });
  }, [minimapEnabled]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({
      hideUnchangedRegions: showFullContent
        ? { enabled: false }
        : MONACO_DIFF_OPTIONS.hideUnchangedRegions,
    } as editor.IDiffEditorOptions);
  }, [showFullContent]);

  // Listen for diff update to track hasChanges
  useEffect(() => {
    const diff = editorRef.current;
    if (!diff) return;
    const handler = diff.onDidUpdateDiff(() => {
      const changes = diff.getLineChanges();
      setHasChanges(!!changes && changes.length > 0);
    });
    return () => handler.dispose();
  }, []);

  const flashLine = useCallback((ed: editor.IStandaloneCodeEditor, line: number) => {
    const decorations = ed.createDecorationsCollection([
      {
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: { isWholeLine: true, className: "jump-highlight" },
      },
    ]);
    setTimeout(() => decorations.clear(), 1200);
  }, []);

  const jumpToLine = useCallback((line: number) => {
    const ed = editorRef.current?.getModifiedEditor();
    if (ed) {
      ed.revealLineInCenter(line);
      ed.setPosition({ lineNumber: line, column: 1 });
      ed.focus();
      flashLine(ed, line);
    }
  }, [flashLine]);

  const navigateChange = useCallback((direction: "prev" | "next") => {
    const diff = editorRef.current;
    if (!diff) return;
    const changes = diff.getLineChanges();
    if (!changes || changes.length === 0) return;
    const ed = diff.getModifiedEditor();
    const currentLine = ed.getPosition()?.lineNumber ?? 1;
    let target: number | null = null;
    if (direction === "next") {
      for (const c of changes) {
        const line = c.modifiedStartLineNumber;
        if (line > currentLine) { target = line; break; }
      }
      if (target === null) target = changes[0].modifiedStartLineNumber;
    } else {
      for (let i = changes.length - 1; i >= 0; i--) {
        const line = changes[i].modifiedStartLineNumber;
        if (line < currentLine) { target = line; break; }
      }
      if (target === null) target = changes[changes.length - 1].modifiedStartLineNumber;
    }
    ed.revealLineInCenter(target);
    ed.setPosition({ lineNumber: target, column: 1 });
    ed.focus();
    flashLine(ed, target);
  }, [flashLine]);

  const handleUndo = useCallback(() => {
    const ed = editorRef.current?.getModifiedEditor();
    if (!ed) return;
    ed.trigger("toolbar", "undo", null);
    ed.focus();
    setTimeout(() => {
      const model = ed.getModel();
      if (model) {
        const ver = model.getAlternativeVersionId();
        setCanUndo(ver !== versionRef.current.initial);
        setCanRedo(true);
      }
    }, 10);
  }, []);

  const handleRedo = useCallback(() => {
    const ed = editorRef.current?.getModifiedEditor();
    if (!ed) return;
    ed.trigger("toolbar", "redo", null);
    ed.focus();
    setTimeout(() => {
      const model = ed.getModel();
      if (model) {
        const ver = model.getAlternativeVersionId();
        setCanUndo(ver !== versionRef.current.initial);
        // If version matches current, nothing left to redo
        setCanRedo(false);
      }
    }, 10);
  }, []);

  // Keyboard shortcuts: n/p for next/prev change, u for undo, Ctrl+Shift+Z for redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      // Only handle when not typing in an input/textarea
      // But DO handle when focus is inside Monaco (which uses textarea internally)
      const isMonacoTextarea = (e.target as HTMLElement)?.closest?.(".monaco-editor");
      if ((tag === "INPUT" || tag === "TEXTAREA") && !isMonacoTextarea) return;

      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        navigateChange("next");
      } else if (e.key === "p" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        navigateChange("prev");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigateChange]);

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
          <button
            className={`btn-tiny ${minimapEnabled ? "active" : ""}`}
            onClick={() => onEditorPrefChange({ minimap_enabled: !minimapEnabled })}
            title={minimapEnabled ? "Hide minimap" : "Show minimap"}
          >
            ▐
          </button>
          <button
            className={`btn-tiny ${outlineOpen ? "active" : ""}`}
            onClick={() => setOutlineOpen(!outlineOpen)}
            title="Document outline"
          >
            ⊟
          </button>
          <button
            className={`btn-tiny ${!showFullContent ? "active" : ""}`}
            onClick={() => onEditorPrefChange({ show_full_content: !showFullContent })}
            title={showFullContent ? "Hide unchanged lines" : "Show all lines"}
          >
            ↕
          </button>
          <span className="btn-separator" />
          <button
            className="btn-tiny"
            onClick={() => navigateChange("prev")}
            disabled={!hasChanges}
            title="Previous change (p)"
          >
            ↑
          </button>
          <button
            className="btn-tiny"
            onClick={() => navigateChange("next")}
            disabled={!hasChanges}
            title="Next change (n)"
          >
            ↓
          </button>
          <span className="btn-separator" />
          <button
            className="btn-tiny"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>
          <button
            className="btn-tiny"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>
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
          options={diffOptions}
        />
      </div>

      {outlineOpen && (
        <OutlineModal
          nodes={outlineNodes}
          onJump={jumpToLine}
          onClose={() => setOutlineOpen(false)}
        />
      )}
    </div>
  );
}
