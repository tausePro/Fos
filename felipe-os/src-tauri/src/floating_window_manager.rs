use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, Emitter};
use std::sync::{Arc, Mutex};

/// FloatingWindowManager handles the always-on-top floating window during focus mode
/// 
/// Features:
/// - Always-on-top window that stays above all other windows
/// - Compact design showing session info and quick controls
/// - Position persistence across sessions
/// - Auto-show on focus mode start, auto-hide on focus mode end
pub struct FloatingWindowManager {
    window_position: Arc<Mutex<Option<(i32, i32)>>>,
    is_visible: Arc<Mutex<bool>>,
}

impl FloatingWindowManager {
    pub fn new() -> Self {
        Self {
            window_position: Arc::new(Mutex::new(None)),
            is_visible: Arc::new(Mutex::new(false)),
        }
    }

    /// Create and show the floating window
    pub fn show_floating_window(&self, app: &AppHandle) -> Result<(), String> {
        // Check if window already exists
        if let Some(window) = app.get_webview_window("floating") {
            // Window exists, just show it
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            
            if let Ok(mut visible) = self.is_visible.lock() {
                *visible = true;
            }
            
            return Ok(());
        }

        // Get saved position or use default
        let (x, y) = if let Ok(pos) = self.window_position.lock() {
            pos.unwrap_or((100, 100))
        } else {
            (100, 100)
        };

        // Create new floating window
        let window = WebviewWindowBuilder::new(
            app,
            "floating",
            WebviewUrl::App("/floating".into())
        )
        .title("Felipe OS - Focus Mode")
        .inner_size(300.0, 150.0)
        .min_inner_size(250.0, 120.0)
        .max_inner_size(400.0, 200.0)
        .position(x as f64, y as f64)
        .resizable(true)
        .minimizable(false)
        .maximizable(false)
        .closable(true)
        .skip_taskbar(true)
        .always_on_top(true)
        .decorations(true)
        .transparent(false)
        .build()
        .map_err(|e| format!("Failed to create floating window: {}", e))?;

        // Note: WindowLevel and visual effects are not available in Tauri 2.x API
        // The always_on_top(true) setting above handles the floating behavior

        // Setup window event handlers
        let position_mutex = Arc::clone(&self.window_position);
        let window_clone = window.clone();
        
        window.on_window_event(move |event| {
            match event {
                tauri::WindowEvent::Moved(position) => {
                    // Save position when window is moved
                    if let Ok(mut pos) = position_mutex.lock() {
                        *pos = Some((position.x, position.y));
                        log::debug!("Floating window moved to: ({}, {})", position.x, position.y);
                    }
                }
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Hide instead of close
                    let _ = window_clone.hide();
                    api.prevent_close();
                }
                _ => {}
            }
        });

        if let Ok(mut visible) = self.is_visible.lock() {
            *visible = true;
        }

        log::info!("✓ Floating window created and shown");
        Ok(())
    }

    /// Hide the floating window
    pub fn hide_floating_window(&self, app: &AppHandle) -> Result<(), String> {
        if let Some(window) = app.get_webview_window("floating") {
            window.hide().map_err(|e| e.to_string())?;
            
            if let Ok(mut visible) = self.is_visible.lock() {
                *visible = false;
            }
            
            log::info!("✓ Floating window hidden");
        }
        Ok(())
    }

    /// Destroy the floating window completely
    pub fn destroy_floating_window(&self, app: &AppHandle) -> Result<(), String> {
        if let Some(window) = app.get_webview_window("floating") {
            window.close().map_err(|e| e.to_string())?;
            
            if let Ok(mut visible) = self.is_visible.lock() {
                *visible = false;
            }
            
            log::info!("✓ Floating window destroyed");
        }
        Ok(())
    }

    /// Check if floating window is visible
    pub fn is_visible(&self) -> bool {
        self.is_visible.lock()
            .map(|visible| *visible)
            .unwrap_or(false)
    }

    /// Get saved window position
    pub fn get_position(&self) -> Option<(i32, i32)> {
        self.window_position.lock()
            .ok()
            .and_then(|pos| *pos)
    }

    /// Set window position (for restoration)
    pub fn set_position(&self, x: i32, y: i32) {
        if let Ok(mut pos) = self.window_position.lock() {
            *pos = Some((x, y));
        }
    }

    /// Update floating window content (send event to frontend)
    pub fn update_content(&self, app: &AppHandle, data: FloatingWindowData) -> Result<(), String> {
        if let Some(window) = app.get_webview_window("floating") {
            window.emit("floating:update", data)
                .map_err(|e| format!("Failed to emit update event: {}", e))?;
        }
        Ok(())
    }
}

impl Default for FloatingWindowManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Data structure for floating window content updates
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FloatingWindowData {
    pub session_type: String,
    pub time_remaining: u32,
    pub progress_percent: f32,
    pub is_zona_roja: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_manager() {
        let manager = FloatingWindowManager::new();
        assert!(!manager.is_visible());
        assert_eq!(manager.get_position(), None);
    }

    #[test]
    fn test_default_manager() {
        let manager = FloatingWindowManager::default();
        assert!(!manager.is_visible());
        assert_eq!(manager.get_position(), None);
    }

    #[test]
    fn test_set_position() {
        let manager = FloatingWindowManager::new();
        manager.set_position(200, 300);
        assert_eq!(manager.get_position(), Some((200, 300)));
    }

    #[test]
    fn test_floating_window_data_serialization() {
        let data = FloatingWindowData {
            session_type: "Focus".to_string(),
            time_remaining: 1500,
            progress_percent: 50.0,
            is_zona_roja: false,
        };

        let serialized = serde_json::to_string(&data).unwrap();
        let deserialized: FloatingWindowData = serde_json::from_str(&serialized).unwrap();

        assert_eq!(data.session_type, deserialized.session_type);
        assert_eq!(data.time_remaining, deserialized.time_remaining);
        assert_eq!(data.progress_percent, deserialized.progress_percent);
        assert_eq!(data.is_zona_roja, deserialized.is_zona_roja);
    }
}
