#!/bin/bash

# Comprehensive test script for AI Platform
# This script runs all available tests to verify functionality

echo "🧪 AI Platform Comprehensive Testing"
echo "===================================="

# Set up environment for testing
export TEST_API_URL=${TEST_API_URL:-http://localhost:3000}
echo "Using test API URL: $TEST_API_URL"

echo -e "\n⏳ Starting tests..."

# Check if server is running
echo -e "\n🔍 Checking server status"
server_status=$(curl -s "${TEST_API_URL}/health")
if [[ $server_status == *"status"*"ok"* ]]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Starting server..."
    
    # Try to start the server in the background
    echo "Starting orchestrator server..."
    cd /workspaces/n8n && node packages/orchestrator/dist/server.js > orchestrator.log 2>&1 &
    server_pid=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    for i in {1..10}; do
        sleep 2
        if curl -s "${TEST_API_URL}/health" | grep -q "ok"; then
            echo "✅ Server started successfully"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ Server failed to start. Check orchestrator.log for details."
            exit 1
        fi
    done
fi

# Run all tests
echo -e "\n📋 Running all tests"

# Test 1: MCP Integration
echo -e "\n🧪 Testing MCP Integration"
node /workspaces/n8n/test-mcp-integration.js

# Test 2: Workflow Library
echo -e "\n🧪 Testing Workflow Library"
/workspaces/n8n/test-workflow-library.sh

# Test 3: MCP Server Generator
echo -e "\n🧪 Testing MCP Server Generator"
/workspaces/n8n/test-mcp-server-generator.sh

echo -e "\n✅ All tests completed"
