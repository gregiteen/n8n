#!/bin/bash

# n8n AI Nodes Testing Startup Script
# Simple script to start n8n for testing our integrated AI nodes

set -e

echo "🚀 Starting n8n for AI Nodes Testing..."

cd /workspaces/n8n

# Start n8n in development mode
echo "Starting n8n server..."
pnpm run dev:ai

echo "✅ n8n should be available at http://localhost:5678"
echo "📝 Follow the AI_NODES_TESTING_GUIDE.md for testing instructions"
