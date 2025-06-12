#!/bin/bash

# Test script for verifying Workflow Library functionality
# This script tests the Workflow Library API endpoints

echo "🧪 Testing Workflow Library API"
echo "==============================="

# Configuration
BASE_URL=${TEST_API_URL:-http://localhost:3000}
API_PATH="/api/workflow-library"

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

# Test 1: Get all workflows (initially empty or with example workflows)
echo -e "\n🔍 Getting all workflows"
make_request "GET" "$API_PATH"

# Test 2: Create a new workflow
echo -e "\n➕ Creating new workflow"
workflow_data='{
  "metadata": {
    "name": "Test Workflow",
    "description": "A test workflow for API testing",
    "tags": ["test", "api", "demo"]
  },
  "definition": {
    "nodes": [
      {
        "name": "Start",
        "type": "webhook",
        "parameters": {
          "path": "test",
          "responseMode": "onReceived"
        }
      },
      {
        "name": "HTTP Request",
        "type": "httpRequest",
        "parameters": {
          "url": "https://jsonplaceholder.typicode.com/todos/1",
          "method": "GET"
        }
      }
    ],
    "connections": {
      "Start": {
        "main": [
          [
            {
              "node": "HTTP Request",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  }
}'
created_workflow=$(make_request "POST" "$API_PATH" "$workflow_data")

# Extract the workflow ID (assuming the response includes an id field)
workflow_id=$(echo "$created_workflow" | jq -r '.id')

if [ "$workflow_id" == "null" ] || [ -z "$workflow_id" ]; then
  echo "❌ Failed to get workflow ID from response"
  workflow_id="test-workflow" # Fallback ID for testing
fi

# Test 3: Get the created workflow by ID
echo -e "\n🔍 Getting workflow by ID: $workflow_id"
make_request "GET" "$API_PATH/$workflow_id"

# Test 4: Execute the workflow
echo -e "\n▶️ Executing workflow"
execution_data='{
  "data": {
    "input": {
      "testValue": 123
    }
  }
}'
make_request "POST" "$API_PATH/$workflow_id/execute" "$execution_data"

# Test 5: Get workflows by category
echo -e "\n🔍 Getting workflows by category"
make_request "GET" "$API_PATH/category/test"

# Test 6: Get workflows by tag
echo -e "\n🔍 Getting workflows by tag"
make_request "GET" "$API_PATH/tag/demo"

# Test 7: Update the workflow
echo -e "\n✏️ Updating workflow"
update_data='{
  "metadata": {
    "name": "Updated Test Workflow",
    "description": "Updated description for the test workflow",
    "tags": ["test", "api", "demo", "updated"]
  }
}'
make_request "PUT" "$API_PATH/$workflow_id" "$update_data"

echo -e "\n✅ Workflow Library verification tests completed"
