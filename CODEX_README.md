# 🤖 Codex Quick Start - n8n AI Agent Platform

This guide is optimized for **OpenAI Codex** cloud environment.

## 🚀 Quick Commands for Codex

### Initial Setup
```bash
# In OpenAI Codex, you're already in the project root after cloning
# Use the no-frozen-lockfile flag to handle dependency issues
./codex-setup.sh --no-frozen-lockfile

# Or step by step:
pnpm install --no-frozen-lockfile
pnpm build
```

### Development Commands
```bash
# Start all services
pnpm dev

# Start admin dashboard only (port 3001)
pnpm dev:admin

# Start n8n core only (port 5678)  
pnpm start

# Build everything
pnpm build

# Build admin dashboard only
pnpm build:admin
```

### Code Quality
```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lintfix

# Run tests
pnpm test

# Test admin dashboard only
pnpm test:admin
```

## 📁 Key Directories for Codex Tasks

### Admin Dashboard (`packages/admin-dashboard/`)
- **Pages**: `src/app/` - Next.js 13+ app router
- **Components**: `src/components/` - React components
- **Hooks**: `src/hooks/` - Data management hooks
- **Types**: `src/types/` - TypeScript definitions

### Main n8n (`packages/`)
- **CLI**: `cli/` - Command line interface
- **Core**: `core/` - Core n8n functionality  
- **Frontend**: `frontend/` - Main n8n UI
- **Nodes**: `nodes-base/` - Node implementations

## 🎯 Common Codex Tasks

### Admin Dashboard Development
```bash
# Navigate to admin dashboard
cd packages/admin-dashboard

# Start development
pnpm dev

# The dashboard runs on http://localhost:3001
```

### Adding New Components
1. Create component in `packages/admin-dashboard/src/components/`
2. Add types in `packages/admin-dashboard/src/types/`
3. Add hooks in `packages/admin-dashboard/src/hooks/`
4. Update pages in `packages/admin-dashboard/src/app/`

### Running Tests
```bash
# All tests
pnpm test

# Admin dashboard tests only
cd packages/admin-dashboard && pnpm test

# Specific test file
cd packages/admin-dashboard && pnpm test user-stats.test.tsx
```

## 🛠️ Tech Stack

### Admin Dashboard
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **Data Fetching**: React Query
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Code Quality Tools
- **Formatter**: Biome (`biome.jsonc`)
- **Linter**: ESLint (`.eslintrc.js`)
- **Type Checker**: TypeScript
- **Testing**: Jest + React Testing Library

## 🔧 Environment Setup

The setup script creates a `.env` file with:
```bash
# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http

# Admin Dashboard
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-development-secret

# Database
DATABASE_TYPE=sqlite
DB_SQLITE_DATABASE=${HOME}/.n8n/database.sqlite
```

## 📋 Verification Steps

After making changes:
1. **Build**: `pnpm build` - Ensure everything compiles
2. **Lint**: `pnpm lint` - Check code quality
3. **Test**: `pnpm test` - Run test suite
4. **Start**: `pnpm dev` - Test in development

## 🐛 Troubleshooting

### Common Issues
- **Port conflicts**: Admin dashboard uses 3001, n8n uses 5678
- **Build failures**: Run `pnpm clean && pnpm install`
- **TypeScript errors**: Check import paths in `src/` directories
- **Module not found**: Ensure you're in the right package directory

### Quick Fixes
```bash
# Reset everything
pnpm clean
pnpm install
pnpm build

# Fix linting
pnpm lintfix

# Clear Next.js cache
cd packages/admin-dashboard && rm -rf .next
```

## 📚 Key Files for Codex

### Configuration
- `AGENTS.md` - Codex instructions (this file!)
- `biome.jsonc` - Code formatting
- `turbo.json` - Build configuration
- `pnpm-workspace.yaml` - Workspace setup

### Admin Dashboard
- `packages/admin-dashboard/package.json` - Dependencies
- `packages/admin-dashboard/.eslintrc.js` - Linting rules
- `packages/admin-dashboard/next.config.js` - Next.js config
- `packages/admin-dashboard/tailwind.config.js` - Styling config

---

**For Codex agents**: This repository uses a monorepo structure with pnpm workspaces. Most admin dashboard work happens in `packages/admin-dashboard/`. The main development command is `pnpm dev` which starts both n8n core and the admin dashboard.
