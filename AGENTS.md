# n8n AI Agent Platform - Developer Guide

## Overview
This repository contains the n8n AI Agent Platform with an admin dashboard for monitoring and user management. The main components are:

- **Core n8n**: Main automation platform
- **Admin Dashboard**: Next.js React app for system monitoring (`packages/admin-dashboard/`)
- **AI Orchestrator**: Agent management system
- **Privacy Layer**: Data protection components

## Quick Start Commands

### For OpenAI Codex Agent Tasks
```bash
# Codex clones the repo directly into the working directory
# Use these commands in order:

# 1. Install dependencies (required first)
pnpm install

# 2. Build the project 
pnpm build

# 3. Start development servers
pnpm dev

# Admin dashboard will be on http://localhost:3001
# Main n8n will be on http://localhost:5678
```

### Alternative: One-line setup
```bash
pnpm install && pnpm build && pnpm dev
```

### Admin Dashboard Specific
```bash
# Navigate to admin dashboard (if needed)
cd packages/admin-dashboard

# Install dependencies (if not done at root)
pnpm install

# Start admin dashboard in development (port 3001)
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test

# Return to root
cd ../../
```

## Project Structure
```
packages/
├── admin-dashboard/          # Privacy-first admin dashboard (Next.js + React)
├── cli/                     # n8n CLI
├── core/                    # n8n core functionality
├── frontend/                # Main n8n frontend
└── nodes-base/              # Base node implementations
```

## Development Environment

### Required Tools
- Node.js 22.16+
- pnpm (package manager)
- Docker (for full stack development)

### Setup Scripts
- `./start.sh` - Quick development startup
- `./dev-setup.sh` - Complete environment setup for new developers

### Key Configuration Files
- `biome.jsonc` - Code formatting (Biome)
- `packages/admin-dashboard/.eslintrc.js` - Admin dashboard linting
- `turbo.json` - Monorepo build configuration
- `pnpm-workspace.yaml` - Workspace configuration

## Testing Instructions

### Run All Tests
```bash
# From project root
pnpm test

# Admin dashboard tests only
cd packages/admin-dashboard && pnpm test
```

### Linting and Formatting
```bash
# Check linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Biome
pnpm format
```

### Build Verification
```bash
# Build all packages
pnpm build

# Build admin dashboard only
cd packages/admin-dashboard && pnpm build
```

## Admin Dashboard Development

### Key Components
- `src/app/` - Next.js 13+ app router pages
- `src/components/` - Reusable React components
- `src/hooks/` - Custom React hooks for data management
- `src/lib/` - Utility functions and configurations

### Tech Stack
- **Framework**: Next.js 13+ (App Router)
- **UI**: Radix UI primitives + Tailwind CSS
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Development Workflow
1. Start development server: `pnpm dev`
2. Admin dashboard runs on `http://localhost:3001`
3. Main n8n runs on `http://localhost:5678`

## Code Quality Standards

### ESLint Rules
- Extends n8n base configuration
- React/Next.js specific rules enabled
- TypeScript strict mode
- Import ordering and organization
- Accessibility checks (jsx-a11y)

### File Naming Conventions
- Use kebab-case for files: `user-stats.tsx`
- Use PascalCase for components: `UserStats`
- Use camelCase for functions and variables

### Import Organization
```typescript
// External libraries
import React from 'react'
import { useQuery } from '@tanstack/react-query'

// Internal components
import { Button } from '@/components/ui/button'
import { UserStats } from '@/components/users/user-stats'

// Types and utilities
import type { User } from '@/types/user'
```

## Workstream Progress

### Completed ✅
- Admin dashboard foundation (Next.js + React + TypeScript)
- User management components and hooks
- Agent monitoring interface
- Startup scripts for development
- ESLint configuration

### In Progress 🚧
- Workflow management components
- Analytics and insights dashboard
- Privacy settings interface
- API backend integration

### Pending 📋
- Authentication system
- Real-time monitoring
- Docker integration
- End-to-end tests

## Environment Variables

### Required for Development
```bash
# Database
DATABASE_TYPE=sqlite
DB_SQLITE_DATABASE=n8n.sqlite

# Admin Dashboard
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key

# n8n Core
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
```

## Pull Request Guidelines

### Title Format
`[admin-dashboard] Brief description of changes`

### Before Submitting
1. Run tests: `pnpm test`
2. Check linting: `pnpm lint`
3. Build successfully: `pnpm build`
4. Update relevant documentation
5. Add tests for new features

### Review Checklist
- [ ] Code follows established patterns
- [ ] Components are properly typed
- [ ] Tests pass and cover new functionality
- [ ] No console errors or warnings
- [ ] Accessibility standards met
- [ ] Performance considerations addressed

## Troubleshooting

### Common Issues
- **Build failures**: Clear `.next` and `node_modules`, reinstall dependencies
- **Port conflicts**: Admin dashboard uses 3001, main n8n uses 5678
- **TypeScript errors**: Check import paths and type definitions
- **Linting errors**: Run `pnpm lint:fix` to auto-fix issues

### Useful Commands
```bash
# Clear all build artifacts
pnpm clean

# Reset dependencies
rm -rf node_modules packages/*/node_modules
pnpm install

# Check dependency issues
pnpm audit

# Update dependencies
pnpm update
```

## Resources

- [n8n Documentation](https://docs.n8n.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Components](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
