use tauri::{AppHandle, Manager, Emitter, menu::{Menu, MenuItem, PredefinedMenuItem}, tray::{TrayIcon, TrayIconBuilder}};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FocusStatus {
    Inactive,
    Active,
    ZonaRoja,
    Break,
}

pub struct SystemTrayManager {
    app_handle: AppHandle,
    tray_icon: Option<TrayIcon>,
}

impl SystemTrayManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { 
            app_handle,
            tray_icon: None,
        }
    }

    pub fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Inicializando System Tray Manager...");
        
        // Crear el menú del system tray
        let menu = self.create_tray_menu()?;
        
        // Crear el tray icon
        let tray = TrayIconBuilder::new()
            .menu(&menu)
            .tooltip("Felipe OS")
            .on_menu_event(move |app, event| {
                match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "focus_mode" => {
                        let _ = app.emit("menu-focus-toggle", ());
                    }
                    "zona_roja" => {
                        let _ = app.emit("menu-zona-roja", ());
                    }
                    "take_break" => {
                        let _ = app.emit("menu-take-break", ());
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        let _ = app.emit("navigate-to-settings", ());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            })
            .build(&self.app_handle)?;

        self.tray_icon = Some(tray);
        
        log::info!("System Tray inicializado correctamente");
        Ok(())
    }

    fn create_tray_menu(&self) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
        let show_item = MenuItem::with_id(&self.app_handle, "show", "Mostrar Felipe OS", true, None::<&str>)?;
        let hide_item = MenuItem::with_id(&self.app_handle, "hide", "Ocultar", true, None::<&str>)?;
        let separator1 = PredefinedMenuItem::separator(&self.app_handle)?;
        
        let focus_item = MenuItem::with_id(&self.app_handle, "focus_mode", "Modo Enfoque", true, None::<&str>)?;
        let zona_roja_item = MenuItem::with_id(&self.app_handle, "zona_roja", "Zona Roja", true, None::<&str>)?;
        let break_item = MenuItem::with_id(&self.app_handle, "take_break", "Tomar Descanso", true, None::<&str>)?;
        let separator2 = PredefinedMenuItem::separator(&self.app_handle)?;
        
        let settings_item = MenuItem::with_id(&self.app_handle, "settings", "Configuración", true, None::<&str>)?;
        let separator3 = PredefinedMenuItem::separator(&self.app_handle)?;
        let quit_item = MenuItem::with_id(&self.app_handle, "quit", "Salir", true, None::<&str>)?;

        let menu = Menu::with_items(&self.app_handle, &[
            &show_item,
            &hide_item,
            &separator1,
            &focus_item,
            &zona_roja_item,
            &break_item,
            &separator2,
            &settings_item,
            &separator3,
            &quit_item,
        ])?;

        Ok(menu)
    }

    pub fn update_status(&mut self, status: FocusStatus) -> Result<(), Box<dyn std::error::Error>> {
        let (tooltip, icon_name) = match status {
            FocusStatus::Inactive => ("Felipe OS - Inactivo", "32x32.png"),
            FocusStatus::Active => ("Felipe OS - Modo Enfoque Activo", "32x32.png"), // TODO: Add active icon
            FocusStatus::ZonaRoja => ("Felipe OS - Zona Roja Activa", "32x32.png"), // TODO: Add red zone icon
            FocusStatus::Break => ("Felipe OS - En Descanso", "32x32.png"), // TODO: Add break icon
        };
        
        // Actualizar tooltip del tray icon
        if let Some(ref tray) = self.tray_icon {
            tray.set_tooltip(Some(tooltip))?;
            
            // TODO: Cambiar icono dinámicamente cuando tengamos iconos específicos
            // tray.set_icon(Some(tauri::image::Image::from_path(format!("icons/{}", icon_name))?));
        }
        
        log::info!("Status del tray actualizado: {:?} - {}", status, tooltip);
        
        // Emitir evento al frontend para que pueda actualizar la UI
        if let Err(e) = self.app_handle.emit("tray-status-updated", &status) {
            log::error!("Error emitiendo evento tray-status-updated: {}", e);
        }
        
        Ok(())
    }

    // Métodos para manejar acciones del menú
    pub fn toggle_focus_mode(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Toggle Focus Mode desde tray");
        self.app_handle.emit("menu-focus-toggle", ())?;
        Ok(())
    }

    pub fn start_zona_roja(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Start Zona Roja desde tray");
        self.app_handle.emit("menu-zona-roja", ())?;
        Ok(())
    }

    pub fn take_break(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Take Break desde tray");
        self.app_handle.emit("menu-take-break", ())?;
        Ok(())
    }

    pub fn show_main_window(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Show Main Window desde tray");
        if let Some(window) = self.app_handle.get_webview_window("main") {
            window.show()?;
            window.set_focus()?;
        }
        Ok(())
    }

    pub fn hide_main_window(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Hide Main Window desde tray");
        if let Some(window) = self.app_handle.get_webview_window("main") {
            window.hide()?;
        }
        Ok(())
    }

    pub fn show_settings(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Show Settings desde tray");
        self.show_main_window()?;
        self.app_handle.emit("navigate-to-settings", ())?;
        Ok(())
    }

    pub fn quit_application(&self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Quit Application desde tray");
        self.app_handle.exit(0);
        Ok(())
    }
}

// Comandos Tauri para interactuar con el system tray desde el frontend
#[tauri::command]
pub async fn update_tray_status(
    app: tauri::AppHandle,
    status: FocusStatus,
) -> Result<(), String> {
    log::info!("Comando update_tray_status recibido: {:?}", status);
    
    // Obtener el tray manager del estado de la app y actualizar el status
    if let Some(tray_manager_mutex) = app.try_state::<std::sync::Arc<std::sync::Mutex<SystemTrayManager>>>() {
        if let Ok(mut tray_manager) = tray_manager_mutex.lock() {
            tray_manager.update_status(status.clone()).map_err(|e| e.to_string())?;
        }
    }
    
    // Emitir evento para notificar el cambio
    app.emit("tray-status-changed", &status).map_err(|e| e.to_string())?;
    
    Ok(())
}