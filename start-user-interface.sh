#!/bin/bash

# AI Platform - User Interface Startup Script
# Start the Task Manager interface on port 3002

echo "🚀 Starting AI Platform - User Interface (Task Manager)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to user interface directory
cd "$(dirname "$0")/packages/user-interface"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

echo "🌐 Starting development server on http://localhost:3002"
echo "📋 Access the Task Manager interface to:"
echo "   • Monitor AI agent tasks in real-time"
echo "   • Chat with AI agents"
echo "   • Manage workflows"
echo "   • Configure settings"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start the development server
pnpm run dev
