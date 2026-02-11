use std::fs;
use std::path::Path;
use std::sync::Mutex;

use crate::compare;
use crate::models::{AppState, CliArgs, CompareResult};

#[tauri::command]
pub fn compare_directories(left: String, right: String) -> Result<CompareResult, String> {
    if !Path::new(&left).is_dir() {
        return Err(format!("Left path is not a directory: {}", left));
    }
    if !Path::new(&right).is_dir() {
        return Err(format!("Right path is not a directory: {}", right));
    }
    Ok(compare::compare(&left, &right))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory {}: {}", parent.display(), e))?;
    }
    fs::write(&path, &content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
pub fn get_cli_args(state: tauri::State<'_, Mutex<AppState>>) -> Result<CliArgs, String> {
    state
        .lock()
        .map(|s| s.cli_args.clone())
        .map_err(|_| "Failed to read application state".to_string())
}
