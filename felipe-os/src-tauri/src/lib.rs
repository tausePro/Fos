use tauri::Manager;

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
        .setup(|app| {
            // Configuración inicial de la aplicación
            log::info!("Felipe OS iniciando...");
            
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
            hide_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
