use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct CliArgs {
    pub left_dir: String,
    pub right_dir: String,
}

pub struct AppState {
    pub cli_args: CliArgs,
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
}
