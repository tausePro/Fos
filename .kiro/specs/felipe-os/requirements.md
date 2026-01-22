# Requirements Document

## Introduction

Felipe OS is an anti-procrastination web application designed specifically for Felipe, a Colombian entrepreneur with 20+ years of development experience. The system prioritizes deep work blocks over infinite task management, following the philosophy "Less features, more focus" to protect Felipe's limited 6 effective daily hours (8am-5pm) while managing multiple projects and starting Software Engineering studies.

## Glossary

- **Felipe_OS**: The anti-procrastination web application system
- **Deep_Work_Block**: A focused time period (30min-2h) dedicated to a specific task category
- **Sacred_Block**: A planned deep work block in the daily schedule (max 3 per day)
- **One_Thing**: The single most important priority for the day (max 100 characters)
- **Category**: Work classification system (LANDINGCHAT, ESTUDIO, TAUSE, OTRO)
- **Cell_Phone_Mode**: System state that calculates red zones (first 3 hours of day)
- **Focus_Mode**: Active work state that freezes planning and shows current block
- **Red_Zone**: Time periods when phone usage should be minimized (first 3 hours)
- **Nightly_Review**: End-of-day reflection interface (appears after 8pm)
- **Hard_Boundary**: 5pm cutoff time for work activities

## Requirements

### Requirement 1: Daily Priority Management

**User Story:** As Felipe, I want to set one primary focus for each day, so that I can maintain clarity on what matters most despite multiple competing priorities.

#### Acceptance Criteria

1. THE Felipe_OS SHALL display a "YOUR ONE THING TODAY" section on the main screen
2. WHEN Felipe enters a priority description, THE Felipe_OS SHALL limit input to 100 characters maximum
3. THE Felipe_OS SHALL persist the daily priority across browser sessions
4. WHEN a new day begins, THE Felipe_OS SHALL clear the previous day's priority
5. THE Felipe_OS SHALL display the current priority prominently throughout the day

### Requirement 2: Sacred Block System

**User Story:** As Felipe, I want to plan a maximum of 3 deep work blocks per day, so that I can focus deeply without overwhelming my limited 6-hour schedule.

#### Acceptance Criteria

1. THE Felipe_OS SHALL enforce a hard limit of 3 sacred blocks per day
2. WHEN Felipe creates a block, THE Felipe_OS SHALL require time range, category, and description
3. THE Felipe_OS SHALL limit block descriptions to 50 characters maximum
4. THE Felipe_OS SHALL use 24-hour time format for all time inputs
5. THE Felipe_OS SHALL suggest 90-minute duration for new blocks
6. THE Felipe_OS SHALL prevent overlapping time blocks
7. THE Felipe_OS SHALL restrict block durations to 30-minute multiples
8. THE Felipe_OS SHALL enforce a maximum 2-hour duration per block

### Requirement 3: Category Management

**User Story:** As Felipe, I want to categorize my work blocks by priority and type, so that I can visually distinguish between different types of work and ensure LANDINGCHAT gets priority.

#### Acceptance Criteria

1. THE Felipe_OS SHALL provide exactly four categories: LANDINGCHAT, ESTUDIO, TAUSE, OTRO
2. THE Felipe_OS SHALL display LANDINGCHAT blocks in green color
3. THE Felipe_OS SHALL display ESTUDIO blocks in blue color
4. THE Felipe_OS SHALL display TAUSE blocks in orange color
5. THE Felipe_OS SHALL display OTRO blocks in gray color
6. WHEN Felipe plans blocks, THE Felipe_OS SHALL always ensure LANDINGCHAT can be scheduled
7. THE Felipe_OS SHALL validate that LANDINGCHAT priority is respected in scheduling

### Requirement 4: Time Boundary Enforcement

**User Story:** As Felipe, I want the system to respect my 5pm hard boundary and family time, so that I can maintain work-life balance with my wife and young child.

#### Acceptance Criteria

1. THE Felipe_OS SHALL prevent planning blocks after 5pm by default
2. WHERE manual override is requested, THE Felipe_OS SHALL allow planning after 5pm with explicit confirmation
3. THE Felipe_OS SHALL block weekends for family time by default
4. THE Felipe_OS SHALL display remaining work time for the current day
5. WHEN current time exceeds 5pm, THE Felipe_OS SHALL show end-of-day status

