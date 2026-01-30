use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::sync::Mutex;

/// GlobalShortcutManager handles global keyboard shortcuts for Felipe OS
/// 
/// Shortcuts:
/// - Cmd+Shift+F: Toggle focus mode
/// - Cmd+Shift+Z: Activate zona roja
/// - Cmd+Shift+B: Start break session
/// - Cmd+Shift+S: Show/hide main window
pub struct FelipeGlobalShortcutManager {
    registered_shortcuts: Mutex<Vec<String>>,
}

impl FelipeGlobalShortcutManager {
    pub fn new() -> Self {
        Self {
            registered_shortcuts: Mutex::new(Vec::new()),
        }
    }

    /// Register all default global shortcuts
    pub fn register_all(&self, app: &AppHandle) -> Result<(), String> {
        let shortcuts = vec![
            ("CmdOrCtrl+Shift+F", "toggle_focus_mode"),
            ("CmdOrCtrl+Shift+Z", "activate_zona_roja"),
            ("CmdOrCtrl+Shift+B", "start_break"),
            ("CmdOrCtrl+Shift+S", "toggle_window"),
        ];

        for (shortcut, action) in shortcuts {
            self.register_shortcut(app, shortcut, action)?;
        }

        Ok(())
    }

    /// Register a single global shortcut
    fn register_shortcut(
        &self,
        app: &AppHandle,
        shortcut_str: &str,
        action: &str,
    ) -> Result<(), String> {
        let app_handle = app.clone();
        let action_str = action.to_string();

        // Parse the shortcut string
        let shortcut: Shortcut = shortcut_str.parse()
            .map_err(|e| format!("Failed to parse shortcut {}: {:?}", shortcut_str, e))?;
        
        // Register the shortcut with the plugin
        match app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                Self::handle_shortcut_action(&app_handle, &action_str);
            }
        }) {
            Ok(_) => {
                // Store registered shortcut
                if let Ok(mut shortcuts) = self.registered_shortcuts.lock() {
                    shortcuts.push(shortcut_str.to_string());
                }
                println!("✓ Registered global shortcut: {}", shortcut_str);
                Ok(())
            }
            Err(e) => {
                eprintln!("✗ Failed to register shortcut {}: {}", shortcut_str, e);
                Err(format!("Failed to register shortcut {}: {}", shortcut_str, e))
            }
        }
    }

    /// Handle shortcut action
    fn handle_shortcut_action(app: &AppHandle, action: &str) {
        println!("Global shortcut triggered: {}", action);

        match action {
            "toggle_focus_mode" => {
                // Emit event to frontend
                if let Err(e) = app.emit("shortcut:toggle_focus_mode", ()) {
                    eprintln!("Failed to emit toggle_focus_mode event: {}", e);
                }
            }
            "activate_zona_roja" => {
                // Emit event to frontend
                if let Err(e) = app.emit("shortcut:activate_zona_roja", ()) {
                    eprintln!("Failed to emit activate_zona_roja event: {}", e);
                }
            }
            "start_break" => {
                // Emit event to frontend
                if let Err(e) = app.emit("shortcut:start_break", ()) {
                    eprintln!("Failed to emit start_break event: {}", e);
                }
            }
            "toggle_window" => {
                // Show/hide main window
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        if let Err(e) = window.hide() {
                            eprintln!("Failed to hide window: {}", e);
                        }
                    } else {
                        if let Err(e) = window.show() {
                            eprintln!("Failed to show window: {}", e);
                        }
                        if let Err(e) = window.set_focus() {
                            eprintln!("Failed to focus window: {}", e);
                        }
                    }
                }
            }
            _ => {
                eprintln!("Unknown shortcut action: {}", action);
            }
        }
    }

    /// Unregister all shortcuts
    pub fn unregister_all(&self, app: &AppHandle) -> Result<(), String> {
        let shortcuts = self.registered_shortcuts.lock()
            .map_err(|e| format!("Failed to lock shortcuts: {}", e))?;

        for shortcut_str in shortcuts.iter() {
            let shortcut: Shortcut = shortcut_str.parse()
                .map_err(|e| format!("Failed to parse shortcut {}: {:?}", shortcut_str, e))?;
            
            if let Err(e) = app.global_shortcut().unregister(shortcut) {
                eprintln!("Failed to unregister shortcut {}: {}", shortcut_str, e);
            } else {
                println!("✓ Unregistered global shortcut: {}", shortcut_str);
            }
        }

        Ok(())
    }

    /// Check if a shortcut is registered
    pub fn is_registered(&self, app: &AppHandle, shortcut_str: &str) -> bool {
        if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
            app.global_shortcut().is_registered(shortcut)
        } else {
            false
        }
    }

    /// Get list of registered shortcuts
    pub fn get_registered_shortcuts(&self) -> Vec<String> {
        self.registered_shortcuts.lock()
            .map(|shortcuts| shortcuts.clone())
            .unwrap_or_default()
    }
}

impl Default for FelipeGlobalShortcutManager {
    fn default() -> Self {
        Self::new()
    }
}

// Alias for convenience in tests
pub type GlobalShortcutManager = FelipeGlobalShortcutManager;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_manager() {
        let manager = FelipeGlobalShortcutManager::new();
        assert_eq!(manager.get_registered_shortcuts().len(), 0);
    }

    #[test]
    fn test_default_manager() {
        let manager = FelipeGlobalShortcutManager::default();
        assert_eq!(manager.get_registered_shortcuts().len(), 0);
    }
}
