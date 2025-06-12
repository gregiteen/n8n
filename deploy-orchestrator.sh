#!/bin/bash

# n8n AI Platform - Vercel Deployment Script
# This script prepares and deploys the AI Platform to Vercel

echo "🚀 Preparing n8n AI Platform for Vercel deployment..."
echo "=========================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is installed"
fi

# Navigate to project root
cd "$(dirname "$0")"

# Step 1: Clean and build all packages
echo "📦 Building packages..."

# Build orchestrator
echo "Building AI Orchestrator..."
cd packages/orchestrator
npm install
npm run build
cd ../..

# Step 2: Make sure vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "Creating Vercel configuration..."
    cat > vercel.json <<EOL
{
  "version": 2,
  "name": "n8n-ai-platform",
  "builds": [
    {
      "src": "packages/orchestrator/dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/packages/orchestrator/dist/server.js"
    },
    {
      "src": "/mcp/(.*)",
      "dest": "/packages/orchestrator/dist/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/packages/orchestrator/dist/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "OPENAI_API_KEY": "${OPENAI_API_KEY}",
    "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
    "PORT": "${PORT}",
    "MAX_JSON_REQUEST_SIZE": "${MAX_JSON_REQUEST_SIZE}",
    "NEXTAUTH_SECRET": "${NEXTAUTH_SECRET}",
    "NEXTAUTH_URL": "${NEXTAUTH_URL}"
  },
  "functions": {
    "packages/orchestrator/dist/server.js": {
      "maxDuration": 30
    }
  }
EOL
    echo "✅ Vercel configuration created"
else
    echo "✅ Vercel configuration already exists"
fi

# Step 3: Create .vercelignore file
echo "Creating .vercelignore file..."
cat > .vercelignore <<EOL
node_modules
.git
.github
tmp
*.log
.DS_Store
packages/cli
packages/core
packages/design-system
packages/editor-ui
packages/nodes-base/dist
packages/nodes-base/node_modules
packages/frontend
packages/admin-dashboard
packages/workflow
packages/@n8n
packages/node-dev
packages/extensions
packages/user-interface/node_modules
packages/privacy-layer
cypress
docker
scripts
test-workflows
EOL

# Step 4: Set up environment variables
echo ""
echo "🔐 Setting up environment variables..."
echo ""

# Declare array of required environment variables
declare -a ENV_VARS=(
  "OPENAI_API_KEY:your OpenAI API key for AI functionality"
  "ANTHROPIC_API_KEY:your Anthropic API key for AI functionality (optional)"
  "PORT:port to run the service on (defaults to 3000)"
  "MAX_JSON_REQUEST_SIZE:maximum JSON request size in MB (defaults to 5)"
  "NEXTAUTH_SECRET:secret for NextAuth authentication"
  "NEXTAUTH_URL:URL for NextAuth authentication (your deployment URL)"
)

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  touch .env
  echo "Created .env file"
fi

# Load existing environment variables from .env
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Prompt for environment variables if not already set
for env_var in "${ENV_VARS[@]}"; do
  # Split the string by colon
  var_name="${env_var%%:*}"
  var_desc="${env_var#*:}"
  
  # Check if variable is already set
  if [ -z "${!var_name}" ]; then
    read -p "Enter $var_desc: " var_value
    echo "$var_name=$var_value" >> .env
    export "$var_name=$var_value"
  else
    echo "✅ $var_name is already set"
  fi
done

# Step 5: Update vercel.json with environment variables
echo "Updating Vercel configuration with environment variables..."
# Get all environment variables from .env file
env_json=$(grep -v '^#' .env | sed 's/^/"/;s/=/": "${/;s/$/}"/' | tr '\n' ',' | sed 's/,$//')

# Update vercel.json env section
sed -i'.bak' "s/\"env\": {[^}]*}/\"env\": {$env_json}/" vercel.json
rm -f vercel.json.bak

# Step 6: Create needed directories if they don't exist
mkdir -p packages/orchestrator/dist/logs

# Step 7: Deploy to Vercel
echo ""
echo "🚀 Ready to deploy to Vercel!"
echo ""

# Check if we should auto-deploy
echo "Do you want to deploy to Vercel now? (y/n)"
read -p "> " auto_deploy

if [ "$auto_deploy" = "y" ] || [ "$auto_deploy" = "Y" ]; then
  # Check if user is logged in to Vercel
  if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
  fi
  
  # Deploy to Vercel
  echo "Deploying to Vercel..."
  vercel --prod --yes
else
  echo ""
  echo "To deploy your AI Platform manually, run:"
  echo "vercel login"
  echo "vercel --prod"
fi
echo ""
echo "After deployment, make sure to set these environment variables in the Vercel Dashboard:"
echo "- OPENAI_API_KEY"
echo "- ANTHROPIC_API_KEY (if using Anthropic models)"
echo "- NEXTAUTH_SECRET"
echo "- NEXTAUTH_URL (should match your deployment URL)"
echo ""
