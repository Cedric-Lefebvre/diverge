use std::cell::RefCell;
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

pub fn scan_dir(root: &str, ignore_dirs: &[String]) -> (BTreeMap<String, (String, String)>, Vec<String>) {
    let mut files = BTreeMap::new();
    let base = Path::new(root);
    if !base.exists() {
        return (files, vec![]);
    }

    let ignored_found = RefCell::new(Vec::new());

    for entry in WalkDir::new(base)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            let is_ignored = ignore_dirs.iter().any(|skip| skip == name.as_ref());
            if is_ignored && e.file_type().is_dir() {
                if let Ok(rel) = e.path().strip_prefix(base) {
                    ignored_found.borrow_mut().push(rel.to_string_lossy().to_string());
                }
            }
            !is_ignored
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

    (files, ignored_found.into_inner())
}
