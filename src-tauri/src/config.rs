use std::fs;
use std::path::PathBuf;

use crate::models::AppConfig;

fn config_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    Ok(home.join(".diverge").join("config.yaml"))
}

pub fn default_config() -> AppConfig {
    AppConfig {
        ignore_dirs: [
            ".git",
            "node_modules",
            "__pycache__",
            "venv",
            ".venv",
            "target",
            ".DS_Store",
            ".idea",
            ".vscode",
            "dist",
            "build",
            ".next",
            ".nuxt",
            "coverage",
            ".tox",
            ".mypy_cache",
            ".pytest_cache",
            ".cargo",
            ".terraform",
            "vendor",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect(),
        editor_preferences: Default::default(),
        recent_comparisons: vec![],
    }
}

pub fn load_config() -> Result<AppConfig, String> {
    let path = config_path()?;

    if !path.exists() {
        let config = default_config();
        save_config(&config)?;
        return Ok(config);
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read config: {}", e))?;
    let config: AppConfig =
        serde_yaml::from_str(&contents).map_err(|e| format!("Failed to parse config: {}", e))?;
    Ok(config)
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = config_path()?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let yaml =
        serde_yaml::to_string(config).map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, yaml).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EditorPreferences;

    #[test]
    fn default_config_has_common_ignore_dirs() {
        let cfg = default_config();
        assert!(cfg.ignore_dirs.contains(&".git".to_string()));
        assert!(cfg.ignore_dirs.contains(&"node_modules".to_string()));
        assert!(cfg.ignore_dirs.contains(&"__pycache__".to_string()));
        assert!(cfg.ignore_dirs.contains(&"target".to_string()));
        assert!(cfg.ignore_dirs.contains(&"vendor".to_string()));
    }

    #[test]
    fn default_config_has_default_editor_prefs() {
        let cfg = default_config();
        assert!(!cfg.editor_preferences.minimap_enabled);
    }

    #[test]
    fn config_roundtrip_yaml() {
        let cfg = AppConfig {
            ignore_dirs: vec![".git".to_string(), "node_modules".to_string()],
            editor_preferences: EditorPreferences {
                minimap_enabled: true,
                show_full_content: true,
                sidebar_width: 280,
            },
            recent_comparisons: vec![],
        };
        let yaml = serde_yaml::to_string(&cfg).unwrap();
        let parsed: AppConfig = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(parsed.ignore_dirs, cfg.ignore_dirs);
        assert_eq!(
            parsed.editor_preferences.minimap_enabled,
            cfg.editor_preferences.minimap_enabled
        );
    }

    #[test]
    fn config_deserialize_missing_editor_prefs() {
        let yaml = "ignore_dirs:\n  - .git\n  - node_modules\n";
        let parsed: AppConfig = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(parsed.ignore_dirs.len(), 2);
        assert!(!parsed.editor_preferences.minimap_enabled);
    }

    #[test]
    fn config_deserialize_empty() {
        let yaml = "ignore_dirs: []\n";
        let parsed: AppConfig = serde_yaml::from_str(yaml).unwrap();
        assert!(parsed.ignore_dirs.is_empty());
    }

    #[test]
    fn config_serialize_preserves_all_fields() {
        let cfg = AppConfig {
            ignore_dirs: vec!["test".to_string()],
            editor_preferences: EditorPreferences {
                minimap_enabled: true,
                show_full_content: true,
                sidebar_width: 280,
            },
            recent_comparisons: vec![],
        };
        let yaml = serde_yaml::to_string(&cfg).unwrap();
        assert!(yaml.contains("test"));
        assert!(yaml.contains("minimap_enabled: true"));
    }
}
