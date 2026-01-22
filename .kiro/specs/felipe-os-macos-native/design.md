# Design Document: Felipe OS Phase 2 - macOS Native App

## Overview

Felipe OS Phase 2 transforms the existing Nuxt 3 web application into a native macOS application using Tauri framework. This design maintains the complete existing frontend while adding a Rust-based backend that provides native macOS capabilities including menu bar integration, system notifications, global shortcuts, and enhanced data persistence with SQLite.

The architecture follows a hybrid approach where the proven Nuxt 3 frontend remains unchanged, ensuring UI consistency and reducing migration risk. The Tauri runtime provides a bridge between the web frontend and native macOS APIs, enabling deep system integration while maintaining the familiar user experience from Phase 1.

Key design principles include maintaining UI/UX consistency with Phase 1, implementing robust timer systems to address current reliability issues, providing seamless data migration from LocalStorage to SQLite, and establishing a foundation for future synchronization capabilities.

## Architecture

### Technology Stack

**Application Framework**: Tauri 1.5+ with Rust backend and Nuxt 3 frontend
- Tauri provides native macOS integration with minimal resource footprint
- Rust backend handles system APIs, database operations, and timer management
- Existing Nuxt 3 frontend preserved without modification
- WebView2 engine for rendering with native performance

**Backend Technologies**:
- **Rust**: Core application logic and system integration
- **SQLite**: Local database with sqlx for type-safe queries
- **tokio**: Async runtime for timer management and background tasks
- **serde**: JSON serialization for frontend-backend communication
- **tauri-plugin-notification**: Native macOS notifications
- **tauri-plugin-global-shortcut**: System-wide keyboard shortcuts

**Frontend Technologies** (unchanged from Phase 1):
- **Nuxt 3**: Vue 3 composition API with SSR disabled
- **Tailwind CSS**: Styling and responsive design
- **Pinia**: State management with enhanced persistence
- **VueUse**: Utility composables

**Data Layer**:
- **SQLite Database**: Replaces LocalStorage for improved reliability
- **Migration System**: Automatic LocalStorage to SQLite conversion
- **Backup System**: Daily automated backups with rotation
- **Sync Preparation**: UUID-based records for future multi-device support

### Application Architecture

```
Felipe OS Native Architecture

┌─────────────────────────────────────────────────────────────┐
│                    macOS System Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Menu Bar  │  Notifications  │  Global Shortcuts  │  Focus  │
├─────────────────────────────────────────────────────────────┤
│                     Tauri Runtime                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Rust Backend  │  │  Timer Service  │  │  DB Service  │ │
│  │                 │  │                 │  │              │ │
│  │ • System APIs   │  │ • High-precision│  │ • SQLite     │ │
│  │ • Menu Bar      │  │ • State persist │  │ • Migration  │ │
│  │ • Notifications │  │ • Recovery      │  │ • Backups    │ │
│  │ • Shortcuts     │  │ • Sync display  │  │ • Sync prep  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Tauri Bridge (IPC)                       │
├─────────────────────────────────────────────────────────────┤
│                   Nuxt 3 Frontend                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Pages       │  │   Components    │  │    Stores    │ │
│  │                 │  │                 │  │              │ │
│  │ • index.vue     │  │ • BlockEditor   │  │ • blocks     │ │
│  │ • week.vue      │  │ • BlockTimer    │  │ • focus      │ │
│  │ • stats.vue     │  │ • FloatingWin   │  │ • settings   │ │
│  │ • review.vue    │  │ • MenuBar       │  │ • analytics  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Tauri Command Interface

**Core Commands**:
```rust
// Database Operations
#[tauri::command]
async fn get_blocks(date: String) -> Result<Vec<Block>, String>

#[tauri::command]
async fn save_block(block: Block) -> Result<String, String>

#[tauri::command]
async fn delete_block(id: String) -> Result<(), String>

// Timer Management
#[tauri::command]
async fn start_timer(block_id: String) -> Result<TimerState, String>

#[tauri::command]
async fn stop_timer() -> Result<TimerState, String>

#[tauri::command]
async fn get_timer_state() -> Result<TimerState, String>

// System Integration
#[tauri::command]
async fn show_notification(title: String, body: String) -> Result<(), String>

#[tauri::command]
async fn set_menu_bar_status(status: String) -> Result<(), String>

