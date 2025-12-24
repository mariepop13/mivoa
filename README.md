# Mivoa

A modern web application built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Component Library**: Shadcn UI components powered by Radix UI
- **TypeScript**: Full type safety throughout the application
- **Comprehensive Testing**: Test suite with Vitest and Testing Library
- **Dark Mode**: Theme support with next-themes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

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

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run UI tests
npm run test:ui
```

## 📁 Project Structure

```
src/
├── app/                  # Next.js app router pages
├── components/           # React components
│   └── ui/              # Reusable UI components (shadcn)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── test/                # Test configuration
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
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate test coverage
- `npm run test:ci` - Run tests for CI/CD pipeline

### Code Quality

This project follows strict code quality standards:

- ESLint configuration for consistent code style
- TypeScript for full type safety
- Comprehensive test coverage with Vitest
- Clean Code principles (no comments, clear naming, small functions)
- Gitflow branching strategy with Gitmoji commit messages

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

