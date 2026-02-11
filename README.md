# diverge

A desktop app for comparing two directories side-by-side with inline editing. Built with Tauri, React, TypeScript, and Monaco Editor.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- Side-by-side diff viewer powered by Monaco Editor (same engine as VS Code)
- Collapsible unchanged regions so you can focus on what matters
- Apply changes from left to right per-file or in bulk
- Inline editing on the right side before saving
- Folder tree with collapsible directories and folder-level checkboxes
- Color-coded file status: green (identical/applied), yellow (different), red (only left), purple (only right)
- Native folder picker dialogs
- CLI support with relative and absolute paths
- Cross-platform: Linux (X11/Wayland) and macOS

## Install

### From source

Prerequisites: [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/), [Rust](https://rustup.rs/), and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
git clone https://github.com/your-username/diverge.git
cd diverge
pnpm install
pnpm tauri build
```

The built packages (`.deb`, `.rpm`, `.AppImage` on Linux, `.dmg` on macOS) will be in `src-tauri/target/release/bundle/`.

## Usage

### GUI

Launch the app and use the folder pickers to select two directories, then click **Compare**.

### CLI

```bash
# Absolute paths
diverge /path/to/left /path/to/right

# Relative paths (resolved from current directory)
diverge ./env-staging ./env-production

# Mix both
diverge ./local-config /etc/app/config
```

### Development

```bash
pnpm tauri dev

# With folders pre-loaded
pnpm tauri dev -- -- ./left-folder ./right-folder
```

## Project structure

```
src/                    # React frontend
  components/           # FileTree, DiffEditor, Toolbar, StatusBar
  hooks/                # useCompare, useDirectories, useFileTree, useModifications
  utils/                # Path utilities, language detection
  constants/            # Status styles, Monaco config
  types.ts              # Shared TypeScript interfaces
src-tauri/              # Rust backend
  src/
    main.rs             # CLI arg parsing, entry point
    lib.rs              # Tauri app setup
    commands.rs         # Tauri IPC commands
    compare.rs          # Directory comparison logic
    scanner.rs          # Recursive file scanning
    models.rs           # Data structures
```

## License

MIT
