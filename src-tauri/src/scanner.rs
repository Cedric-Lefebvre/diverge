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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn scan_empty_dir() {
        let dir = tempfile::tempdir().unwrap();
        let (files, ignored) = scan_dir(dir.path().to_str().unwrap(), &[]);
        assert!(files.is_empty());
        assert!(ignored.is_empty());
    }

    #[test]
    fn scan_flat_files() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("a.txt"), "aaa").unwrap();
        fs::write(dir.path().join("b.txt"), "bbb").unwrap();

        let (files, _) = scan_dir(dir.path().to_str().unwrap(), &[]);
        assert_eq!(files.len(), 2);
        assert!(files.contains_key("a.txt"));
        assert!(files.contains_key("b.txt"));
        assert_eq!(files["a.txt"].1, "aaa");
    }

    #[test]
    fn scan_nested_dirs() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir_all(dir.path().join("sub/deep")).unwrap();
        fs::write(dir.path().join("sub/deep/file.txt"), "content").unwrap();

        let (files, _) = scan_dir(dir.path().to_str().unwrap(), &[]);
        assert_eq!(files.len(), 1);
        assert!(files.contains_key("sub/deep/file.txt"));
    }

    #[test]
    fn scan_ignores_specified_dirs() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir_all(dir.path().join("node_modules/pkg")).unwrap();
        fs::write(dir.path().join("node_modules/pkg/index.js"), "code").unwrap();
        fs::write(dir.path().join("app.js"), "code").unwrap();

        let ignore = vec!["node_modules".to_string()];
        let (files, ignored) = scan_dir(dir.path().to_str().unwrap(), &ignore);
        assert_eq!(files.len(), 1);
        assert!(files.contains_key("app.js"));
        assert_eq!(ignored, vec!["node_modules"]);
    }

    #[test]
    fn scan_tracks_multiple_ignored_dirs() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir_all(dir.path().join("node_modules")).unwrap();
        fs::create_dir_all(dir.path().join(".git")).unwrap();
        fs::write(dir.path().join("app.js"), "code").unwrap();

        let ignore = vec!["node_modules".to_string(), ".git".to_string()];
        let (files, mut ignored) = scan_dir(dir.path().to_str().unwrap(), &ignore);
        ignored.sort();
        assert_eq!(files.len(), 1);
        assert_eq!(ignored, vec![".git", "node_modules"]);
    }

    #[test]
    fn scan_nonexistent_dir() {
        let (files, ignored) = scan_dir("/nonexistent/path/xyz", &[]);
        assert!(files.is_empty());
        assert!(ignored.is_empty());
    }

    #[test]
    fn scan_stores_absolute_paths() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("file.txt"), "content").unwrap();

        let (files, _) = scan_dir(dir.path().to_str().unwrap(), &[]);
        let (abs_path, _) = &files["file.txt"];
        assert!(abs_path.starts_with(dir.path().to_str().unwrap()));
    }

    #[test]
    fn scan_reads_file_content() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("file.txt"), "hello world").unwrap();

        let (files, _) = scan_dir(dir.path().to_str().unwrap(), &[]);
        assert_eq!(files["file.txt"].1, "hello world");
    }

    #[test]
    fn scan_ignores_nested_matching_dir() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir_all(dir.path().join("src/node_modules/pkg")).unwrap();
        fs::write(
            dir.path().join("src/node_modules/pkg/index.js"),
            "code",
        )
        .unwrap();
        fs::write(dir.path().join("src/app.js"), "code").unwrap();

        let ignore = vec!["node_modules".to_string()];
        let (files, ignored) = scan_dir(dir.path().to_str().unwrap(), &ignore);
        assert_eq!(files.len(), 1);
        assert!(files.contains_key("src/app.js"));
        assert_eq!(ignored, vec!["src/node_modules"]);
    }
}
