# Changelog

All notable changes to Felipe OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2025-01-22

### Fixed
- **Temporizador en modo enfoque**: El temporizador ahora se actualiza correctamente en tiempo real
- **Reactividad del tiempo**: Tiempo transcurrido y tiempo restante funcionan dinámicamente
- **Barra de progreso**: Se actualiza automáticamente durante las sesiones de enfoque

### Technical
- Agregado `currentTimestamp` reactivo al FocusStore para reactividad temporal
- Modificado getter `elapsedTime` para usar timestamp reactivo
- Implementada acción `updateTimestamp()` para actualizaciones cada segundo
- Mejorada la arquitectura de reactividad en el componente FocusMode

### Added
- Nightly review interface completamente funcional
- Weekly overview con vista de 7 días y estadísticas
- Analytics dashboard con métricas de productividad
- Sistema completo de manejo de errores
- Monitoreo de rendimiento y indicadores de carga
- Página de configuraciones y diagnósticos del sistema
- Tests de integración para funcionalidad core

## [0.0.1] - 2025-01-22

### Added
- Initial release of Felipe OS web application
- Daily priority management with 100-character limit
- Sacred blocks system with 3-block daily limit
- Four-category system (LANDINGCHAT, ESTUDIO, TAUSE, OTRO)
- Time boundary enforcement (5pm cutoff, weekend blocking)
- Focus mode with timer and progress tracking
- Cell phone mode with red zone calculations
- Mobile-first responsive design
- Complete LocalStorage persistence
- Real-time work time calculations
- Block creation, editing, and completion tracking
- Category-based priority scheduling
- Override system for time boundaries
- Modern UI with glassmorphism effects
- Touch-optimized mobile interface

### Technical
- Nuxt 3.13.0 with TypeScript
- Pinia for state management
- Bun package manager
- Custom CSS with mobile-first approach
- Property-based testing setup (Vitest + fast-check)
- Component-based architecture
- Reactive time calculations
- LocalStorage data persistence

### Philosophy
- "Less features, more focus" design principle
- Constraint-driven productivity approach
- Work-life balance protection
- Anti-procrastination methodology
- Deep work optimization

## [Unreleased]

### Planned
- Native macOS application with Tauri
- Menu bar integration for persistent access
- Native macOS notifications and shortcuts
- AI productivity coaching integration
- Music integration for focus sessions
- Advanced analytics and insights