use tauri::Manager;
use std::sync::{Arc, Mutex};

mod system_tray;
mod notification_manager;
mod global_shortcut_manager;
mod floating_window_manager;

pub use system_tray::{SystemTrayManager, FocusStatus, update_tray_status};
pub use notification_manager::{NotificationManager, NotificationType, NotificationPriority, send_notification_command, request_notification_permissions, test_notification};
pub use global_shortcut_manager::{FelipeGlobalShortcutManager, GlobalShortcutManager};
pub use floating_window_manager::{FloatingWindowManager, FloatingWindowData};

// Comandos Tauri que expondremos al frontend
#[tauri::command]
async fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Focus Mode Commands - Professional solution for macOS 26.1 click event issues
#[tauri::command]
async fn focus_exit() -> Result<String, String> {
    log::info!("focus_exit command called");
    Ok("exit".to_string())
}

#[tauri::command]
async fn focus_complete() -> Result<String, String> {
    log::info!("focus_complete command called");
    Ok("complete".to_string())
}

#[tauri::command]
async fn focus_pause() -> Result<String, String> {
    log::info!("focus_pause command called");
    Ok("pause".to_string())
}

#[tauri::command]
async fn focus_resume() -> Result<String, String> {
    log::info!("focus_resume command called");
    Ok("resume".to_string())
}

// Settings Commands
#[tauri::command]
async fn settings_toggle_weekend() -> Result<String, String> {
    log::info!("settings_toggle_weekend command called");
    Ok("toggle_weekend".to_string())
}

#[tauri::command]
async fn settings_toggle_cellphone() -> Result<String, String> {
    log::info!("settings_toggle_cellphone command called");
    Ok("toggle_cellphone".to_string())
}

#[tauri::command]
async fn settings_reset() -> Result<String, String> {
    log::info!("settings_reset command called");
    Ok("reset".to_string())
}

// Floating Window Commands
#[tauri::command]
async fn show_floating_window(app: tauri::AppHandle) -> Result<(), String> {
    log::info!("show_floating_window command called");
    
    if let Some(manager) = app.try_state::<Arc<Mutex<FloatingWindowManager>>>() {
        let manager = manager.lock().map_err(|e| format!("Failed to lock manager: {}", e))?;
        manager.show_floating_window(&app)?;
    } else {
        // Create new manager if not exists
        let manager = FloatingWindowManager::new();
        manager.show_floating_window(&app)?;
        app.manage(Arc::new(Mutex::new(manager)));
    }
    
    Ok(())
}

#[tauri::command]
async fn hide_floating_window(app: tauri::AppHandle) -> Result<(), String> {
    log::info!("hide_floating_window command called");
    
    if let Some(manager) = app.try_state::<Arc<Mutex<FloatingWindowManager>>>() {
        let manager = manager.lock().map_err(|e| format!("Failed to lock manager: {}", e))?;
        manager.hide_floating_window(&app)?;
    }
    
    Ok(())
}

#[tauri::command]
async fn update_floating_window(
    app: tauri::AppHandle,
    session_type: String,
    time_remaining: u32,
    progress_percent: f32,
    is_zona_roja: bool,
) -> Result<(), String> {
    log::info!("update_floating_window command called");
    
    if let Some(manager) = app.try_state::<Arc<Mutex<FloatingWindowManager>>>() {
        let manager = manager.lock().map_err(|e| format!("Failed to lock manager: {}", e))?;
        
        let data = FloatingWindowData {
            session_type,
            time_remaining,
            progress_percent,
            is_zona_roja,
        };
        
        manager.update_content(&app, data)?;
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Configuración inicial de la aplicación
            log::info!("Felipe OS iniciando...");
            
            // Inicializar System Tray Manager
            let mut tray_manager = SystemTrayManager::new(app.handle().clone());
            
            match tray_manager.initialize() {
                Ok(()) => {
                    log::info!("System Tray inicializado correctamente");
                    
                    // Guardar el tray manager en el estado de la app
                    app.manage(Arc::new(Mutex::new(tray_manager)));
                }
                Err(e) => {
                    log::error!("Error inicializando System Tray: {}", e);
                    // Continuar sin system tray si hay error
                }
            }
            
            // Inicializar Notification Manager
            let mut notification_manager = NotificationManager::new(app.handle().clone());
            
            // Usar tokio para la inicialización async
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match notification_manager.initialize().await {
                    Ok(()) => {
                        log::info!("Notification Manager inicializado correctamente");
                        
                        // Guardar el notification manager en el estado de la app
                        app_handle.manage(Arc::new(Mutex::new(notification_manager)));
                    }
                    Err(e) => {
                        log::error!("Error inicializando Notification Manager: {}", e);
                        // Continuar sin notificaciones si hay error
                    }
                }
            });
            
            // Inicializar Global Shortcut Manager
            let shortcut_manager = FelipeGlobalShortcutManager::new();
            
            match shortcut_manager.register_all(app.handle()) {
                Ok(()) => {
                    log::info!("Global Shortcuts registrados correctamente");
                    
                    // Guardar el shortcut manager en el estado de la app
                    app.manage(Arc::new(Mutex::new(shortcut_manager)));
                }
                Err(e) => {
                    log::error!("Error registrando Global Shortcuts: {}", e);
                    // Continuar sin shortcuts si hay error
                }
            }
            
            // Configurar la ventana principal
            if let Some(window) = app.get_webview_window("main") {
                // Configurar el comportamiento de cierre
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // En lugar de cerrar, ocultar la ventana
                        let _ = window_clone.hide();
                        api.prevent_close();
                    }
                });
            }
            
            log::info!("Felipe OS configurado correctamente");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            show_main_window,
            hide_main_window,
            update_tray_status,
            send_notification_command,
            request_notification_permissions,
            test_notification,
            focus_exit,
            focus_complete,
            focus_pause,
            focus_resume,
            settings_toggle_weekend,
            settings_toggle_cellphone,
            settings_reset,
            show_floating_window,
            hide_floating_window,
            update_floating_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
