#!/bin/bash

# Deployment script for n8n AI Platform on Vercel
# This script prepares the project for deployment

echo "🚀 Preparing n8n AI Platform for Vercel deployment..."

# Step 1: Clean and build all packages
echo "📦 Building packages..."
cd /workspaces/n8n

# Build orchestrator
echo "Building AI Orchestrator..."
cd packages/orchestrator
pnpm install
pnpm run build
cd ../..

# Build user interface
echo "Building User Interface..."
cd packages/user-interface
pnpm install
pnpm run build
cd ../..

# Step 2: Run final tests
echo "🧪 Running tests..."

# Test orchestrator
cd packages/orchestrator
pnpm run test
cd ../..

# Test user interface
cd packages/user-interface
pnpm run test
cd ../..

# Step 3: Type check everything
echo "🔍 Final type checking..."
cd packages/orchestrator
pnpm run typecheck
cd ../..

cd packages/user-interface
pnpm run type-check
cd ../..

echo "✅ All builds and tests passed!"
echo ""
echo "🌐 Ready for Vercel deployment!"
echo ""
echo "Next steps:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Login to Vercel: vercel login"
echo "3. Deploy: vercel --prod"
echo ""
echo "Environment variables needed in Vercel:"
echo "- OPENAI_API_KEY"
echo "- ANTHROPIC_API_KEY" 
echo "- GOOGLE_API_KEY"
echo "- OPENROUTER_API_KEY"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- DATABASE_URL"
echo "- NEXTAUTH_SECRET"
echo "- NEXTAUTH_URL"
