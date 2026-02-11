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
}

export interface AppConfig {
  ignore_dirs: string[];
}

export type EffectiveStatus =
  | "identical"
  | "different"
  | "only_left"
  | "only_right"
  | "applied";
