use std::collections::BTreeMap;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

const SKIP_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    "__pycache__",
    "venv",
    ".venv",
    "target",
    ".DS_Store",
];

pub fn scan_dir(root: &str) -> BTreeMap<String, (String, String)> {
    let mut files = BTreeMap::new();
    let base = Path::new(root);
    if !base.exists() {
        return files;
    }

    for entry in WalkDir::new(base)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !SKIP_DIRS.contains(&name.as_ref())
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }

        if let Ok(meta) = entry.metadata() {
            if meta.len() > MAX_FILE_SIZE {
                continue;
            }
        }

        if let Ok(rel) = entry.path().strip_prefix(base) {
            let rel_str = rel.to_string_lossy().to_string();
            let abs_str = entry.path().to_string_lossy().to_string();

            if let Ok(content) = fs::read_to_string(entry.path()) {
                files.insert(rel_str, (abs_str, content));
            }
        }
    }
    files
}
