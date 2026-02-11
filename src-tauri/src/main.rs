#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

fn resolve_path(p: &str) -> String {
    let expanded = if p.starts_with("~/") {
        if let Some(home) = std::env::var_os("HOME") {
            PathBuf::from(home).join(&p[2..])
        } else {
            PathBuf::from(p)
        }
    } else {
        PathBuf::from(p)
    };

    let absolute = if expanded.is_absolute() {
        expanded
    } else {
        std::env::current_dir()
            .map(|cwd| cwd.join(&expanded))
            .unwrap_or(expanded)
    };

    absolute
        .canonicalize()
        .unwrap_or(absolute)
        .to_string_lossy()
        .to_string()
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    let (left, right) = if args.len() >= 3 {
        (resolve_path(&args[1]), resolve_path(&args[2]))
    } else {
        (String::new(), String::new())
    };

    diverge_lib::run_with_args(left, right);
}
