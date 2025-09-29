# Development Guide

Quick development setup for the AirAuth Next.js example.

## Prerequisites

- Node.js 18+
- npm/yarn/pnpm package manager
- A Google Cloud Console account (for Google OAuth)
- A GitHub account (for GitHub OAuth)

## Local Development Setup

### 1. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env.local

# Edit the file with your OAuth credentials
nano .env.local
```

Required environment variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 2. Install Dependencies

From the example directory:

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Testing Authentication

### Demo Login (Credentials Provider)

- **Email**: Any valid email format
- **Password**: `password`

### OAuth Testing

- Use your real Google or GitHub accounts
- Make sure redirect URIs are configured correctly in OAuth apps

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run ESLint
npm run lint

# Clean build artifacts
npm run clean
```

## File Structure for Development

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # Auth configuration
│   ├── dashboard/page.tsx               # Protected route example
│   ├── layout.tsx                       # SessionProvider setup
│   ├── page.tsx                         # Landing page
│   └── globals.css                      # Tailwind styles
├── middleware.ts                        # Route protection
├── next.config.js                       # Next.js config
└── tailwind.config.js                   # Styling config
```

## Key Development Features

- **Hot Reload**: Changes are reflected immediately
- **TypeScript**: Full type safety with AirAuth types
- **Tailwind CSS**: Utility-first styling with custom components
- **ESLint**: Code quality and consistency
- **Route Protection**: Middleware-based authentication

## Common Development Issues

### OAuth Not Working

1. Check redirect URIs in OAuth provider settings
2. Verify `NEXTAUTH_URL` matches your development URL
3. Ensure OAuth secrets are properly set

### Session Not Persisting

1. Verify `NEXTAUTH_SECRET` is set and consistent
2. Check browser cookies are enabled
3. Clear browser data and try again

### TypeScript Errors

1. Run `npm run type-check` for detailed errors
2. Ensure all dependencies are installed
3. Check import paths for AirAuth packages

### Styling Issues

1. Verify Tailwind is configured correctly
2. Check CSS import order in `globals.css`
3. Run build to check for conflicts

## Production Notes

When deploying to production:

1. **Environment Variables**: Set proper production values
2. **OAuth Redirects**: Update redirect URIs to production domains
3. **Security**: Use strong `NEXTAUTH_SECRET` and enable HTTPS
4. **Database**: Consider using a database adapter for production
5. **Session Storage**: Configure Redis or database sessions for scaling

## Next Steps

- Add database integration with Prisma adapter
- Implement role-based access control
- Add email verification flow
- Set up session storage with Redis
- Configure additional OAuth providers
