# Mivoa

Mivoa is an AI-assisted journal for reflecting on thoughts, experiences, and personal growth. It combines traditional journaling with AI-powered conversations, prompts, summaries, and entry analysis.

> Mivoa is currently in alpha. Features and storage behavior may change, and data loss is possible. Export important journal entries regularly.

## Features

- Journal entries with prompts, templates, drafts, and mood tracking
- AI-assisted conversations, summaries, prompts, and entry analysis
- Bring your own OpenRouter API key for AI features
- Firebase authentication and Firestore persistence
- Local storage mode for offline development without Firebase
- JSON and Markdown export, plus JSON import
- English and French translations
- Responsive UI with dark mode

## Getting started

### Prerequisites

- Node.js 20.x
- npm
- Firebase CLI only if you want to run the Firebase Emulator Suite or end-to-end tests

### Install and run locally

1. Clone the repository and enter the project directory:

   ```bash
   git clone <your-repo-url>
   cd mivoa
   ```

2. Install the locked dependency versions:

   ```bash
   npm ci
   ```

3. Create a local environment file:

   macOS, Linux, or Git Bash:

   ```bash
   cp .env.local.example .env.local
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.local.example .env.local
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The example environment file defaults to `NEXT_PUBLIC_STORAGE_BACKEND=local`, so Firebase is not required for a first local run. In local mode, journal data is stored in the browser's local storage.

### Enable Firebase storage

To use Firebase authentication and Firestore instead of local storage:

1. Set `NEXT_PUBLIC_STORAGE_BACKEND=firebase` in `.env.local`.
2. Fill in the Firebase variables listed in `.env.local.example`.
3. Configure the corresponding Firebase project, authentication providers, and Firestore rules.
4. Restart the development server after changing environment variables.

### Enable AI features

Mivoa uses OpenRouter for AI features. Add an OpenRouter API key through the onboarding flow in the application. Do not commit API keys or other secrets to the repository.

To validate a key manually from the command line, set `TEST_OPENROUTER_API_KEY` in `.env.local` and run:

```bash
npm run test:openrouter-key
```

## Environment variables

Use `.env.local.example` as the source of truth for local development. The main options are:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_STORAGE_BACKEND` | Selects `local` or `firebase`; the example defaults to `local`. |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client configuration when the Firebase backend is enabled. |
| `FIREBASE_API_KEY` | Server-only Firebase API key used by API routes. |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | Routes Firebase services to local emulators when set to `true`. |
| `TEST_OPENROUTER_API_KEY` | Optional key for the manual OpenRouter validation script. |

For end-to-end tests, copy `.env.test.local.example` to `.env.test.local`. That file contains fake emulator credentials and must not be used as production configuration.

## Testing

### Unit and integration tests

```bash
# Watch mode
npm test

# Run the test suite once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run Vitest UI
npm run test:ui
```

On Windows PowerShell, the Vitest scripts currently use Unix-style inline environment variable syntax. Use Git Bash, or run Vitest directly with the PowerShell equivalent:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx vitest run
```

### Quality checks

```bash
npm run lint
npm run typecheck
npm run test:ci
```

`npm run test:ci` runs linting, TypeScript checks, and the test suite once without coverage. The GitHub Actions workflow runs linting in its own job, with distinct typecheck and test steps in the test job.

The production build script also uses Unix-style environment variable syntax. Run it from Git Bash or another POSIX-compatible shell on Windows.

### End-to-end tests

The E2E suite uses the Firebase Auth and Firestore emulators. Copy the test environment file first:

```bash
cp .env.test.local.example .env.test.local
```

Run the complete emulator and test workflow:

```bash
npm run test:e2e:full
```

Alternatively, start the emulators in one terminal and run Playwright in another:

```bash
firebase emulators:start --only auth,firestore --project demo-mivoa
```

```bash
npm run test:e2e
```

The Playwright configuration uses `http://localhost:3100` by default. Set `E2E_BASE_URL` when running the app on another port or from multiple worktrees.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Build the application for production. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run lint:fix` | Fix ESLint issues where possible. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run Vitest in watch mode. |
| `npm run test:run` | Run Vitest once. |
| `npm run test:watch` | Run Vitest explicitly in watch mode. |
| `npm run test:coverage` | Run Vitest with coverage. |
| `npm run test:ui` | Open the Vitest UI. |
| `npm run test:ci` | Run lint, typecheck, and tests once. |
| `npm run test:e2e` | Run Playwright E2E tests. |
| `npm run test:e2e:ui` | Open the Playwright UI. |
| `npm run test:e2e:full` | Start Firebase emulators and run E2E tests. |

## Project structure

```text
src/
├── ai/             # AI types, prompt builders, and services
├── app/            # Next.js App Router pages, layouts, and API routes
├── components/     # Application and shadcn/ui components
├── context/        # Shared React contexts
├── firebase/       # Firebase configuration, providers, and errors
├── hooks/          # Reusable React hooks
├── lib/            # Shared application logic and development data
├── locales/        # English and French translations
├── repositories/   # Storage backend implementations
└── utils/          # Domain and formatting utilities

e2e/                # Playwright end-to-end tests
docs/               # Test fixtures and implementation plans
scripts/            # Development and validation scripts
```

The storage layer supports two backends selected through `NEXT_PUBLIC_STORAGE_BACKEND`: Firebase for authenticated persistence and local storage for lightweight local development.

## Contributing

1. Create a `feature/*` or `bugfix/*` branch from `develop`.
2. Keep changes focused and update documentation when behavior or commands change.
3. Run `npm run test:ci` before opening a pull request.
4. Use the repository's Gitmoji commit convention.
5. Open a pull request targeting `develop`.

## License

No license file has been declared in the repository yet.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [OpenRouter](https://openrouter.ai/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
