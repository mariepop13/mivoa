# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
```bash
npm test                    # Run tests in watch mode
npm run test:run            # Run tests once (CI mode)
npm run test:coverage       # Generate coverage report
npm run test:ui             # Run tests with Vitest UI
npm run test:watch          # Run tests in watch mode
npm run test:ci             # Run full CI check: lint + typecheck + tests
npm run test:openrouter-key # Test OpenRouter API key validation
```

To run a single test file:
```bash
npx vitest run path/to/test.test.ts
```

To run tests matching a pattern:
```bash
npx vitest run --reporter=verbose -t "pattern"
```

### Code Quality
```bash
npm run lint                # Run ESLint
npm run lint:fix            # Fix ESLint errors automatically
npm run typecheck           # Run TypeScript type checking
```

### Build & Development
```bash
npm run dev                 # Start development server (localhost:3000)
npm run build               # Production build (requires NODE_ENV=production)
npm run start               # Start production server
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS + Shadcn UI components
- **Backend**: Firebase (Auth + Firestore)
- **AI**: OpenRouter API for chat and analysis features
- **Testing**: Vitest + Testing Library + Happy-DOM
- **State Management**: React Context + Custom Hooks

### Core Data Models

#### Firestore Collections Structure
```
users/{userId}/
  ├── entries/{entryId}           # Journal entries (read/write by owner)
  └── settings/{settingsId}       # User settings and API keys
```

#### Key Type Definitions

**Journal Entry** (in Firestore):
- `content`: string - main journal text
- `date`: string - date key (YYYY-MM-DD)
- `createdAt`, `updatedAt`: Timestamps
- `moods`, `themes`, `places`, `characters`: string[] - AI-extracted metadata
- `moodEmojis`, `themeEmojis`, `subjectEmoji`: emoji mappings
- `keyTakeaways`: string[] - AI-generated insights
- `conversationHistory`: ChatMessage[] - AI conversation
- `conversationSummary`: ConversationSummary - AI-generated summary
- `linkedEntries`: string[] - references to other entries

### Firebase Integration Patterns

**Non-Blocking Authentication** (src/firebase/non-blocking-login.ts):
- All auth operations use dedicated functions that handle offline gracefully
- Functions: `initiateAnonymousSignIn`, `initiateEmailSignUp`, `initiateEmailSignIn`, `initiateGoogleSignIn`, `initiateSignOut`
- Offline errors are caught and converted to user-friendly messages

**Non-Blocking Firestore Operations** (src/firebase/non-blocking-updates.ts):
- All Firestore writes use wrapper functions that emit permission errors without blocking UI
- Functions: `setDocumentNonBlocking`, `addDocumentNonBlocking`, `updateDocumentNonBlocking`, `deleteDocumentNonBlocking`
- Permission errors are emitted via `errorEmitter` and handled globally

**Custom Firestore Hooks** (src/firebase/firestore/):
- `useCollection`: Real-time collection subscription with loading/error states
- `useDoc`: Real-time document subscription with loading/error states
- Both hooks handle Firebase auth state changes automatically

### AI Services Architecture

**AI Service Layer** (src/ai/services/):
- `chat-service.ts`: Streaming chat responses from OpenRouter
- `entry-analysis-service.ts`: Extract moods, themes, places, characters, and key takeaways
- `conversation-summary-service.ts`: Generate conversation summaries with titles and insights
- `journal-prompt-service.ts`: Generate contextual journal prompts
- `model-service.ts`: Fetch and filter available AI models from OpenRouter
- `openrouter-client.ts`: Shared OpenRouter API client with streaming support

All AI services use the OpenRouter SDK and handle streaming responses.

### Component Organization

**Component Patterns**:
- UI components in `src/components/ui/` are Shadcn components (do not modify directly)
- Feature components are co-located with related logic files (e.g., `chat-message.tsx` + `chat-message-handlers.ts`)
- Complex features are broken into multiple single-responsibility components (e.g., chat: `chat-input-form.tsx`, `chat-message.tsx`, `chat-messages-list.tsx`, `chat-typing-indicator.tsx`)
- Badge components (moods, themes, places, characters) display AI-extracted metadata with emojis

**Context Providers** (src/context/):
- `LanguageContext`: Manages i18n (English/French)
- `ModelContext`: Manages selected AI model
- `OpenRouterApiKeyContext`: Manages and validates OpenRouter API key

**Custom Hooks** (src/hooks/):
- Feature-specific hooks extract complex logic from components
- Examples: `use-entry-analysis.tsx`, `use-summary-operations.tsx`, `use-entry-linking.tsx`, `use-message-editing.tsx`

### API Routes

**Other APIs**:
- `validate-openrouter/route.ts`: Validate OpenRouter API keys

All API routes use helper functions from `src/lib/api-auth.ts` for Firebase Admin authentication.

## Code Style Standards

### Clean Code Principles
- **No comments or docstrings**: Code must be self-explanatory
- **Function naming**: Use verbs (e.g., `generateSummary`, `validateApiKey`)
- **Variable naming**: Use nouns, no abbreviations (e.g., `conversationHistory` not `convHist`)
- **Function size**: 20-40 lines max, ≤3-4 parameters (use objects for more)
- **Early returns**: Prefer early returns over nested conditionals
- **Nesting depth**: Maximum 3 levels

### File Organization
- Files should be 200-400 lines (split if larger)
- Single responsibility per file
- 1-3 exported entities per file
- Import order: Standard library → Third-party → Internal (@/*)

### TypeScript Standards
- Explicit types for public APIs
- Validate data at system boundaries (user input, external APIs)
- Prefer immutability
- Never swallow errors silently

### Testing Standards
- Run `npm run test:ci` before committing
- Test non-trivial logic using Arrange/Act/Assert pattern
- Tests must be fast and isolated
- Use `describe` and `it` blocks with descriptive names
- One concept per test
- Co-locate tests in `__tests__` directories

### Git Workflow
- Branch prefixes: `feature/`, `bugfix/`, `hotfix/`, `release/vX.Y.Z`
- Protected branches: `main`, `develop` (require PRs)
- Commit format: `<gitmoji> <intent>: <description>`
  - Intents: feat, fix, refactor, style, perf, fire, docs, deploy, security, wip, build
- Commit bullets should be exhaustive and list ALL changes
- PR title matches commit message format

## Environment Configuration

Required environment variables for local development (see `.env.local.example`):
- Firebase configuration (8 variables starting with `NEXT_PUBLIC_FIREBASE_`)
- Optional: `TEST_OPENROUTER_API_KEY` for API key validation tests

Users configure their OpenRouter API key in the app's Settings page (stored in Firestore, not environment).

## Development Notes

- The app uses App Router (not Pages Router) - pages are in `src/app/`
- AI features require users to provide their own OpenRouter API key (BYOK model)
- Firebase Admin SDK is used in API routes for server-side operations
- All dates in Firestore use Firebase Timestamp type
- Entry date keys use format: YYYY-MM-DD
- Multi-language support via `src/locales/` (en.json, fr.json)
