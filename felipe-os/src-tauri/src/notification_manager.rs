use tauri::{AppHandle, Manager, Emitter};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum NotificationPriority {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum NotificationType {
    FocusStart,
    FocusComplete,
    ZonaRoja,
    BreakTime,
    SessionOverdue,
    DayComplete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationConfig {
    pub title: String,
    pub body: String,
    pub priority: NotificationPriority,
    pub sound: Option<String>,
    pub actions: Vec<String>,
}

#[derive(Clone)]
pub struct NotificationManager {
    app_handle: AppHandle,
    permissions_granted: bool,
    notification_configs: HashMap<NotificationType, NotificationConfig>,
}

impl NotificationManager {
    pub fn new(app_handle: AppHandle) -> Self {
        let mut manager = Self {
            app_handle,
            permissions_granted: false,
            notification_configs: HashMap::new(),
        };
        
        manager.setup_default_configs();
        manager
    }

    pub async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Inicializando Notification Manager...");
        
        // Solicitar permisos de notificación
        self.request_permissions().await?;
        
        log::info!("Notification Manager inicializado correctamente");
        Ok(())
    }

    async fn request_permissions(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Solicitando permisos de notificación...");
        
        // En macOS, Tauri maneja automáticamente los permisos de notificación
        // cuando se envía la primera notificación
        self.permissions_granted = true;
        
        log::info!("Permisos de notificación configurados");
        Ok(())
    }

    fn setup_default_configs(&mut self) {
        // Configuraciones por defecto para cada tipo de notificación
        
        self.notification_configs.insert(
            NotificationType::FocusStart,
            NotificationConfig {
                title: "Felipe OS - Modo Enfoque".to_string(),
                body: "Sesión de enfoque iniciada. ¡A trabajar!".to_string(),
                priority: NotificationPriority::Normal,
                sound: Some("default".to_string()),
                actions: vec!["Pausar".to_string(), "Detener".to_string()],
            }
        );

        self.notification_configs.insert(
            NotificationType::FocusComplete,
            NotificationConfig {
                title: "Felipe OS - Sesión Completada".to_string(),
                body: "¡Excelente trabajo! Sesión de enfoque completada.".to_string(),
                priority: NotificationPriority::High,
                sound: Some("success".to_string()),
                actions: vec!["Siguiente Bloque".to_string(), "Tomar Descanso".to_string()],
            }
        );

        self.notification_configs.insert(
            NotificationType::ZonaRoja,
            NotificationConfig {
                title: "Felipe OS - Zona Roja Activa".to_string(),
                body: "Estás en zona roja. Modo celular activado.".to_string(),
                priority: NotificationPriority::Critical,
                sound: Some("alert".to_string()),
                actions: vec!["Entendido".to_string()],
            }
        );

        self.notification_configs.insert(
            NotificationType::BreakTime,
            NotificationConfig {
                title: "Felipe OS - Hora del Descanso".to_string(),
                body: "Es momento de tomar un descanso. Relájate un poco.".to_string(),
                priority: NotificationPriority::Normal,
                sound: Some("gentle".to_string()),
                actions: vec!["Continuar Trabajando".to_string(), "Tomar Descanso".to_string()],
            }
        );

        self.notification_configs.insert(
            NotificationType::SessionOverdue,
            NotificationConfig {
                title: "Felipe OS - Sesión Extendida".to_string(),
                body: "Tu sesión se ha extendido más de lo planeado.".to_string(),
                priority: NotificationPriority::High,
                sound: Some("warning".to_string()),
                actions: vec!["Finalizar Ahora".to_string(), "5 min más".to_string()],
            }
        );

        self.notification_configs.insert(
            NotificationType::DayComplete,
            NotificationConfig {
                title: "Felipe OS - Día Completado".to_string(),
                body: "¡Felicitaciones! Has completado todos tus bloques del día.".to_string(),
                priority: NotificationPriority::High,
                sound: Some("celebration".to_string()),
                actions: vec!["Ver Resumen".to_string()],
            }
        );
    }

    pub async fn send_notification(
        &self,
        notification_type: NotificationType,
        custom_body: Option<String>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if !self.permissions_granted {
            log::warn!("Permisos de notificación no otorgados");
            return Ok(());
        }

        let config = self.notification_configs.get(&notification_type)
            .ok_or("Configuración de notificación no encontrada")?;

        let body = custom_body.unwrap_or_else(|| config.body.clone());

        log::info!("Enviando notificación: {:?}", notification_type);

        // Usar el plugin de notificaciones de Tauri
        self.send_native_notification(&config.title, &body, &config.priority).await?;

        // Emitir evento al frontend para sincronización
        self.app_handle.emit("notification-sent", &notification_type)?;

        Ok(())
    }

    async fn send_native_notification(
        &self,
        title: &str,
        body: &str,
        priority: &NotificationPriority,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Usar el plugin de notificaciones de Tauri
        use tauri_plugin_notification::NotificationExt;
        
        let priority_str = match priority {
            NotificationPriority::Low => "Baja",
            NotificationPriority::Normal => "Normal", 
            NotificationPriority::High => "Alta",
            NotificationPriority::Critical => "Crítica",
        };

        log::info!("📱 NOTIFICACIÓN [{}]: {} - {}", priority_str, title, body);

        // Enviar notificación nativa usando el plugin de Tauri
        log::info!("Intentando enviar notificación nativa...");
        match self.app_handle.notification()
            .builder()
            .title(title)
            .body(body)
            .show() {
            Ok(_) => {
                log::info!("✅ Notificación nativa enviada exitosamente");
            }
            Err(e) => {
                log::error!("❌ Error enviando notificación nativa: {}", e);
                
                // Fallback: emitir al frontend para mostrar notificación web
                log::info!("Enviando fallback al frontend...");
                self.app_handle.emit("show-web-notification", serde_json::json!({
                    "title": title,
                    "body": body,
                    "priority": priority
                }))?;
            }
        }

        Ok(())
    }

    pub fn update_notification_config(
        &mut self,
        notification_type: NotificationType,
        config: NotificationConfig,
    ) {
        log::info!("Configuración de notificación actualizada: {:?}", notification_type);
        self.notification_configs.insert(notification_type, config);
    }

    pub fn get_notification_config(&self, notification_type: &NotificationType) -> Option<&NotificationConfig> {
        self.notification_configs.get(notification_type)
    }

    pub fn is_permissions_granted(&self) -> bool {
        self.permissions_granted
    }

    // Métodos de conveniencia para tipos específicos de notificación
    pub async fn notify_focus_start(&self, block_name: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        let custom_body = block_name.map(|name| format!("Iniciando enfoque en: {}", name));
        self.send_notification(NotificationType::FocusStart, custom_body).await
    }

    pub async fn notify_focus_complete(&self, duration_minutes: u32) -> Result<(), Box<dyn std::error::Error>> {
        let custom_body = Some(format!("Sesión completada en {} minutos. ¡Excelente trabajo!", duration_minutes));
        self.send_notification(NotificationType::FocusComplete, custom_body).await
    }

    pub async fn notify_zona_roja(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.send_notification(NotificationType::ZonaRoja, None).await
    }

    pub async fn notify_break_time(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.send_notification(NotificationType::BreakTime, None).await
    }

    pub async fn notify_session_overdue(&self, overdue_minutes: u32) -> Result<(), Box<dyn std::error::Error>> {
        let custom_body = Some(format!("Tu sesión se ha extendido {} minutos más de lo planeado.", overdue_minutes));
        self.send_notification(NotificationType::SessionOverdue, custom_body).await
    }

    pub async fn notify_day_complete(&self, blocks_completed: u32) -> Result<(), Box<dyn std::error::Error>> {
        let custom_body = Some(format!("¡Día completado! {} bloques realizados exitosamente.", blocks_completed));
        self.send_notification(NotificationType::DayComplete, custom_body).await
    }
}

// Comandos Tauri para interactuar con las notificaciones desde el frontend
#[tauri::command]
pub async fn send_notification_command(
    app: tauri::AppHandle,
    notification_type: String,
    custom_body: Option<String>,
) -> Result<(), String> {
    log::info!("Comando send_notification recibido: {}", notification_type);

    let notification_type = match notification_type.as_str() {
        "focus_start" => NotificationType::FocusStart,
        "focus_complete" => NotificationType::FocusComplete,
        "zona_roja" => NotificationType::ZonaRoja,
        "break_time" => NotificationType::BreakTime,
        "session_overdue" => NotificationType::SessionOverdue,
        "day_complete" => NotificationType::DayComplete,
        _ => return Err("Tipo de notificación no válido".to_string()),
    };

    // Obtener el notification manager del estado de la app
    if let Some(notification_manager_mutex) = app.try_state::<std::sync::Arc<std::sync::Mutex<NotificationManager>>>() {
        // Clonar los datos necesarios antes del await
        let notification_manager = {
            let manager = notification_manager_mutex.lock().map_err(|e| e.to_string())?;
            // Crear una copia de los datos necesarios para evitar problemas de concurrencia
            manager.clone()
        };
        
        // Ahora podemos usar await sin problemas de concurrencia
        notification_manager.send_notification(notification_type, custom_body).await.map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn test_notification(app: tauri::AppHandle) -> Result<(), String> {
    log::info!("Comando test_notification recibido");

    if let Some(notification_manager_mutex) = app.try_state::<std::sync::Arc<std::sync::Mutex<NotificationManager>>>() {
        let notification_manager = {
            let manager = notification_manager_mutex.lock().map_err(|e| e.to_string())?;
            manager.clone()
        };
        
        notification_manager.send_notification(NotificationType::FocusStart, Some("Prueba de notificación - ¡Funciona!".to_string())).await.map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn request_notification_permissions(app: tauri::AppHandle) -> Result<bool, String> {
    log::info!("Comando request_notification_permissions recibido");

    if let Some(notification_manager_mutex) = app.try_state::<std::sync::Arc<std::sync::Mutex<NotificationManager>>>() {
        // Clonar el manager para evitar problemas de concurrencia
        let mut notification_manager = {
            let manager = notification_manager_mutex.lock().map_err(|e| e.to_string())?;
            manager.clone()
        };
        
        notification_manager.request_permissions().await.map_err(|e| e.to_string())?;
        
        // Actualizar el estado en el mutex
        {
            let mut manager = notification_manager_mutex.lock().map_err(|e| e.to_string())?;
            *manager = notification_manager.clone();
        }
        
        return Ok(notification_manager.is_permissions_granted());
    }

    Ok(false)
}