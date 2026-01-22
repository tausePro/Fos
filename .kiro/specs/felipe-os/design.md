# Design Document: Felipe OS

## Overview

Felipe OS is a minimalist anti-procrastination web application built with Nuxt 3, designed specifically for Felipe's workflow. The system implements time-blocking methodology with a hard limit of 3 daily "Sacred Blocks" to prevent overwhelm while maximizing focus. The application follows a mobile-first, ultra-minimalist design philosophy prioritizing immediate usability over feature richness.

The core architecture centers around a single main screen that serves as the primary interface, with additional views accessible through simple navigation. The system operates entirely client-side using LocalStorage for persistence, ensuring instant loading and offline functionality.

## Architecture

### Technology Stack

**Frontend Framework**: Nuxt 3 with SSR disabled for client-side only operation
- Provides Vue 3 composition API and modern development experience
- Auto-imports and file-based routing for clean code organization
- Built-in TypeScript support for type safety

**Styling**: Tailwind CSS with custom design system
- Mobile-first responsive design approach
- Custom color palette for category identification
- Large typography scale for readability
- Minimal component library focusing on essential UI elements

**State Management**: Pinia stores with VueUse integration
- Centralized state management for application data
- `useLocalStorage` composable for automatic persistence
- Reactive state updates across components
- Hydration handling for SSR compatibility (though SSR will be disabled)

**Data Persistence**: Browser LocalStorage only
- No external database or authentication required
- Automatic data synchronization using VueUse `useLocalStorage`
- Graceful handling of storage quota limits
- Data structure versioning for future migrations

### Application Structure

```
felipe-os/
├── pages/
│   ├── index.vue           # Main dashboard
│   ├── week.vue            # Weekly overview
│   ├── stats.vue           # Statistics dashboard
│   └── review.vue          # Nightly review
├── components/
│   ├── blocks/
│   │   ├── BlockEditor.vue
│   │   ├── BlockTimer.vue
│   │   └── BlockList.vue
│   ├── ui/
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   └── Modal.vue
│   └── layout/
│       ├── Header.vue
│       └── Navigation.vue
├── stores/
│   ├── blocks.js           # Sacred blocks management
│   ├── focus.js            # Focus mode state
│   ├── settings.js         # User preferences
│   └── analytics.js        # Statistics tracking
├── composables/
│   ├── useTimeValidation.js
│   ├── useCellPhoneMode.js
│   └── useNightlyReview.js
└── utils/
    ├── timeHelpers.js
    ├── categoryHelpers.js
    └── validationHelpers.js
```

## Components and Interfaces

### Core Data Models

**Block Interface**:
```typescript
interface Block {
  id: string
  date: string           // YYYY-MM-DD format
  startTime: string      // HH:MM format (24h)
  endTime: string        // HH:MM format (24h)
  category: 'LANDINGCHAT' | 'ESTUDIO' | 'TAUSE' | 'OTRO'
  description: string    // Max 50 characters
  completed: boolean
  actualStartTime?: string
  actualEndTime?: string
}
```

**Daily Priority Interface**:
```typescript
interface DailyPriority {
  date: string           // YYYY-MM-DD format
  text: string          // Max 100 characters
  completed: boolean
}
```

**Review Entry Interface**:
```typescript
interface ReviewEntry {
  date: string           // YYYY-MM-DD format
  focusRating: number    // 1-5 scale
  energyRating: number   // 1-5 scale
  completedBlocks: number
  totalBlocks: number
  reflectionNotes: string
  improvements: string
}
```

### Main Dashboard Component

The primary interface displays all essential information in a single view:

**Header Section**:
- Current date and time (live updating)
- Remaining work time until 5pm
- Cell phone mode status indicator

**One Thing Section**:
- Large input field for daily priority (100 char limit)
- Prominent display of current priority
- Completion checkbox

**Sacred Blocks Section**:
- List of up to 3 blocks for the current day
- Each block shows: time range, category color, description, completion status
- Add/edit functionality with validation
- Visual progress indicators

**Action Buttons**:
- START DAY (enters focus mode)
- VIEW WEEK (navigation to weekly overview)
- STATS (navigation to analytics)

### Block Management System

**Block Creation Validation**:
- Enforce 3-block daily limit
- Prevent time overlaps
- Validate 30-minute increments
- Ensure 2-hour maximum duration
- Check LANDINGCHAT priority scheduling
- Prevent scheduling after 5pm (with override option)

