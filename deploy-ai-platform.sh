#!/bin/bash

# AI Platform - Vercel Deployment Script
# This script prepares and deploys the AI Platform to Vercel

echo "🚀 Preparing AI Platform for Vercel deployment..."
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is installed"
fi

# Navigate to project root
cd /workspaces/n8n

# Step 1: Build packages
echo "📦 Building packages..."

# Build orchestrator
echo "Building Orchestrator Service..."
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

# Step 2: Create Vercel configuration if it doesn't exist
if [ ! -f "vercel.json" ]; then
    echo "Creating Vercel configuration..."
    cat > vercel.json <<EOL
{
  "version": 2,
  "name": "ai-platform",
  "builds": [
    {
      "src": "packages/user-interface/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "packages/orchestrator/dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/orchestrator/(.*)",
      "dest": "/packages/orchestrator/dist/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/packages/user-interface/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOL
    echo "✅ Vercel configuration created"
else
    echo "✅ Vercel configuration already exists"
fi

# Step 3: Check for environment variables
echo "🔐 Checking environment variables..."
if [ -f ".env.ai-keys" ]; then
    echo "AI keys configuration found"
else
    echo "⚠️ No AI keys configuration found at .env.ai-keys"
    echo "Remember: Users will need to provide their own API keys via the web interface"
fi

# Step 4: Create .vercelignore file
echo "Creating .vercelignore file..."
cat > .vercelignore <<EOL
node_modules
.git
cypress
test-workflows
assets
docker
.github
EOL

# Step 5: Deploy to Vercel
echo ""
echo "🌐 Ready for deployment!"
echo ""
echo "To deploy to Vercel, run:"
echo "vercel login"
echo "vercel --prod"
echo ""
echo "After deployment, configure these environment variables in the Vercel dashboard:"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- JWT_SECRET"
echo "- SESSION_SECRET"
echo ""
echo "Note: AI service API keys are managed by users via the web interface"
