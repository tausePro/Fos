use tauri::Manager;
use std::sync::{Arc, Mutex};

mod system_tray;
mod notification_manager;

pub use system_tray::{SystemTrayManager, FocusStatus, update_tray_status};
pub use notification_manager::{NotificationManager, NotificationType, NotificationPriority, send_notification_command, request_notification_permissions, test_notification};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .plugin(tauri_plugin_notification::init())
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
            test_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