**Category System**:
- LANDINGCHAT: Priority 1, Green (#10B981)
- ESTUDIO: Priority 2, Blue (#3B82F6)
- TAUSE: Priority 3, Orange (#F59E0B)
- OTRO: Priority 4, Gray (#6B7280)

### Focus Mode Implementation

When "START DAY" is activated:
- Navigation is hidden/disabled
- Only current active block is displayed
- Timer shows remaining time in current block
- Progress bar indicates completion percentage
- Simple controls for block completion and transition

### Weekly Overview Interface

7-day grid layout showing:
- Each day as a column
- Planned vs completed blocks visualization
- Category color coding
- Completion statistics
- Navigation between weeks
- Quick access to daily planning

### Statistics Dashboard

Simple metrics display:
- Weekly completion rates by category
- Most productive time periods identification
- Streak tracking for consistent planning
- Focus time trends over time
- Simple charts using minimal visualization library

## Data Models

### LocalStorage Schema

**Primary Keys**:
- `felipe-os-blocks`: Array of all blocks
- `felipe-os-priorities`: Array of daily priorities  
- `felipe-os-reviews`: Array of nightly reviews
- `felipe-os-settings`: User preferences object
- `felipe-os-focus-state`: Current focus mode state

**Data Versioning**:
```typescript
interface StorageSchema {
  version: string        // Semantic versioning
  lastUpdated: string   // ISO timestamp
  data: {
    blocks: Block[]
    priorities: DailyPriority[]
    reviews: ReviewEntry[]
    settings: UserSettings
  }
}
```

### State Management Architecture

**Pinia Stores Structure**:

1. **Blocks Store** (`useBlocksStore`):
   - Manages all block CRUD operations
   - Handles validation and conflict resolution
   - Provides computed properties for daily/weekly views
   - Automatic LocalStorage synchronization

2. **Focus Store** (`useFocusStore`):
   - Tracks focus mode state
   - Manages current active block
   - Timer functionality and progress tracking
   - Cell phone mode calculations

3. **Settings Store** (`useSettingsStore`):
   - User preferences (work hours, weekend blocking)
   - Theme and display options
   - Notification preferences
   - Data export/import functionality

4. **Analytics Store** (`useAnalyticsStore`):
   - Aggregates completion statistics
   - Calculates productivity trends
   - Generates insights and recommendations
   - Historical data analysis

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, here are the key correctness properties for Felipe OS:

### Input Validation Properties

**Property 1: Text Input Length Limits**
*For any* text input in the system (priority descriptions, block descriptions), the system should enforce the specified character limits (100 for priorities, 50 for block descriptions) and reject or truncate inputs that exceed these limits.
**Validates: Requirements 1.2, 2.3**

**Property 2: Time Format Validation**
*For any* time input, the system should only accept and display 24-hour format (HH:MM) and reject other time formats.
**Validates: Requirements 2.4**

**Property 3: Block Duration Constraints**
*For any* block duration input, the system should only accept 30-minute multiples up to a maximum of 2 hours and reject invalid durations.
**Validates: Requirements 2.7, 2.8**

### Business Logic Properties

**Property 4: Sacred Block Limit Enforcement**
*For any* day, attempting to create more than 3 blocks should be rejected, regardless of the time slots or categories involved.
**Validates: Requirements 2.1**

**Property 5: Time Overlap Prevention**
*For any* set of blocks on the same day, no two blocks should have overlapping time ranges, and the system should prevent creation of overlapping blocks.
**Validates: Requirements 2.6**

**Property 6: LANDINGCHAT Priority Scheduling**
*For any* scheduling scenario, LANDINGCHAT blocks should always be able to find available time slots and take precedence over other categories when conflicts arise.
**Validates: Requirements 3.6, 3.7**

**Property 7: Time Boundary Enforcement**
*For any* block creation attempt, blocks scheduled after 5pm should be rejected by default (unless manual override is used), and weekend blocks should be blocked by default.
**Validates: Requirements 4.1, 4.2, 4.3**

### State Management Properties

**Property 8: Data Persistence Round Trip**
*For any* application data (blocks, priorities, reviews), storing data and then retrieving it should produce equivalent data structures.
**Validates: Requirements 9.1, 9.2**

**Property 9: Daily State Transitions**
*For any* day transition (midnight rollover), the previous day's priority should be cleared and the system should prepare for new daily planning.
**Validates: Requirements 1.4, 8.5**

**Property 10: Focus Mode State Consistency**
*For any* focus mode session, all planning capabilities should be disabled, only the current block should be visible, and progress/timer information should be continuously updated.
**Validates: Requirements 6.2, 6.3, 6.4**

### Time Calculation Properties

**Property 11: Red Zone Calculation**
*For any* workday start time, cell phone mode should correctly calculate red zones as the first 3 hours and provide accurate start/end times.
**Validates: Requirements 5.1, 5.4**

**Property 12: Remaining Time Calculation**
*For any* current time during work hours, the system should accurately calculate and display remaining work time until 5pm.
**Validates: Requirements 4.4**

### Analytics Properties

**Property 13: Completion Statistics Accuracy**
*For any* set of completed and planned blocks, the system should accurately calculate completion rates, track blocks by category, and identify productive time patterns.
**Validates: Requirements 11.1, 11.2, 11.4**

**Property 14: Weekly Data Visualization**
*For any* week's data, the weekly view should correctly display completed vs planned blocks, use appropriate category colors, and allow navigation between weeks.
**Validates: Requirements 7.2, 7.3, 7.5**

### User Interface Properties

**Property 15: Responsive Design Adaptation**
*For any* screen size or viewport, the interface should adapt appropriately using mobile-first responsive design principles.
**Validates: Requirements 10.3**

**Property 16: Visual Feedback Responsiveness**
*For any* user interaction, the system should provide immediate visual feedback indicating the action has been registered.
**Validates: Requirements 10.5**

**Property 17: Performance Consistency**
*For any* application state, the main interface should load within 2 seconds and maintain responsive performance.
**Validates: Requirements 10.1**

<function_calls>
<invoke name="prework">
<parameter name="featureName">felipe-os

## Error Handling

### Input Validation Errors

**Character Limit Violations**:
- Priority descriptions exceeding 100 characters: Truncate with visual indicator
- Block descriptions exceeding 50 characters: Truncate with visual indicator
- Display character count in real-time during input

**Time Validation Errors**:
- Invalid time formats: Show inline error message and prevent submission
- Overlapping blocks: Highlight conflicts and suggest alternative times
- After-hours scheduling: Show warning with override option

**Business Rule Violations**:
- Attempting 4th block: Show limit reached message with suggestion to edit existing blocks
- Weekend planning: Show family time reminder with override option
- LANDINGCHAT scheduling conflicts: Automatically suggest optimal time slots

### Data Persistence Errors

**LocalStorage Quota Exceeded**:
- Graceful degradation: Continue operation with session-only storage
- User notification: Inform about storage limitations
- Data cleanup: Offer to archive old data

**Data Corruption**:
- Schema validation on load: Detect and repair corrupted data structures
- Fallback mechanisms: Use default values for missing or invalid data
- User notification: Inform about data recovery actions taken

### Network and Performance Errors

**Offline Operation**:
- No special handling required (fully offline application)
- All functionality available without network connection

**Performance Degradation**:
- Loading timeouts: Show loading indicators for operations > 500ms
- Large dataset handling: Implement pagination for historical data views
- Memory management: Automatic cleanup of unused data

## Testing Strategy

Felipe OS employs a comprehensive dual testing approach combining unit tests for specific scenarios and property-based tests for universal correctness validation.

### Unit Testing Approach

**Framework**: Vitest with Vue Test Utils for component testing
**Coverage Areas**:
- Component rendering and user interactions
- Edge cases and error conditions
- Integration between stores and components
- LocalStorage operations and data migrations

**Key Unit Test Categories**:
- **UI Component Tests**: Verify correct rendering of blocks, timers, and forms
- **Validation Tests**: Test specific edge cases like empty inputs, boundary times
- **Integration Tests**: Test interaction between Pinia stores and components
- **Error Handling Tests**: Verify graceful handling of storage limits and data corruption

### Property-Based Testing Configuration

**Framework**: fast-check for JavaScript property-based testing
**Configuration**: Minimum 100 iterations per property test
**Test Organization**: Each correctness property implemented as a single property-based test

**Property Test Implementation**:
- Each test tagged with: **Feature: felipe-os, Property {number}: {property_text}**
- Generators for realistic test data (valid time ranges, block configurations, user inputs)
- Comprehensive input space coverage through randomization
- Automatic shrinking to minimal failing examples

**Example Property Test Structure**:
```javascript
// Feature: felipe-os, Property 4: Sacred Block Limit Enforcement
test('Sacred block limit enforcement', () => {
  fc.assert(fc.property(
    fc.array(blockGenerator, { minLength: 4, maxLength: 10 }),
    (blocks) => {
      const store = useBlocksStore()
      const validBlocks = blocks.slice(0, 3)
      const invalidBlock = blocks[3]
      
      // Should accept first 3 blocks
      validBlocks.forEach(block => {
        expect(store.addBlock(block)).toBe(true)
      })
      
      // Should reject 4th block
      expect(store.addBlock(invalidBlock)).toBe(false)
      expect(store.blocks.length).toBe(3)
    }
  ), { numRuns: 100 })
})
```

### Testing Data Generation

**Block Generator**: Creates realistic block configurations with valid time ranges, categories, and descriptions
**Time Generator**: Produces valid 24-hour format times with 30-minute increments
**Date Generator**: Creates date ranges covering weekdays, weekends, and edge cases
**Text Generator**: Produces strings of various lengths for input validation testing

### Continuous Validation

**Development Workflow**:
- Unit tests run on every file change during development
- Property tests run on commit to catch regression issues
- Full test suite execution before deployment
- Performance benchmarks to ensure 2-second load time requirement

**Quality Gates**:
- 90% code coverage requirement for core business logic
- All property tests must pass with 100 iterations
- No failing unit tests allowed in main branch
- Performance tests must validate load time requirements

The testing strategy ensures that Felipe OS maintains correctness across all user scenarios while providing fast feedback during development. The combination of targeted unit tests and comprehensive property-based tests creates a robust safety net for the application's critical time-blocking functionality.