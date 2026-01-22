# Requirements Document

## Introduction

Felipe OS - App Nativa macOS (Fase 2) es la evolución del MVP web existente hacia una aplicación nativa de macOS usando Tauri. Esta fase mantiene toda la funcionalidad core del MVP web mientras agrega características nativas que aprovechan las capacidades del sistema operativo macOS para mejorar la experiencia del usuario y la integración con el workflow diario.

## Glossary

- **Felipe_OS**: El sistema completo de productividad y focus management
- **Tauri_App**: La aplicación nativa de macOS construida con Tauri
- **Menu_Bar**: La barra de menú superior de macOS donde reside el icono persistente
- **Focus_Mode**: Estado activo de trabajo con bloqueos y restricciones habilitadas
- **Zone_Roja**: Período crítico de alta concentración sin interrupciones
- **MVP_Web**: La versión web funcional existente (v0.0.2)
- **Native_APIs**: APIs específicas de macOS para funcionalidades del sistema
- **Auto_Launch**: Funcionalidad de inicio automático con el sistema operativo
- **Floating_Window**: Ventana compacta siempre visible durante focus mode
- **Global_Shortcuts**: Atajos de teclado que funcionan desde cualquier aplicación

## Requirements

### Requirement 1: Migración a Tauri

**User Story:** Como Felipe, quiero que mi app web se convierta en una aplicación nativa de macOS, para que pueda distribuirla e instalarla como cualquier otra app nativa.

#### Acceptance Criteria

1. WHEN the Tauri app is built, THE Tauri_App SHALL package the existing Nuxt 3 frontend into a native macOS bundle
2. WHEN the app is installed, THE Tauri_App SHALL create a .app bundle compatible with macOS 12+ (Monterey and superior)
3. WHEN the app launches, THE Tauri_App SHALL display the same UI and functionality as the MVP_Web
4. WHEN users interact with the app, THE Tauri_App SHALL maintain all existing features from the web version
5. WHERE distribution is needed, THE Tauri_App SHALL be signable and notarizable for macOS App Store or direct distribution

### Requirement 2: Menu Bar Integration

**User Story:** Como Felipe, quiero un icono persistente en la barra de menú de macOS, para que pueda acceder rápidamente a Felipe OS desde cualquier lugar del sistema.

#### Acceptance Criteria

1. WHEN the app launches, THE Menu_Bar SHALL display a Felipe OS icon that remains visible at all times
2. WHEN the menu bar icon is clicked, THE Tauri_App SHALL show a dropdown menu with quick actions
3. WHEN the main window is closed, THE Tauri_App SHALL continue running in the background with only the menu bar icon visible
4. WHEN "Quit" is selected from the menu, THE Tauri_App SHALL terminate completely
5. WHERE focus mode is active, THE Menu_Bar SHALL indicate the current status visually

### Requirement 3: Notificaciones Nativas

**User Story:** Como Felipe, quiero recibir notificaciones nativas del sistema, para que esté informado sobre bloques, zona roja y otros eventos importantes sin tener que revisar la app constantemente.

#### Acceptance Criteria

1. WHEN a focus block starts, THE Native_APIs SHALL send a system notification with block details
2. WHEN zona roja is activated, THE Native_APIs SHALL send a high-priority notification with appropriate styling
3. WHEN a focus session ends, THE Native_APIs SHALL send a completion notification with session summary
4. WHEN break time begins, THE Native_APIs SHALL send a gentle reminder notification
5. WHERE notification permissions are required, THE Tauri_App SHALL request and handle user authorization properly

### Requirement 4: Shortcuts de Teclado Globales

**User Story:** Como Felipe, quiero usar atajos de teclado globales, para que pueda controlar Felipe OS desde cualquier aplicación sin cambiar el foco.

#### Acceptance Criteria

1. WHEN Cmd+Shift+F is pressed globally, THE Global_Shortcuts SHALL toggle focus mode on/off
2. WHEN Cmd+Shift+Z is pressed globally, THE Global_Shortcuts SHALL activate zona roja immediately
3. WHEN Cmd+Shift+B is pressed globally, THE Global_Shortcuts SHALL start a break session
4. WHEN Cmd+Shift+S is pressed globally, THE Global_Shortcuts SHALL show/hide the main window
5. WHERE shortcuts conflict with other apps, THE Tauri_App SHALL handle conflicts gracefully and allow customization

