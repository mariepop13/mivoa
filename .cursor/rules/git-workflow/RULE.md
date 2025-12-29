---
description: "Git workflow standards and commit message format with gitmoji"
alwaysApply: false
---

# Git

- Workflow: `feature/`, `bugfix/`, `hotfix/`, `release/vX.Y.Z`. Protected: `main`, `develop` (PRs required). CRITICAL: Verify branch first.
- Commits format: `<gitmoji> <intent>: <description>` ✨🐛♻️💄🎨⚡🔥📝🚀🔒🚧📦

- Commit bullets MUST be exhaustive and detailed:
  - List ALL significant changes, not just the main feature
  - Include affected files/components/services (e.g., "Update BookmarkService to handle edge cases")
  - Mention breaking changes, API changes, or configuration updates
  - Include bug fixes, refactorings, and improvements separately
  - Add context for complex changes (e.g., "Refactor auth flow to support OAuth2")
  - Mention test updates if tests were added/modified
  - Use present tense, be specific and actionable
  - Minimum 3-5 bullets for substantial changes, more for large features
  - Example format:
    ```
    ✨ feat: add bookmark search functionality
    
    - Add search input component with debounced query
    - Implement BookmarkService.search() with fuzzy matching
    - Update BookmarkList to filter results client-side
    - Add search keyboard shortcut (Cmd/Ctrl+K)
    - Include search tests with edge cases
    - Update types for search result format
    ```


