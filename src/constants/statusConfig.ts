import type { EffectiveStatus } from "../types";

export interface StatusStyle {
  icon: string;
  color: string;
  label: string;
}

export const STATUS_STYLES: Record<EffectiveStatus, StatusStyle> = {
  identical: { icon: "✓", color: "#4ec9b0", label: "Identical" },
  applied: { icon: "✓", color: "#4ec9b0", label: "Applied (unsaved)" },
  different: { icon: "≠", color: "#e5c07b", label: "Different" },
  only_left: { icon: "←", color: "#e06c75", label: "Only in left" },
  only_right: { icon: "→", color: "#c678dd", label: "Only in right" },
};

export const MONACO_DIFF_OPTIONS = {
  readOnly: false,
  originalEditable: false,
  renderSideBySide: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  wordWrap: "off" as const,
  diffWordWrap: "off" as const,
  hideUnchangedRegions: {
    enabled: true,
    contextLineCount: 3,
    minimumLineCount: 5,
    revealLineCount: 20,
  },
  renderOverviewRuler: true,
  enableSplitViewResizing: true,
  ignoreTrimWhitespace: false,
};
