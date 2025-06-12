#!/bin/bash

# Vercel Deployment Verification Script
# This script verifies the deployed AI Platform on Vercel by testing its MCP endpoints

# Exit on any error
set -e

# Configuration
DEPLOYMENT_URL=${1:-"https://your-deployment-url.vercel.app"}

echo "🚀 Verifying AI Platform at: $DEPLOYMENT_URL"
echo "==========================================="

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local payload=$3

    echo -e "\n📡 Testing $endpoint"
    
    if [ -z "$payload" ]; then
        # GET request
        curl -s -X $method "$DEPLOYMENT_URL$endpoint" \
            -H "Content-Type: application/json" \
            | jq '.'
    else
        # POST request with payload
        curl -s -X $method "$DEPLOYMENT_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            | jq '.'
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Request successful"
    else
        echo "❌ Request failed"
        return 1
    fi
}

echo -e "\n🔍 Verifying MCP Schema"
make_request "GET" "/mcp/schema"

echo -e "\n🔍 Verifying Available Tools"
make_request "GET" "/mcp/tools"

echo -e "\n🔍 Executing MCP Tool (HTTP Request)"
make_request "POST" "/mcp/run" '{
    "name": "HTTPRequest",
    "parameters": {
        "url": "https://jsonplaceholder.typicode.com/todos/1",
        "method": "GET"
    }
}'

echo -e "\n✅ Deployment verification complete!"
