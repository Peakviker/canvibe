// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::path::PathBuf;
use std::fs;
mod api;
use api::{AppState, create_api_router};

#[tauri::command]
fn exec_git(path: String, args: Vec<String>) -> Result<String, String> {
    let output = Command::new("git")
        .args(&args)
        .current_dir(&path)
        .output()
        .map_err(|e| format!("Failed to execute git: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Git command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn list_files(path: String) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    
    fn walk_dir(dir: &PathBuf, files: &mut Vec<String>, base: &PathBuf) -> Result<(), String> {
        let entries = fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            
            // Пропускаем скрытые файлы и .git
            if let Some(name) = path.file_name() {
                let name_str = name.to_string_lossy();
                if name_str.starts_with('.') && name_str != ".thoughtlog" {
                    continue;
                }
            }

            if path.is_dir() {
                walk_dir(&path, files, base)?;
            } else if path.is_file() {
                let relative = path.strip_prefix(base)
                    .map_err(|e| format!("Failed to get relative path: {}", e))?;
                files.push(relative.to_string_lossy().to_string());
            }
        }
        
        Ok(())
    }

    let base_path = PathBuf::from(&path);
    walk_dir(&base_path, &mut files, &base_path)?;
    
    Ok(files)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tokio::main]
async fn main() {
    // Создаём состояние приложения для API
    let app_state = AppState {
        events: std::sync::Arc::new(tokio::sync::Mutex::new(Vec::new())),
        nodes: std::sync::Arc::new(tokio::sync::Mutex::new(Vec::new())),
        canvas_state: std::sync::Arc::new(tokio::sync::Mutex::new(std::collections::HashMap::new())),
    };

    // Запускаем API сервер в отдельной задаче
    let state_clone = app_state.clone();
    tokio::spawn(async move {
        let app = create_api_router(state_clone);
        match tokio::net::TcpListener::bind("127.0.0.1:14141").await {
            Ok(listener) => {
                println!("🚀 Canvibe API server running on http://127.0.0.1:14141");
                println!("📡 Control tunnel is ready!");
                let _ = axum::serve(listener, app).await;
            }
            Err(e) => {
                eprintln!("Failed to start API server: {}", e);
            }
        }
    });

    // Запускаем Tauri приложение
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![exec_git, list_files, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
