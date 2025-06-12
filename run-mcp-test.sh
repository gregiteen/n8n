#!/bin/bash

# Script to test MCP implementation
# This script builds and starts the orchestrator, then runs the MCP integration tests

echo "🚀 Testing MCP Implementation"
echo "============================"

# Ensure node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found."
    exit 1
fi

# Set up environment
export PORT=${PORT:-3000}

# Build the orchestrator
echo "📦 Building orchestrator..."
cd packages/orchestrator
npm install
npm run build
cd ../..

# Start the orchestrator in the background
echo "🚀 Starting orchestrator service..."
node packages/orchestrator/dist/server.js &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Run the tests
echo "🧪 Running MCP integration tests..."
node test-mcp-integration.js

# Capture test result
TEST_RESULT=$?

# Stop the orchestrator
echo "🛑 Stopping orchestrator service..."
kill $SERVER_PID

# Return test result
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ MCP integration tests passed!"
    exit 0
else
    echo "❌ MCP integration tests failed."
    exit 1
fi
