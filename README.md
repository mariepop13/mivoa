# Mivoa

Your AI-assisted journal built with Next.js 15, TypeScript, and Tailwind CSS.

Mivoa is a modern journaling application that combines the power of AI with an intuitive writing experience. Create dated journal entries, have conversations with AI to explore your thoughts, link related entries, and use templates to get started.

## ✨ Features

### Core Journaling
- **Date-based entries**: Organize your journal entries by date
- **Rich text editing**: Write and edit your journal entries with a clean interface
- **Entry linking**: Connect related journal entries to explore themes and patterns
- **Entry analysis**: AI-powered analysis of your entries to detect moods, themes, and places
- **Word count**: Track the length of your entries

### AI-Powered Features
- **AI conversations**: Have meaningful conversations with AI models via OpenRouter
- **Conversation summaries**: Generate summaries of your AI conversations
- **Message editing**: Edit and refine your conversation messages
- **Template prompts**: Use predefined templates to jumpstart your journaling
- **Model selection**: Choose from various AI models available through OpenRouter

### User Experience
- **Multi-language support**: English and French localization
- **Dark/Light theme**: Comfortable reading in any lighting condition
- **Responsive design**: Works seamlessly on desktop and mobile devices
- **Real-time saving**: Automatic saving of your entries with status indicators
- **Draft management**: Save and manage conversation drafts with bulk actions

### Authentication & Data
- **Firebase Authentication**: Sign in with Google or continue anonymously
- **Cloud storage**: Your entries are securely stored in Firebase Firestore
- **User settings**: Manage your API keys and preferences

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Comprehensive testing**: Test suite with Vitest and Testing Library
- **Modern UI components**: Built with Shadcn UI and Radix UI primitives

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (for authentication and data storage)
- OpenRouter API key (configured in the application after setup)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd mivoa
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Optional:
```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
TEST_OPENROUTER_API_KEY=your-openrouter-api-key
```

The `TEST_OPENROUTER_API_KEY` variable is optional and only needed for testing API key validation with `npm run test:openrouter-key`.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### OpenRouter API Key Setup

After starting the application and signing in, you'll need to configure your OpenRouter API key to enable AI features:

1. Navigate to Settings in the application
2. Enter your OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))
3. The key is securely stored in your user settings

Alternatively, you can use OpenRouter OAuth to connect your account directly.

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Run tests with Vitest UI
npm run test:ui

# Test OpenRouter API key validation
npm run test:openrouter-key
```

## 📁 Project Structure

```
src/
├── ai/                      # AI services and utilities
│   ├── services/           # Chat, summary, analysis services
│   ├── types/              # AI-related type definitions
│   └── utils/              # Prompt builders and utilities
├── app/                    # Next.js app router pages
│   ├── api/                # API routes
│   ├── about/              # About page
│   ├── auth/               # Authentication pages
│   ├── contact/            # Contact page
│   ├── legal/              # Legal pages
│   ├── privacy/            # Privacy policy
│   └── terms/              # Terms of service
├── components/             # React components
│   ├── ui/                 # Reusable UI components (shadcn)
│   └── __tests__/          # Component tests
├── context/                # React context providers
│   └── __tests__/          # Context tests
├── firebase/               # Firebase integration
│   ├── auth/               # Authentication utilities
│   ├── firestore/          # Firestore utilities
│   └── __tests__/          # Firebase tests
├── hooks/                  # Custom React hooks
│   └── __tests__/          # Hook tests
├── lib/                    # Utility functions and clients
│   └── __tests__/          # Library tests
├── locales/                # Translation files (en.json, fr.json)
├── utils/                  # Application utilities
│   └── __tests__/          # Utility tests
└── test/                   # Test configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:run` - Run tests once (for CI)
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate test coverage
- `npm run test:ci` - Run tests for CI/CD pipeline (lint + typecheck + tests)
- `npm run test:openrouter-key` - Test OpenRouter API key validation

### Code Quality

This project follows strict code quality standards:

- ESLint configuration for consistent code style
- TypeScript for full type safety
- Comprehensive test coverage with Vitest
- Clean Code principles (no comments, clear naming, small functions)
- Modular architecture with clear separation of concerns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m '✨ Feat: Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [OpenRouter](https://openrouter.ai/) for AI capabilities
- Backend services provided by [Firebase](https://firebase.google.com/)