#[tauri::command]
async fn toggle_floating_window() -> Result<(), String>

// Data Migration
#[tauri::command]
async fn migrate_localstorage_data(data: String) -> Result<(), String>

#[tauri::command]
async fn export_data() -> Result<String, String>

#[tauri::command]
async fn import_data(data: String) -> Result<(), String>
```

## Components and Interfaces

### Enhanced Data Models

**Block Model** (extended from Phase 1):
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct Block {
    pub id: String,           // UUID for sync compatibility
    pub date: String,         // YYYY-MM-DD format
    pub start_time: String,   // HH:MM format (24h)
    pub end_time: String,     // HH:MM format (24h)
    pub category: Category,
    pub description: String,  // Max 50 characters
    pub completed: bool,
    pub actual_start_time: Option<String>,
    pub actual_end_time: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: i32,         // For conflict resolution
}

#[derive(Serialize, Deserialize, Clone)]
pub enum Category {
    LandingChat,
    Estudio,
    Tause,
    Otro,
}
```

**Timer State Model**:
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct TimerState {
    pub is_active: bool,
    pub current_block_id: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub elapsed_seconds: u64,
    pub total_seconds: u64,
    pub progress_percentage: f64,
    pub status: TimerStatus,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum TimerStatus {
    Stopped,
    Running,
    Paused,
    Completed,
}
```

**Settings Model**:
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub notifications_enabled: bool,
    pub notification_types: NotificationSettings,
    pub global_shortcuts: ShortcutSettings,
    pub window_preferences: WindowSettings,
    pub work_hours: WorkHoursSettings,
    pub floating_window_enabled: bool,
    pub menu_bar_always_visible: bool,
}
```

### Native macOS Integration Components

**Menu Bar Manager**:
```rust
pub struct MenuBarManager {
    tray: SystemTray,
    menu: SystemTrayMenu,
    app_handle: AppHandle,
}

impl MenuBarManager {
    pub fn new(app_handle: AppHandle) -> Self
    pub fn update_status(&mut self, status: &str)
    pub fn update_timer_display(&mut self, timer_state: &TimerState)
    pub fn show_quick_actions_menu(&mut self)
}
```

**Notification Service**:
```rust
pub struct NotificationService {
    app_handle: AppHandle,
    settings: NotificationSettings,
}

impl NotificationService {
    pub async fn send_block_reminder(&self, block: &Block)
    pub async fn send_block_end_notification(&self, block: &Block)
    pub async fn send_review_reminder(&self)
    pub fn check_do_not_disturb_status(&self) -> bool
}
```

**Global Shortcut Manager**:
```rust
pub struct ShortcutManager {
    shortcuts: HashMap<String, GlobalShortcut>,
    app_handle: AppHandle,
}

impl ShortcutManager {
    pub fn register_shortcuts(&mut self) -> Result<(), String>
    pub fn update_shortcut(&mut self, key: &str, shortcut: &str) -> Result<(), String>
    pub fn handle_shortcut_activation(&self, shortcut_id: &str)
}
```

### Enhanced Frontend Components

**Floating Window Component**:
```vue
<template>
  <div class="floating-window" v-if="isVisible">
    <div class="timer-display">
      <h3>{{ currentBlock?.description || 'No Active Block' }}</h3>
      <div class="time-remaining">{{ formattedTimeRemaining }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>
    <div class="controls">
      <button @click="toggleTimer">{{ timerRunning ? 'Pause' : 'Start' }}</button>
      <button @click="openMainWindow">Open</button>
    </div>
  </div>
</template>
```

**Enhanced Timer Component**:
```vue
<template>
  <div class="timer-component">
    <div class="timer-display">
      <div class="time-remaining">{{ formattedTime }}</div>
      <div class="progress-circle">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" :stroke-dasharray="circumference" 
                  :stroke-dashoffset="progressOffset" />
        </svg>
      </div>
    </div>
    <div class="timer-controls">
      <button @click="startTimer" :disabled="!canStart">Start</button>
      <button @click="pauseTimer" :disabled="!canPause">Pause</button>
      <button @click="stopTimer" :disabled="!canStop">Stop</button>
    </div>
    <div class="timer-status">
      <span class="status-indicator" :class="statusClass"></span>
      {{ statusText }}
    </div>
  </div>
</template>
```

### Database Schema Design

**SQLite Schema**:
```sql
-- Blocks table
CREATE TABLE blocks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_start_time TEXT,
    actual_end_time TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1
);

-- Daily priorities table
CREATE TABLE daily_priorities (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    focus_rating INTEGER NOT NULL,
    energy_rating INTEGER NOT NULL,
    completed_blocks INTEGER NOT NULL,
    total_blocks INTEGER NOT NULL,
    reflection_notes TEXT,
    improvements TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Timer sessions table (for analytics)
CREATE TABLE timer_sessions (
    id TEXT PRIMARY KEY,
    block_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_seconds INTEGER,
    was_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_id) REFERENCES blocks (id)
);

-- App settings table
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration tracking
CREATE TABLE migrations (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Data Models

### Enhanced State Management

**Pinia Store Integration with Tauri**:
```typescript
// Enhanced blocks store with Tauri integration
export const useBlocksStore = defineStore('blocks', () => {
  const blocks = ref<Block[]>([])
  const isLoading = ref(false)
  
  // Load blocks from native database
  const loadBlocks = async (date: string) => {
    isLoading.value = true
    try {
      const result = await invoke('get_blocks', { date })
      blocks.value = result
    } catch (error) {
      console.error('Failed to load blocks:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Save block to native database
  const saveBlock = async (block: Block) => {
    try {
      const result = await invoke('save_block', { block })
      await loadBlocks(block.date) // Refresh local state
      return result
    } catch (error) {
      console.error('Failed to save block:', error)
      throw error
    }
  }
  
  return {
    blocks: readonly(blocks),
    isLoading: readonly(isLoading),
    loadBlocks,
    saveBlock,
    // ... other methods
  }
})
```

**Timer Store with Native Integration**:
```typescript
export const useTimerStore = defineStore('timer', () => {
  const timerState = ref<TimerState | null>(null)
  const isActive = computed(() => timerState.value?.is_active ?? false)
  
  // Start timer with native backend
  const startTimer = async (blockId: string) => {
    try {
      const result = await invoke('start_timer', { blockId })
      timerState.value = result
      
      // Start frontend timer sync
      startTimerSync()
    } catch (error) {
      console.error('Failed to start timer:', error)
      throw error
    }
  }
  
  // Sync timer state every second
  const startTimerSync = () => {
    const interval = setInterval(async () => {
      if (!isActive.value) {
        clearInterval(interval)
        return
      }
      
      try {
        const result = await invoke('get_timer_state')
        timerState.value = result
      } catch (error) {
        console.error('Timer sync failed:', error)
      }
    }, 1000)
  }
  
  return {
    timerState: readonly(timerState),
    isActive,
    startTimer,
    // ... other methods
  }
})
```

### Data Migration System

**LocalStorage Migration**:
```rust
pub struct DataMigrator {
    db: SqlitePool,
}

impl DataMigrator {
    pub async fn migrate_from_localstorage(&self, data: &str) -> Result<(), MigrationError> {
        let legacy_data: LegacyData = serde_json::from_str(data)?;
        
        // Migrate blocks
        for block in legacy_data.blocks {
            let new_block = Block {
                id: Uuid::new_v4().to_string(),
                date: block.date,
                start_time: block.start_time,
                end_time: block.end_time,
                category: block.category,
                description: block.description,
                completed: block.completed,
                actual_start_time: block.actual_start_time,
                actual_end_time: block.actual_end_time,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                version: 1,
            };
            
            self.save_block(&new_block).await?;
        }
        
        // Migrate priorities and reviews similarly...
        
        Ok(())
    }
}
```

Now I need to use the prework tool to analyze the acceptance criteria before writing the correctness properties section.

<function_calls>
<invoke name="prework">
<parameter name="featureName">felipe-os-macos-native

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, here are the key correctness properties for Felipe OS macOS Native:

### UI Consistency and Migration Properties

**Property 1: Frontend Functionality Preservation**
*For any* existing Felipe OS Phase 1 functionality, the native app should maintain identical behavior and user interface elements.
**Validates: Requirements 1.2, 12.2**

**Property 2: Data Migration Round Trip**
*For any* LocalStorage data from Phase 1, migrating to SQLite and then exporting should produce equivalent data structures with all information preserved.
**Validates: Requirements 5.2, 12.1**

**Property 3: Settings Migration Accuracy**
*For any* user preference or setting from Phase 1, the migration process should preserve the setting value and make it available in the native app.
**Validates: Requirements 12.4**

### Timer System Properties

**Property 4: Timer Accuracy Over Time**
*For any* timer session lasting up to 2 hours, the displayed time should remain accurate within 1 second of the actual elapsed time.
**Validates: Requirements 14.2, 7.3**

**Property 5: Timer State Persistence**
*For any* active timer, if the application crashes or is force-quit, restarting should restore the timer state with accurate remaining time.
**Validates: Requirements 7.11, 14.5**

**Property 6: System Event Timer Handling**
*For any* system sleep/wake event during an active timer, the timer should pause during sleep and resume accurately upon wake.
**Validates: Requirements 6.3, 14.3**

**Property 7: Multi-Component Timer Synchronization**
*For any* timer update, all UI components (main window, floating window, menu bar) should display identical time values simultaneously.
**Validates: Requirements 14.11, 7.2**

### Menu Bar Integration Properties

**Property 8: Menu Bar Status Accuracy**
*For any* application state change (active block, completion progress, focus mode), the menu bar should reflect the current state accurately.
**Validates: Requirements 2.3, 2.4, 2.7**

**Property 9: Menu Bar Action Consistency**
*For any* action available in the main application, equivalent functionality should be accessible through the menu bar when appropriate.
**Validates: Requirements 2.6**

### Notification System Properties

**Property 10: Notification Timing Accuracy**
*For any* scheduled block, notifications should be sent exactly 5 minutes before start time and at the scheduled end time.
**Validates: Requirements 3.1, 3.2**

**Property 11: Do Not Disturb Respect**
*For any* notification, if macOS Do Not Disturb is active, the notification should be suppressed and queued for later delivery.
**Validates: Requirements 3.4, 6.1**

**Property 12: Notification Action Functionality**
*For any* notification with action buttons, clicking an action should perform the expected operation and update the application state accordingly.
**Validates: Requirements 3.6, 3.8**

### Global Shortcuts Properties

**Property 13: Global Shortcut Reliability**
*For any* registered global shortcut, the shortcut should work regardless of which application currently has focus.
**Validates: Requirements 4.7**

**Property 14: Shortcut Customization Persistence**
*For any* customized keyboard shortcut, the custom mapping should persist across application restarts and system reboots.
**Validates: Requirements 4.5**

**Property 15: Shortcut Conflict Handling**
*For any* shortcut conflict with system or other applications, the app should detect the conflict and notify the user with alternative options.
**Validates: Requirements 4.6**

### Data Persistence Properties

**Property 16: SQLite Data Integrity**
*For any* data operation (create, update, delete), the SQLite database should maintain referential integrity and prevent data corruption.
**Validates: Requirements 5.7**

**Property 17: Backup System Reliability**
*For any* day of operation, the system should create a daily backup that can be used to restore all user data accurately.
**Validates: Requirements 5.4**

**Property 18: Export/Import Round Trip**
*For any* complete dataset, exporting to JSON and then importing should restore all data with identical values and relationships.
**Validates: Requirements 5.5, 5.6**

### Window Management Properties

**Property 19: Window State Persistence**
*For any* window configuration (size, position, display preferences), the settings should persist across application restarts and system reboots.
**Validates: Requirements 8.2, 7.7**

**Property 20: Floating Window Behavior**
*For any* floating window interaction, the window should remain on top of other applications and display accurate timer information.
**Validates: Requirements 7.5, 7.2**

**Property 21: Multi-Monitor Support**
*For any* multi-monitor setup, windows should position correctly on the intended display and handle monitor configuration changes gracefully.
**Validates: Requirements 8.6**

### System Integration Properties

**Property 22: macOS Appearance Adaptation**
*For any* macOS appearance change (light/dark mode), the application should adapt its theme immediately without requiring restart.
**Validates: Requirements 6.4**

**Property 23: Focus Mode Integration**
*For any* macOS Focus mode activation, the application should adjust its notification behavior according to the Focus mode settings.
**Validates: Requirements 6.2**

**Property 24: Calendar Integration Accuracy**
*For any* calendar event detected, the system should suggest block timing that avoids conflicts with existing calendar entries.
**Validates: Requirements 6.5**

### Performance Properties

**Property 25: Resource Usage Limits**
*For any* normal operation period, the application should use less than 50MB RAM and less than 1% CPU when idle.
**Validates: Requirements 9.1, 9.2**

**Property 26: Startup Performance**
*For any* application launch, the main window should appear and be fully functional within 1 second on modern macOS systems.
**Validates: Requirements 1.4, 9.3**

### Security and Privacy Properties

**Property 27: Local Data Storage**
*For any* data operation, no network requests should be made for data storage or retrieval, ensuring all data remains local.
**Validates: Requirements 10.1, 10.3**

**Property 28: Database Encryption**
*For any* SQLite database file, the data should be encrypted and only accessible by the application with proper authentication.
**Validates: Requirements 10.2**

**Property 29: Secure Data Deletion**
*For any* data deletion request, all traces of the data should be completely removed from the system with no recovery possibility.
**Validates: Requirements 10.7**

### Sync Preparation Properties

**Property 30: UUID Consistency**
*For any* data record created, it should have a unique UUID that remains consistent across all operations and exports.
**Validates: Requirements 11.2**

**Property 31: Version Tracking**
*For any* data modification, the version number should increment and change tracking should record the modification details.
**Validates: Requirements 11.3, 11.7**

**Property 32: Conflict Resolution Data Model**
*For any* data structure, it should include all necessary fields (timestamps, versions, UUIDs) to support future conflict resolution algorithms.
**Validates: Requirements 11.1**

## Error Handling

### Native System Integration Errors

**Menu Bar Registration Failures**:
- Graceful fallback: Continue operation without menu bar if registration fails
- User notification: Inform about reduced functionality
- Retry mechanism: Attempt re-registration on system events

**Global Shortcut Conflicts**:
- Conflict detection: Check for existing system shortcuts before registration
- Alternative suggestions: Provide fallback shortcut combinations
- User customization: Allow manual shortcut configuration

**Notification Permission Denied**:
- Graceful degradation: Continue operation with in-app notifications only
- Permission request: Guide user through system settings
- Fallback alerts: Use visual indicators when notifications unavailable

### Timer System Error Handling

**System Sleep/Wake Events**:
- State preservation: Save timer state before system sleep
- Accurate recovery: Calculate elapsed time during sleep period
- User notification: Inform about timer adjustments after wake

**Application Crash Recovery**:
- Persistent state: Save timer state every 30 seconds to database
- Recovery validation: Verify timer state integrity on startup
- User confirmation: Ask user to confirm timer continuation after crash

**Timer Drift Detection**:
- Accuracy monitoring: Compare timer calculations with system time
- Automatic correction: Adjust timer display when drift detected
- Logging: Record timer accuracy events for debugging

### Database and Migration Errors

**SQLite Database Corruption**:
- Automatic repair: Attempt SQLite integrity check and repair
- Backup restoration: Restore from most recent valid backup
- Data recovery: Extract recoverable data from corrupted database
- User notification: Inform about data recovery actions taken

**Migration Failures**:
- Partial migration handling: Continue with successfully migrated data
- Rollback capability: Restore original LocalStorage data if migration fails
- Error reporting: Provide detailed error information for troubleshooting
- Manual intervention: Allow user to retry migration with different options

**Backup System Failures**:
- Alternative storage: Use secondary backup location if primary fails
- Compression errors: Handle backup file corruption gracefully
- Storage space: Manage backup rotation when disk space limited
- User notification: Alert about backup failures and suggest actions

### Window Management Errors

**Multi-Monitor Configuration Changes**:
- Window repositioning: Move windows to available displays when monitors disconnected
- Size adjustment: Resize windows that exceed new display boundaries
- Preference preservation: Maintain window preferences for when monitors reconnected

**Floating Window Positioning**:
- Boundary detection: Keep floating window within visible screen area
- Overlap prevention: Avoid positioning over critical system UI elements
- Accessibility compliance: Ensure floating window doesn't block essential content

### Performance Degradation Handling

**Memory Usage Monitoring**:
- Threshold detection: Monitor RAM usage and detect when approaching limits
- Garbage collection: Trigger cleanup of unused resources
- Feature degradation: Disable non-essential features if memory constrained
- User notification: Inform about performance optimizations applied

**CPU Usage Optimization**:
- Background throttling: Reduce update frequency when app not in focus
- Timer optimization: Use efficient timer implementations to minimize CPU usage
- Database query optimization: Cache frequently accessed data to reduce database load

## Testing Strategy

Felipe OS Phase 2 employs a comprehensive dual testing approach combining unit tests for specific native integration scenarios and property-based tests for universal correctness validation across the Tauri bridge.

### Unit Testing Approach

**Framework**: Rust testing with `tokio-test` for async operations and Tauri's testing utilities
**Coverage Areas**:
- Tauri command functionality and error handling
- SQLite database operations and migrations
- Timer accuracy and system event handling
- Native macOS API integration
- Frontend-backend communication via IPC

**Key Unit Test Categories**:
- **Tauri Command Tests**: Verify all Rust commands work correctly with proper error handling
- **Database Migration Tests**: Test LocalStorage to SQLite conversion with various data scenarios
- **Timer System Tests**: Verify timer accuracy, persistence, and recovery mechanisms
- **System Integration Tests**: Test menu bar, notifications, and global shortcuts
- **Error Recovery Tests**: Verify graceful handling of system events and failures

### Property-Based Testing Configuration

**Framework**: `proptest` for Rust backend and `fast-check` for frontend integration tests
**Configuration**: Minimum 100 iterations per property test
**Test Organization**: Each correctness property implemented as a single property-based test

**Property Test Implementation**:
- Each test tagged with: **Feature: felipe-os-macos-native, Property {number}: {property_text}**
- Generators for realistic test data (timer states, database records, system events)
- Cross-platform test execution for macOS-specific functionality
- Automatic shrinking to minimal failing examples for native integration issues

**Example Property Test Structure**:
```rust
// Feature: felipe-os-macos-native, Property 4: Timer Accuracy Over Time
#[tokio::test]
async fn timer_accuracy_over_time() {
    proptest!(|(
        duration_minutes in 1u64..120,
        system_events in prop::collection::vec(system_event_strategy(), 0..5)
    )| {
        let timer_service = TimerService::new().await?;
        let start_time = Utc::now();
        
        timer_service.start_timer("test-block").await?;
        
        // Simulate system events during timer
        for event in system_events {
            timer_service.handle_system_event(event).await?;
        }
        
        // Fast-forward time simulation
        timer_service.simulate_elapsed_time(Duration::minutes(duration_minutes)).await?;
        
        let timer_state = timer_service.get_state().await?;
        let expected_elapsed = Duration::minutes(duration_minutes);
        let actual_elapsed = Duration::seconds(timer_state.elapsed_seconds as i64);
        
        // Timer should be accurate within 1 second
        prop_assert!((expected_elapsed - actual_elapsed).abs() <= Duration::seconds(1));
    });
}
```

### Native Integration Testing

**macOS System Testing**:
- Menu bar integration testing with system tray simulation
- Notification testing with Do Not Disturb state variations
- Global shortcut testing with conflict detection
- Window management testing across multiple monitor configurations

**Database Testing**:
- SQLite operations with concurrent access patterns
- Migration testing with various LocalStorage data formats
- Backup and restore testing with corruption scenarios
- Performance testing with large datasets

**Timer System Testing**:
- High-precision timer accuracy over extended periods
- System sleep/wake event handling with various sleep durations
- Application crash recovery with timer state persistence
- Multi-component synchronization across UI elements

### Continuous Validation

**Development Workflow**:
- Unit tests run on every file change during development
- Property tests run on commit to catch regression issues
- Integration tests run on pull requests with macOS CI
- Performance benchmarks validate resource usage requirements

**Quality Gates**:
- 90% code coverage requirement for Rust backend
- All property tests must pass with 100 iterations
- No failing unit tests allowed in main branch
- Performance tests must validate startup time and resource usage
- Native integration tests must pass on macOS 11.0+ versions

**Automated Testing Pipeline**:
- macOS GitHub Actions runners for native API testing
- Database migration testing with various Phase 1 data scenarios
- Timer accuracy testing with simulated system events
- Memory and CPU usage monitoring during test execution

The testing strategy ensures that Felipe OS Phase 2 maintains all Phase 1 functionality while providing reliable native macOS integration. The combination of targeted unit tests and comprehensive property-based tests creates a robust safety net for the critical timer system and native platform features.