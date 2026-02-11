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
            "vendor",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect(),
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