### Requirement 5: Ventana Flotante

**User Story:** Como Felipe, quiero una ventana flotante compacta durante focus mode, para que pueda ver el progreso y controles esenciales sin ocupar mucho espacio en pantalla.

#### Acceptance Criteria

1. WHEN focus mode is activated, THE Floating_Window SHALL appear as a small, always-on-top window
2. WHEN the floating window is displayed, THE Floating_Window SHALL show current session time, progress, and quick controls
3. WHEN the user drags the floating window, THE Floating_Window SHALL remember its position for future sessions
4. WHEN focus mode ends, THE Floating_Window SHALL automatically hide
5. WHERE the floating window overlaps with work, THE Floating_Window SHALL be easily dismissible but remain accessible

### Requirement 6: Auto-launch

**User Story:** Como Felipe, quiero que la app inicie automáticamente con macOS, para que Felipe OS esté siempre disponible sin intervención manual.

#### Acceptance Criteria

1. WHEN the app is first launched, THE Auto_Launch SHALL offer to enable automatic startup
2. WHEN auto-launch is enabled, THE Tauri_App SHALL start automatically when macOS boots
3. WHEN starting automatically, THE Tauri_App SHALL launch minimized to menu bar without showing the main window
4. WHEN auto-launch is disabled in settings, THE Tauri_App SHALL remove itself from startup items
5. WHERE system permissions are required, THE Auto_Launch SHALL handle authorization requests properly

### Requirement 7: Sincronización de Datos

**User Story:** Como Felipe, quiero que mis datos se mantengan sincronizados entre la versión web y nativa, para que pueda usar ambas versiones sin perder información.

#### Acceptance Criteria

1. WHEN data is modified in the native app, THE Tauri_App SHALL sync changes to the same storage backend as the web version
2. WHEN the web version is used simultaneously, THE Tauri_App SHALL detect and handle concurrent data modifications
3. WHEN the app starts, THE Tauri_App SHALL load the most recent data from the shared storage
4. WHEN network connectivity is lost, THE Tauri_App SHALL queue changes for sync when connection is restored
5. WHERE data conflicts occur, THE Tauri_App SHALL resolve conflicts using last-write-wins or user intervention

### Requirement 8: Integración con Sistema macOS

**User Story:** Como Felipe, quiero que la app use las APIs nativas de macOS cuando sea posible, para que se sienta como una aplicación verdaderamente nativa del sistema.

#### Acceptance Criteria

1. WHEN displaying notifications, THE Native_APIs SHALL use macOS Notification Center with proper styling and actions
2. WHEN managing focus mode, THE Native_APIs SHALL integrate with macOS Do Not Disturb when available
3. WHEN the app needs system permissions, THE Native_APIs SHALL use standard macOS permission dialogs
4. WHEN handling files or data, THE Native_APIs SHALL respect macOS security and privacy guidelines
5. WHERE appropriate, THE Native_APIs SHALL use macOS-specific UI patterns and behaviors

### Requirement 9: Rendimiento y Recursos

**User Story:** Como Felipe, quiero que la app nativa sea eficiente en recursos, para que no impacte negativamente el rendimiento de mi Mac durante uso prolongado.

#### Acceptance Criteria

1. WHEN running in background, THE Tauri_App SHALL consume minimal CPU and memory resources
2. WHEN the main window is hidden, THE Tauri_App SHALL reduce resource usage to essential background tasks only
3. WHEN focus mode is active, THE Tauri_App SHALL prioritize performance for timing accuracy
4. WHEN the system is under load, THE Tauri_App SHALL gracefully reduce non-essential operations
5. WHERE memory usage exceeds reasonable limits, THE Tauri_App SHALL implement cleanup and optimization strategies

### Requirement 10: Configuración y Personalización

**User Story:** Como Felipe, quiero poder configurar aspectos específicos de la app nativa, para que se adapte a mis preferencias de workflow y sistema.

#### Acceptance Criteria

1. WHEN accessing settings, THE Tauri_App SHALL provide native-specific configuration options
2. WHEN customizing shortcuts, THE Tauri_App SHALL allow modification of all global keyboard shortcuts
3. WHEN configuring notifications, THE Tauri_App SHALL respect system notification preferences
4. WHEN setting up auto-launch, THE Tauri_App SHALL provide clear enable/disable options
5. WHERE settings are changed, THE Tauri_App SHALL apply changes immediately without requiring restart