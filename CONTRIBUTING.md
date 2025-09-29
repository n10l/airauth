# Contributing to AirAuth

We love your input! We want to make contributing to AirAuth as easy and transparent as possible.

## 🚀 Development Setup

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `pnpm install`
3. **Build packages**: `pnpm build`
4. **Run tests**: `pnpm test`
5. **Start development**: `pnpm dev`

## 📁 Project Structure

```
airauth/
├── packages/
│   ├── core/              # Core authentication library
│   ├── next/              # Next.js integration
│   ├── react/             # React hooks & components
│   └── adapter-prisma/    # Prisma database adapter
├── apps/
│   └── docs/              # Documentation site
└── apps/
    ├── docs/              # Documentation site
    └── example-nextjs/    # Example Next.js app
```

## 🔧 Development Workflow

### Working on Packages

```bash
# Work on a specific package
cd packages/core
pnpm dev

# Run tests for a package
pnpm test:watch

# Build a package
pnpm build
```

### Testing Changes

1. Use the example app to test changes:

```bash
cd apps/example-nextjs
pnpm dev
```

2. Link local packages for testing:

```bash
pnpm link @airauth/core
```

## 📝 Pull Request Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes: `pnpm test`
5. Make sure your code lints: `pnpm lint`
6. Issue that pull request!

## 🎯 Development Roadmap

### Phase 1: Core Features (Beta)

- ✅ Core authentication logic
- ✅ Next.js integration
- ✅ React hooks & components
- ✅ Prisma adapter
- ✅ OAuth providers (Google, GitHub)
- ✅ JWT & Session management

### Phase 2: Enhanced Features (v1.0)

- [ ] More database adapters (MongoDB, Drizzle)
- [ ] Additional OAuth providers
- [ ] Email authentication
- [ ] Multi-factor authentication
- [ ] Advanced session management

### Phase 3: Future Features

- [ ] React Router V7 support (@airauth/react-router-v7)
- [ ] SvelteKit adapter
- [ ] Vue integration
- [ ] WebAuthn support

## 🐛 Reporting Bugs

1. **Check existing issues** first
2. **Create a minimal reproduction**
3. **Use the bug report template**
4. **Include system information**

## 💡 Suggesting Features

1. **Check the roadmap** above
2. **Open a discussion** first
3. **Explain the use case**
4. **Consider implementation**

## 📜 Code Style

- TypeScript for all new code
- Follow existing patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Write tests for new features

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in our README and release notes.

## 📬 Contact

- GitHub Issues: [github.com/n10l/airauth/issues](https://github.com/n10l/airauth/issues)
- Discussions: [github.com/n10l/airauth/discussions](https://github.com/n10l/airauth/discussions)
- Twitter: [@_n10l_](https://twitter.com/_n10l_)

Thank you for contributing to AirAuth! 🎉
