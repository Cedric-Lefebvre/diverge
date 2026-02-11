use crate::models::{CompareEntry, CompareResult};
use crate::scanner::scan_dir;

pub fn compare(left: &str, right: &str) -> CompareResult {
    let left_files = scan_dir(left);
    let right_files = scan_dir(right);

    let mut all_keys: Vec<String> = left_files
        .keys()
        .chain(right_files.keys())
        .cloned()
        .collect();
    all_keys.sort();
    all_keys.dedup();

    let mut entries = Vec::new();
    let (mut identical, mut different, mut only_left, mut only_right) = (0, 0, 0, 0);

    for key in &all_keys {
        let l = left_files.get(key);
        let r = right_files.get(key);

        let entry = match (l, r) {
            (Some((lp, lc)), Some((rp, rc))) => {
                if lc == rc {
                    identical += 1;
                } else {
                    different += 1;
                }
                CompareEntry {
                    rel_path: key.clone(),
                    status: if lc == rc { "identical" } else { "different" }.to_string(),
                    left_content: lc.clone(),
                    right_content: rc.clone(),
                    left_path: lp.clone(),
                    right_path: rp.clone(),
                }
            }
            (Some((lp, lc)), None) => {
                only_left += 1;
                CompareEntry {
                    rel_path: key.clone(),
                    status: "only_left".to_string(),
                    left_content: lc.clone(),
                    right_content: String::new(),
                    left_path: lp.clone(),
                    right_path: String::new(),
                }
            }
            (None, Some((rp, rc))) => {
                only_right += 1;
                CompareEntry {
                    rel_path: key.clone(),
                    status: "only_right".to_string(),
                    left_content: String::new(),
                    right_content: rc.clone(),
                    left_path: String::new(),
                    right_path: rp.clone(),
                }
            }
            (None, None) => continue,
        };
        entries.push(entry);
    }

    CompareResult {
        total: entries.len(),
        identical,
        different,
        only_left,
        only_right,
        entries,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_test_dirs() -> (tempfile::TempDir, tempfile::TempDir) {
        let left = tempfile::tempdir().unwrap();
        let right = tempfile::tempdir().unwrap();
        (left, right)
    }

    #[test]
    fn identical_files() {
        let (left, right) = setup_test_dirs();
        fs::write(left.path().join("file.txt"), "hello").unwrap();
        fs::write(right.path().join("file.txt"), "hello").unwrap();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 1);
        assert_eq!(result.identical, 1);
        assert_eq!(result.different, 0);
        assert_eq!(result.entries[0].status, "identical");
    }

    #[test]
    fn different_files() {
        let (left, right) = setup_test_dirs();
        fs::write(left.path().join("file.txt"), "hello").unwrap();
        fs::write(right.path().join("file.txt"), "world").unwrap();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 1);
        assert_eq!(result.different, 1);
        assert_eq!(result.entries[0].status, "different");
        assert_eq!(result.entries[0].left_content, "hello");
        assert_eq!(result.entries[0].right_content, "world");
    }

    #[test]
    fn only_left() {
        let (left, right) = setup_test_dirs();
        fs::write(left.path().join("only-here.txt"), "content").unwrap();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 1);
        assert_eq!(result.only_left, 1);
        assert_eq!(result.entries[0].status, "only_left");
    }

    #[test]
    fn only_right() {
        let (left, right) = setup_test_dirs();
        fs::write(right.path().join("only-here.txt"), "content").unwrap();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 1);
        assert_eq!(result.only_right, 1);
        assert_eq!(result.entries[0].status, "only_right");
    }

    #[test]
    fn empty_dirs() {
        let (left, right) = setup_test_dirs();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 0);
    }

    #[test]
    fn nested_directories() {
        let (left, right) = setup_test_dirs();
        fs::create_dir_all(left.path().join("sub/deep")).unwrap();
        fs::create_dir_all(right.path().join("sub/deep")).unwrap();
        fs::write(left.path().join("sub/deep/file.yaml"), "key: a").unwrap();
        fs::write(right.path().join("sub/deep/file.yaml"), "key: b").unwrap();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 1);
        assert_eq!(result.different, 1);
        assert_eq!(result.entries[0].rel_path, "sub/deep/file.yaml");
    }

    #[test]
    fn mixed_statuses() {
        let (left, right) = setup_test_dirs();
        fs::write(left.path().join("same.txt"), "same").unwrap();
        fs::write(right.path().join("same.txt"), "same").unwrap();
        fs::write(left.path().join("diff.txt"), "left").unwrap();
        fs::write(right.path().join("diff.txt"), "right").unwrap();
        fs::write(left.path().join("left-only.txt"), "x").unwrap();
        fs::write(right.path().join("right-only.txt"), "x").unwrap();

        let result = compare(left.path().to_str().unwrap(), right.path().to_str().unwrap());

        assert_eq!(result.total, 4);
        assert_eq!(result.identical, 1);
        assert_eq!(result.different, 1);
        assert_eq!(result.only_left, 1);
        assert_eq!(result.only_right, 1);
    }

    #[test]
    fn nonexistent_dir() {
        let right = tempfile::tempdir().unwrap();
        fs::write(right.path().join("file.txt"), "content").unwrap();

        let result = compare("/nonexistent/path", right.path().to_str().unwrap());

        assert_eq!(result.total, 1);
        assert_eq!(result.only_right, 1);
    }
}
