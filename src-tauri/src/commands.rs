use std::fs;
use std::path::Path;
use std::sync::Mutex;

use crate::compare;
use crate::config;
use crate::models::{AppConfig, AppState, CliArgs, CompareResult};

#[tauri::command]
pub fn compare_directories(
    left: String,
    right: String,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<CompareResult, String> {
    if !Path::new(&left).is_dir() {
        return Err(format!("Left path is not a directory: {}", left));
    }
    if !Path::new(&right).is_dir() {
        return Err(format!("Right path is not a directory: {}", right));
    }
    let ignore_dirs = state
        .lock()
        .map(|s| s.config.ignore_dirs.clone())
        .map_err(|_| "Failed to read application state".to_string())?;
    Ok(compare::compare(&left, &right, &ignore_dirs))
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

#[tauri::command]
pub fn get_config(state: tauri::State<'_, Mutex<AppState>>) -> Result<AppConfig, String> {
    state
        .lock()
        .map(|s| s.config.clone())
        .map_err(|_| "Failed to read application state".to_string())
}

#[tauri::command]
pub fn save_config(
    new_config: AppConfig,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    config::save_config(&new_config)?;
    let mut s = state
        .lock()
        .map_err(|_| "Failed to read application state".to_string())?;
    s.config = new_config;
    Ok(())
}
