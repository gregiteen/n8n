#!/bin/bash

# Test script for verifying MCP Server Generator functionality
# This script tests the MCP Server Generator API endpoints

echo "🧪 Testing MCP Server Generator API"
echo "======================================"

# Configuration
BASE_URL=${TEST_API_URL:-http://localhost:3000}
API_PATH="/api/mcp-servers"

# Helper function for making requests
function make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  echo -e "\n📡 ${method} ${BASE_URL}${endpoint}"
  
  if [ -n "$data" ]; then
    # With request body
    response=$(curl -s -X "${method}" \
      -H "Content-Type: application/json" \
      -d "${data}" \
      "${BASE_URL}${endpoint}")
  else
    # Without request body
    response=$(curl -s -X "${method}" "${BASE_URL}${endpoint}")
  fi
  
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Test 1: Get all server definitions (initially empty)
echo -e "\n🔍 Getting all MCP server definitions"
make_request "GET" "$API_PATH"

# Test 2: Create a new server definition from the example file
echo -e "\n➕ Creating new MCP server definition from example"
server_data=$(cat ./packages/orchestrator/example-api-definitions/weather-api.json)
created_server=$(make_request "POST" "$API_PATH" "$server_data")

# Extract the server ID (assuming the response includes an id field)
server_id=$(echo "$created_server" | jq -r '.id')

if [ "$server_id" == "null" ] || [ -z "$server_id" ]; then
  echo "❌ Failed to get server ID from response"
  server_id="example-server" # Fallback ID for testing
fi

# Test 3: Get the created server definition by ID
echo -e "\n🔍 Getting server definition by ID: $server_id"
make_request "GET" "$API_PATH/$server_id"

# Test 4: Start the MCP server
echo -e "\n▶️ Starting the MCP server"
make_request "POST" "$API_PATH/$server_id/start"

# Test 5: Check server status
echo -e "\n🔍 Checking server status"
make_request "GET" "$API_PATH/$server_id/status"

# Test 6: Test OpenAPI spec generation
echo -e "\n📝 Testing OpenAPI spec generation"
openapi_data='{
  "url": "https://petstore3.swagger.io/api/v3/openapi.json"
}'
make_request "POST" "$API_PATH/generate-from-openapi" "$openapi_data"

# Test 7: Stop the MCP server
echo -e "\n⏹️ Stopping the MCP server"
make_request "POST" "$API_PATH/$server_id/stop"

echo -e "\n✅ MCP Server Generator verification tests completed"
