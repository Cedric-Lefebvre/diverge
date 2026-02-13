mod commands;
mod compare;
mod config;
mod models;
mod scanner;

use models::{AppState, CliArgs};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    run_with_args(String::new(), String::new(), String::new());
}

pub fn run_with_args(left_dir: String, right_dir: String, cwd: String) {
    let cfg = config::load_config().unwrap_or_else(|_| config::default_config());

    let state = AppState {
        cli_args: CliArgs { left_dir, right_dir, cwd },
        config: cfg,
    };

    tauri::Builder::default()
        .manage(Mutex::new(state))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::compare_directories,
            commands::write_file,
            commands::read_file,
            commands::get_cli_args,
            commands::get_config,
            commands::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
