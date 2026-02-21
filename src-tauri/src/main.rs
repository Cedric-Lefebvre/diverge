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

fn print_help() {
    println!("diverge {}", env!("CARGO_PKG_VERSION"));
    println!("A visual directory diff tool");
    println!();
    println!("Usage: diverge [OPTIONS] [LEFT] [RIGHT]");
    println!();
    println!("Arguments:");
    println!("  [LEFT]   Left directory to compare");
    println!("  [RIGHT]  Right directory to compare");
    println!();
    println!("Options:");
    println!("  -h, --help     Print help");
    println!("  -V, --version  Print version");
    println!("  -w, --wait     Wait for the window to be closed before returning");
    println!();
    println!("Examples:");
    println!("  diverge                    Open with empty comparison");
    println!("  diverge /path/to/dir       Open with left side pre-filled");
    println!("  diverge dir1 dir2          Compare two directories");
    println!("  diverge dir1 dir2 --wait   Block until the window is closed");
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    let has_flag = |short: &str, long: &str| -> bool {
        args.iter().any(|a| a == short || a == long)
    };

    if has_flag("-V", "--version") {
        println!("diverge {}", env!("CARGO_PKG_VERSION"));
        return;
    }

    if has_flag("-h", "--help") {
        print_help();
        return;
    }

    let wait = has_flag("-w", "--wait");

    if !wait && std::env::var("_DIVERGE_DETACHED").is_err() {
        #[cfg(target_os = "linux")]
        {
            let exe = std::fs::read_link("/proc/self/exe")
                .unwrap_or_else(|_| std::env::current_exe().unwrap());
            let _ = std::process::Command::new("setsid")
                .arg(exe)
                .args(std::env::args().skip(1))
                .env("_DIVERGE_DETACHED", "1")
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn();
            return;
        }

        #[cfg(target_os = "macos")]
        {
            use std::os::unix::process::CommandExt;
            let exe = std::env::current_exe().unwrap();
            let _ = std::process::Command::new(exe)
                .args(std::env::args().skip(1))
                .env("_DIVERGE_DETACHED", "1")
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .process_group(0)
                .spawn();
            return;
        }
    }

    let cwd = std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let positional: Vec<&str> = args[1..]
        .iter()
        .filter(|a| !a.starts_with('-'))
        .map(|a| a.as_str())
        .collect();

    let (left, right) = match positional.as_slice() {
        [l, r, ..] => (resolve_path(l), resolve_path(r)),
        [l] => (resolve_path(l), String::new()),
        [] => (String::new(), String::new()),
    };

    diverge_lib::run_with_args(left, right, cwd);
}
