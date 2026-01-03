# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-02

### Added

- Footer component with alpha disclaimer, copyright notice, and navigation links
- Legal pages: Privacy Policy, Legal, Contact, About, and Terms of Service
- Alert UI component for displaying informational messages
- Bilingual support for all legal pages and footer (English and French)
- Back to home navigation link on all legal pages

### Changed

- Enhanced translation hook to support nested translation keys (dot notation)
- Updated root layout to include Footer component on all pages
- Improved translation system to handle nested JSON structures

### Fixed

- Translation system now properly resolves nested keys (e.g., `footer.alphaNotice`)

## [0.2.0] - 2026-01-02

### Added

- Message editing functionality with confirmation dialogs and diff view
- Entry linking feature to connect related journal entries
- Draft deletion with bulk actions and undo support
- DayPicker integration for enhanced date selection
- French date format support
- Word count feature and related components
- Template dialogs and improved prompt handling
- Checkbox UI component
- Improved translation handling for multiple features
- Entry detection and analysis enhancements
- Comprehensive test coverage for entry linking

### Changed

- Enhanced SidebarHeader layout for improved responsiveness and organization
- Improved message editing dialogs with better translation handling
- Updated UI styling with Merriweather serif font configuration
- Streamlined conversation history mapping
- Enhanced entry linking functionality with improved cache management
- Improved draft deletion handling and UI feedback
- Enhanced component structure and state management
- Modularized conversation summary and entry analysis services
- Simplified useJournalEffects with configuration object
- Extracted ChatMessage sub-components and handlers for better modularity
- Split journal-sidebar into smaller modules
- Improved OAuth callback handling and validation

### Fixed

- Resolved ESLint errors in firebase errors module
- Fixed TypeScript errors in tests (replaced any types)
- Fixed conversation initialization issues
- Simplified conversation history mapping to resolve issues

### Refactored

- Simplified UI components by extracting helper functions
- Improved entry linking core implementation
- Enhanced ChangeDateDialog integration and trigger handling
- Extracted components and functions for better modularity
- Simplified service layer and infrastructure code
- Added return types to Firebase, hooks, context providers, and UI components
- Extracted chat input hook and API key validation hook
- Consolidated and streamlined coding standards
- Enhanced efficiency guidelines in core rules

## [0.1.0] - Initial Release