### Requirement 5: Cell Phone Mode

**User Story:** As Felipe, I want to identify red zones when I should minimize phone usage, so that I can maintain focus during my most productive hours.

#### Acceptance Criteria

1. WHEN Cell_Phone_Mode is activated, THE Felipe_OS SHALL calculate red zones as the first 3 hours of the workday
2. THE Felipe_OS SHALL display cell phone mode status on the main screen
3. THE Felipe_OS SHALL visually indicate when Felipe is currently in a red zone
4. THE Felipe_OS SHALL provide clear start and end times for red zone periods

### Requirement 6: Focus Mode Operation

**User Story:** As Felipe, I want to enter a focused work state that prevents planning distractions, so that I can concentrate fully on my current block without temptation to reorganize.

#### Acceptance Criteria

1. WHEN Felipe clicks "START DAY", THE Felipe_OS SHALL enter Focus_Mode
2. WHILE in Focus_Mode, THE Felipe_OS SHALL freeze all planning capabilities
3. WHILE in Focus_Mode, THE Felipe_OS SHALL display only the current active block
4. WHILE in Focus_Mode, THE Felipe_OS SHALL show block progress and remaining time
5. WHEN a block is completed, THE Felipe_OS SHALL allow transition to the next block

### Requirement 7: Weekly Overview

**User Story:** As Felipe, I want to see my weekly progress at a glance, so that I can understand my productivity patterns and plan better for upcoming days.

#### Acceptance Criteria

1. WHEN Felipe accesses weekly view, THE Felipe_OS SHALL display a 7-day grid
2. THE Felipe_OS SHALL show completed blocks versus planned blocks for each day
3. THE Felipe_OS SHALL use category colors to distinguish block types in weekly view
4. THE Felipe_OS SHALL calculate and display weekly completion statistics
5. THE Felipe_OS SHALL allow navigation between different weeks

### Requirement 8: Nightly Review Process

**User Story:** As Felipe, I want to reflect on my daily progress each evening, so that I can learn from my productivity patterns and improve my planning.

#### Acceptance Criteria

1. WHEN current time is after 8pm, THE Felipe_OS SHALL display the nightly review interface
2. THE Felipe_OS SHALL present reflection questions about the day's productivity
3. THE Felipe_OS SHALL allow Felipe to rate his focus and energy levels
4. THE Felipe_OS SHALL save review responses for future analysis
5. WHEN nightly review is completed, THE Felipe_OS SHALL prepare the system for the next day

### Requirement 9: Data Persistence

**User Story:** As Felipe, I want my planning data to persist across browser sessions, so that I don't lose my work when closing and reopening the application.

#### Acceptance Criteria

1. THE Felipe_OS SHALL store all data in browser LocalStorage
2. WHEN Felipe closes and reopens the browser, THE Felipe_OS SHALL restore all saved data
3. THE Felipe_OS SHALL not require any user authentication or external database
4. THE Felipe_OS SHALL work completely offline
5. THE Felipe_OS SHALL handle LocalStorage quota limits gracefully

### Requirement 10: Performance and Simplicity

**User Story:** As Felipe, I want the application to load instantly and remain simple, so that I actually use it instead of being overwhelmed by features.

#### Acceptance Criteria

1. THE Felipe_OS SHALL load the main interface within 2 seconds
2. THE Felipe_OS SHALL prioritize large, readable typography
3. THE Felipe_OS SHALL use a mobile-first responsive design
4. THE Felipe_OS SHALL maintain ultra-minimalist visual design
5. THE Felipe_OS SHALL provide immediate visual feedback for all user actions

### Requirement 11: Statistics and Analytics

**User Story:** As Felipe, I want basic statistics about my productivity patterns, so that I can understand my work habits and make data-driven improvements.

#### Acceptance Criteria

1. THE Felipe_OS SHALL track completed blocks by category over time
2. THE Felipe_OS SHALL calculate daily and weekly completion rates
3. THE Felipe_OS SHALL show productivity trends in simple visual format
4. THE Felipe_OS SHALL identify most productive time periods
5. THE Felipe_OS SHALL display statistics in an easy-to-understand dashboard