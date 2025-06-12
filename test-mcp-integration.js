/**
 * Test Script for MCP Integration
 * 
 * This script tests the MCP endpoints of the AI Platform to verify proper integration
 * of n8n nodes as MCP tools.
 * 
 * Usage:
 * node test-mcp-integration.js
 */

// Import the required modules
const axios = require('axios');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Configuration
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const MCP_BASE_PATH = '/mcp';

console.log('🧪 Testing MCP Integration for AI Platform');
console.log('=========================================');

// Helper function to make requests with consistent formatting
async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 ${method.toUpperCase()} ${url}`);
  
  try {
    const config = {
      method,
      url,
      ...(data && { data }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    // Wait for the server to be fully initialized
    console.log('⏳ Waiting for server initialization...');
    await sleep(2000);
    
    console.log('\n🔍 Testing MCP Schema Endpoint');
    const schema = await makeRequest('get', `${MCP_BASE_PATH}/schema`);
    console.log(`   Server name: ${schema.name}`);
    console.log(`   Schema version: ${schema.schema_version}`);
    console.log(`   Tool count: ${schema.tools.length}`);
    
    console.log('\n🔍 Testing MCP Tools Endpoint');
    const toolsResponse = await makeRequest('get', `${MCP_BASE_PATH}/tools`);
    console.log(`   Available tools: ${toolsResponse.count}`);
    console.log('   First 3 tools:');
    toolsResponse.tools.slice(0, 3).forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
    });
    
    if (toolsResponse.tools.length > 0) {
      const testTool = toolsResponse.tools[0];
      
      console.log(`\n🔍 Testing Specific Tool: ${testTool.name}`);
      const toolDetails = await makeRequest('get', `${MCP_BASE_PATH}/tools/${encodeURIComponent(testTool.name)}`);
      console.log(`   Tool name: ${toolDetails.name}`);
      console.log(`   Parameters: ${Object.keys(toolDetails.parameters || {}).join(', ')}`);
      
      console.log(`\n🧪 Testing Tool Execution: ${testTool.name}`);
      // Prepare test parameters based on the tool type
      let testParameters = {};
      
      if (toolDetails.name.toLowerCase().includes('http')) {
        testParameters = {
          url: 'https://jsonplaceholder.typicode.com/todos/1',
          method: 'GET'
        };
      } else if (toolDetails.name.toLowerCase().includes('csv') || toolDetails.name.toLowerCase().includes('parse')) {
        testParameters = {
          data: 'column1,column2\nvalue1,value2\nvalue3,value4'
        };
      } else if (toolDetails.name.toLowerCase().includes('transform')) {
        testParameters = {
          data: { key1: 'value1', key2: 'value2' },
          operations: [
            { operation: 'add', field: 'key3', value: 'value3' }
          ]
        };
      }
      
      const executionRequest = {
        name: toolDetails.name,
        parameters: testParameters
      };
      
      const executionResult = await makeRequest('post', `${MCP_BASE_PATH}/run`, executionRequest);
      console.log(`   Execution result: ${JSON.stringify(executionResult, null, 2)}`);
    }
    
    console.log('\n✅ All MCP integration tests completed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the tests
runTests()
  .then(success => {
    if (success) {
      console.log('\n🎉 MCP Integration is functioning properly!');
      process.exit(0);
    } else {
      console.log('\n⚠️ MCP Integration has issues that need to be addressed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
