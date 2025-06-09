#!/bin/bash

# Script to load AI platform API keys into the application
# This script copies the AI keys from the root .env.ai-keys file to both the
# orchestrator and user-interface packages

echo "🔑 Loading AI platform API keys..."

# Check if .env.ai-keys exists
if [ ! -f "/workspaces/n8n/.env.ai-keys" ]; then
    echo "❌ Error: AI keys file not found at /workspaces/n8n/.env.ai-keys"
    exit 1
fi

# Add keys to orchestrator
echo "📦 Adding AI keys to orchestrator package..."
cat /workspaces/n8n/.env.ai-keys >> /workspaces/n8n/packages/orchestrator/.env.local

# Add keys to user-interface 
echo "🖥️ Adding AI keys to user-interface package..."
cat /workspaces/n8n/.env.ai-keys >> /workspaces/n8n/packages/user-interface/.env.local

echo "✅ AI platform API keys loaded successfully!"
echo "You can now start the application with 'npm start' or deploy it to Vercel."
