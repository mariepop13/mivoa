---
description: "Architecture patterns: file structure, layers, and imports organization"
alwaysApply: true
---

# Architecture

- Files: 200-400 lines (split if >400). Single responsibility. Exports: 1-3 related entities.
- Layers: UI (components) → domain (services/flows) → data/infrastructure.
- Imports: Standard → Third-party → Internal (@/*).


