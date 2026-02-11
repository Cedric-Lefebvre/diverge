use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct CliArgs {
    pub left_dir: String,
    pub right_dir: String,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorPreferences {
    #[serde(default)]
    pub minimap_enabled: bool,
    #[serde(default = "default_true")]
    pub show_full_content: bool,
}

fn default_true() -> bool {
    true
}

impl Default for EditorPreferences {
    fn default() -> Self {
        Self {
            minimap_enabled: false,
            show_full_content: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default)]
    pub ignore_dirs: Vec<String>,
    #[serde(default)]
    pub editor_preferences: EditorPreferences,
}

pub struct AppState {
    pub cli_args: CliArgs,
    pub config: AppConfig,
}

#[derive(Debug, Clone, Serialize)]
pub struct CompareEntry {
    pub rel_path: String,
    pub status: String,
    pub left_content: String,
    pub right_content: String,
    pub left_path: String,
    pub right_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CompareResult {
    pub entries: Vec<CompareEntry>,
    pub total: usize,
    pub identical: usize,
    pub different: usize,
    pub only_left: usize,
    pub only_right: usize,
    pub ignored_dirs: Vec<String>,
}
