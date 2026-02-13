export interface CompareEntry {
  rel_path: string;
  status: "identical" | "different" | "only_left" | "only_right";
  left_content: string;
  right_content: string;
  left_path: string;
  right_path: string;
}

export interface CompareResult {
  entries: CompareEntry[];
  total: number;
  identical: number;
  different: number;
  only_left: number;
  only_right: number;
  ignored_dirs: string[];
}

export interface CliArgs {
  left_dir: string;
  right_dir: string;
  cwd: string;
}

export interface EditorPreferences {
  minimap_enabled: boolean;
  show_full_content: boolean;
  sidebar_width: number;
}

export interface RecentComparison {
  left_dir: string;
  right_dir: string;
}

export interface AppConfig {
  ignore_dirs: string[];
  editor_preferences: EditorPreferences;
  recent_comparisons: RecentComparison[];
}

export type EffectiveStatus =
  | "identical"
  | "different"
  | "only_left"
  | "only_right"
  | "applied";
