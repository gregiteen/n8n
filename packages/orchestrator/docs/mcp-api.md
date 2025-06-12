# n8n Model Context Protocol (MCP) API Documentation

This document provides details on how to use the Model Context Protocol (MCP) API implemented by the n8n orchestrator.

## Overview

The Model Context Protocol (MCP) allows AI models to discover and use n8n nodes as tools. This implementation provides:

1. Tool discovery - Retrieve available n8n nodes as MCP tools
2. Tool execution - Execute n8n nodes via a standardized API
3. Compatible endpoints - Support for OpenAI and Anthropic API formats

## API Endpoints

### Tool Discovery

#### Get MCP Server Schema

Retrieves the MCP server schema describing available tools.

```
GET /mcp/schema
```

Response:
```json
{
  "schema_version": "1.0",
  "server_path": "https://your-service.com/mcp",
  "name": "n8n MCP Server",
  "description": "MCP server for n8n nodes",
  "auth_mode": "none",
  "tools": [
    {
      "name": "HTTP Request",
      "description": "Make HTTP requests to any API or web service",
      "parameters": {
        "url": {
          "type": "string",
          "description": "The URL to make the request to",
          "required": true
        },
        // ...
      }
    },
    // ... more tools
  ]
}
```

#### List All Tools

Returns a list of all available tools.

```
GET /mcp/tools
```

Response:
```json
{
  "count": 10,
  "tools": [
    {
      "name": "HTTP Request",
      "description": "Make HTTP requests to any API or web service",
      "nodeName": "n8n-nodes-base.httpRequest",
      "parameters": ["url", "method", "headers", "queryParameters", "body"]
    },
    // ... more tools
  ]
}
```

#### Get Tool Details

Returns details for a specific tool.

```
GET /mcp/tools/:name
```

Response:
```json
{
  "name": "HTTP Request",
  "description": "Make HTTP requests to any API or web service",
  "nodeName": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": {
      "type": "string",
      "description": "The URL to make the request to",
      "required": true
    },
    // ... more parameters
  }
}
```

### Tool Execution

#### Execute a Tool (Standard MCP)

Executes a tool with provided parameters.

```
POST /mcp/run
```

Request:
```json
{
  "name": "HTTP Request",
  "parameters": {
    "url": "https://api.example.com/data",
    "method": "GET"
  }
}
```

Response:
```json
{
  "content": "{\"status\":200,\"data\":{\"id\":1,\"name\":\"Example\"}}"
}
```

#### OpenAI-Compatible Execution

Executes a tool using OpenAI function calling format.

```
POST /mcp/functions
```

Request:
```json
{
  "name": "HTTP Request",
  "parameters": {
    "url": "https://api.example.com/data",
    "method": "GET"
  }
}
```

Response:
```json
{
  "role": "function",
  "name": "HTTP Request",
  "content": "{\"status\":200,\"data\":{\"id\":1,\"name\":\"Example\"}}"
}
```

#### Anthropic-Compatible Execution

Executes a tool using Anthropic tool use format.

```
POST /mcp/anthropic
```

Request:
```json
{
  "name": "HTTP Request",
  "parameters": {
    "url": "https://api.example.com/data",
    "method": "GET"
  }
}
```

Response:
```json
{
  "type": "tool_result",
  "content": "{\"status\":200,\"data\":{\"id\":1,\"name\":\"Example\"}}",
  "tool_name": "HTTP Request"
}
```

## Error Handling

All endpoints return JSON error responses with an `error` field:

```json
{
  "error": "Tool 'NonExistentTool' not found"
}
```

HTTP status codes:
- 200: Success
- 400: Bad request (invalid parameters or tool not found)
- 429: Rate limit exceeded
- 500: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse. Currently, the limit is set to 60 requests per minute per IP address.

## Example Usage

### cURL Example

```bash
# Get available tools
curl -X GET "https://your-service.com/mcp/tools"

# Execute a tool
curl -X POST "https://your-service.com/mcp/run" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HTTP Request",
    "parameters": {
      "url": "https://jsonplaceholder.typicode.com/todos/1",
      "method": "GET"
    }
  }'
```

### JavaScript Example

```javascript
async function executeHttpRequest() {
  const response = await fetch("https://your-service.com/mcp/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "HTTP Request",
      parameters: {
        url: "https://jsonplaceholder.typicode.com/todos/1",
        method: "GET"
      }
    })
  });
  
  const data = await response.json();
  console.log(data);
}

executeHttpRequest();
```
