/**
 * MCP Server Generator Service
 *
 * This service allows AI agents to generate Model Context Protocol (MCP) servers
 * for accessing external APIs and then using them in workflows.
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { parseOpenAPISpec } from '../mcp/openapi-to-mcp';

export interface APIEndpoint {
	method: string;
	path: string;
	description: string;
	parameters?: Record<string, any>;
	responseSchema?: Record<string, any>;
}

export interface APIDefinition {
	name: string;
	baseUrl: string;
	description: string;
	authentication: {
		type: 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2';
		location?: 'header' | 'query';
		key?: string;
	};
	endpoints: APIEndpoint[];
}

export interface MCPServerDefinition {
	id: string;
	name: string;
	description: string;
	apiDefinition: APIDefinition;
	createdAt: Date;
	updatedAt: Date;
}

@Service()
export class MCPServerGeneratorService {
	private serversDir: string;
	private serverDefinitions: Map<string, MCPServerDefinition> = new Map();
	private runningServers: Map<string, { port: number; process: any }> = new Map();
	private basePort: number = 8000;

	constructor(@Inject(Logger) private readonly logger: Logger) {
		this.logger = this.logger.scoped('mcp-server-generator');

		// Set up servers directory
		this.serversDir = path.resolve(__dirname, '../../mcp-servers');

		// Create directory if it doesn't exist
		if (!fs.existsSync(this.serversDir)) {
			fs.mkdirSync(this.serversDir, { recursive: true });
			this.logger.info(`Created MCP servers directory at ${this.serversDir}`);
		}

		// Load existing server definitions
		this.loadServerDefinitions();
	}

	/**
	 * Load existing MCP server definitions
	 */
	private async loadServerDefinitions(): Promise<void> {
		try {
			this.logger.info('Loading MCP server definitions');

			// Read server definition files from directory
			const files = fs.readdirSync(this.serversDir).filter((file) => file.endsWith('.json'));

			// Load each server definition
			for (const file of files) {
				try {
					const filePath = path.join(this.serversDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const definition = JSON.parse(content) as MCPServerDefinition;

					// Basic validation
					if (!definition.id || !definition.apiDefinition) {
						this.logger.warn(`Invalid server definition format in ${filePath}, skipping`);
						continue;
					}

					// Add to definitions map
					this.serverDefinitions.set(definition.id, definition);
					this.logger.debug(`Loaded server definition: ${definition.name} (${definition.id})`);
				} catch (error) {
					this.logger.error(`Error loading MCP server definition file ${file}:`, { error });
				}
			}

			this.logger.info(`Loaded ${this.serverDefinitions.size} MCP server definitions`);
		} catch (error) {
			this.logger.error('Error loading MCP server definitions:', { error });
		}
	}

	/**
	 * Get all MCP server definitions
	 */
	getAllServerDefinitions(): MCPServerDefinition[] {
		return Array.from(this.serverDefinitions.values());
	}

	/**
	 * Get an MCP server definition by ID
	 */
	getServerDefinition(id: string): MCPServerDefinition | undefined {
		return this.serverDefinitions.get(id);
	}

	/**
	 * Save a new or updated server definition
	 */
	async saveServerDefinition(definition: MCPServerDefinition): Promise<void> {
		try {
			// Ensure definition has required fields
			if (!definition.id || !definition.apiDefinition) {
				throw new Error('Invalid server definition format');
			}

			// Update timestamps
			definition.updatedAt = new Date();
			if (!definition.createdAt) {
				definition.createdAt = new Date();
			}

			// Save to map
			this.serverDefinitions.set(definition.id, definition);

			// Save to file
			const filePath = path.join(this.serversDir, `${definition.id}.json`);
			fs.writeFileSync(filePath, JSON.stringify(definition, null, 2), 'utf8');

			this.logger.info(`Saved MCP server definition: ${definition.name} (${definition.id})`);
		} catch (error) {
			this.logger.error(`Error saving MCP server definition:`, { error });
			throw error;
		}
	}

	/**
	 * Delete a server definition
	 */
	deleteServerDefinition(id: string): boolean {
		try {
			// Remove from map
			if (!this.serverDefinitions.has(id)) {
				this.logger.warn(`Attempted to delete non-existent MCP server definition: ${id}`);
				return false;
			}

			// Get name for logging
			const name = this.serverDefinitions.get(id)?.name || id;

			this.serverDefinitions.delete(id);

			// Remove file
			const filePath = path.join(this.serversDir, `${id}.json`);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}

			// Stop server if running
			if (this.runningServers.has(id)) {
				this.stopMCPServer(id);
			}

			this.logger.info(`Deleted MCP server definition: ${name} (${id})`);
			return true;
		} catch (error) {
			this.logger.error(`Error deleting MCP server definition ${id}:`, { error });
			return false;
		}
	}

	/**
	 * Generate MCP server code from a definition
	 */
	generateMCPServerCode(definition: MCPServerDefinition): string {
		const { apiDefinition } = definition;

		// Generate Express.js server code
		const code = `
/**
 * MCP Server for ${apiDefinition.name}
 * Generated by AI Platform
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Base configuration
const BASE_URL = '${apiDefinition.baseUrl}';
${
	apiDefinition.authentication.type !== 'none'
		? `const AUTH_TYPE = '${apiDefinition.authentication.type}';\n` +
			`const AUTH_KEY = process.env.${apiDefinition.name.toUpperCase()}_API_KEY || 'YOUR_API_KEY_HERE';\n` +
			`const AUTH_LOCATION = '${apiDefinition.authentication.location || 'header'}';\n` +
			`const AUTH_KEY_NAME = '${apiDefinition.authentication.key || 'Authorization'}';\n`
		: ''
}

// Helper function to add authentication to requests
function addAuth(config) {
  ${(() => {
		switch (apiDefinition.authentication.type) {
			case 'bearer':
				return `config.headers['Authorization'] = \`Bearer \${AUTH_KEY}\`;`;
			case 'basic':
				return `config.headers['Authorization'] = \`Basic \${Buffer.from(AUTH_KEY).toString('base64')}\`;`;
			case 'api_key':
				return apiDefinition.authentication.location === 'header'
					? `config.headers['${apiDefinition.authentication.key}'] = AUTH_KEY;`
					: `config.params = config.params || {};\n  config.params['${apiDefinition.authentication.key}'] = AUTH_KEY;`;
			default:
				return '';
		}
	})()}
  return config;
}

// MCP Schema endpoint
app.get('/schema', (req, res) => {
  const schema = {
    schema_version: '1.0',
    server_path: \`\${req.protocol}://\${req.headers.host}\`,
    name: '${definition.name}',
    description: '${definition.description}',
    auth_mode: '${apiDefinition.authentication.type === 'none' ? 'none' : 'bearer'}',
    tools: [
      ${apiDefinition.endpoints
				.map(
					(endpoint) => `{
        name: '${endpoint.path.split('/').filter(Boolean).join('_') || 'root'}',
        description: '${endpoint.description}',
        parameters: ${JSON.stringify(generateToolParameters(endpoint))}
      }`,
				)
				.join(',\n      ')}
    ]
  };
  
  res.json(schema);
});

// MCP Tools listing endpoint
app.get('/tools', (req, res) => {
  const tools = [
    ${apiDefinition.endpoints
			.map(
				(endpoint) => `{
      name: '${endpoint.path.split('/').filter(Boolean).join('_') || 'root'}',
      description: '${endpoint.description}'
    }`,
			)
			.join(',\n    ')}
  ];
  
  res.json({ count: tools.length, tools });
});

// MCP Run endpoint
app.post('/run', async (req, res) => {
  const { name, parameters } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }
  
  try {
    ${apiDefinition.endpoints
			.map((endpoint) => {
				const endpointName = endpoint.path.split('/').filter(Boolean).join('_') || 'root';
				return `if (name === '${endpointName}') {
      const config = { 
        url: \`\${BASE_URL}${endpoint.path}\`, 
        method: '${endpoint.method}',
        params: {},
        headers: {}
      };
      
      ${Object.keys(endpoint.parameters || {})
				.map((param) => {
					if (endpoint.path.includes(`{${param}}`)) {
						return `config.url = config.url.replace('{${param}}', parameters.${param});`;
					} else {
						return `if (parameters.${param} !== undefined) {
        config.params.${param} = parameters.${param};
      }`;
					}
				})
				.join('\n      ')}
      
      addAuth(config);
      
      const response = await axios(config);
      return res.json({ content: response.data });
    }`;
			})
			.join(' else ')}
    else {
      return res.status(404).json({ error: \`Tool \${name} not found\` });
    }
  } catch (error) {
    console.error(\`Error executing \${name}:\`, error);
    return res.status(500).json({ 
      error: error.message,
      details: error.response?.data
    });
  }
});

// Individual tool endpoints
${apiDefinition.endpoints
	.map((endpoint) => {
		const endpointName = endpoint.path.split('/').filter(Boolean).join('_') || 'root';
		return `
// ${endpoint.description}
app.get('/tools/${endpointName}', (req, res) => {
  res.json({
    name: '${endpointName}',
    description: '${endpoint.description}',
    parameters: ${JSON.stringify(generateToolParameters(endpoint))}
  });
});`;
	})
	.join('\n')}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`MCP Server for ${apiDefinition.name} running on port \${PORT}\`);
});
`;

		return code;
	}

	/**
	 * Start an MCP server from a definition
	 */
	/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
	async startMCPServer(id: string): Promise<{ port: number; url: string }> {
		// Get server definition
		const definition = this.serverDefinitions.get(id);
		if (!definition) {
			throw new Error(`MCP server definition not found: ${id}`);
		}

		// Check if server is already running
		if (this.runningServers.has(id)) {
			const serverInfo = this.runningServers.get(id)!;
			return {
				port: serverInfo.port,
				url: `http://localhost:${serverInfo.port}`,
			};
		}

		// Generate server code
		const serverCode = this.generateMCPServerCode(definition);

		// Determine port
		const port = this.basePort + this.runningServers.size;

		// In a real implementation, we would actually start a server process here
		// For now, we'll simulate it by adding to the runningServers map

		this.logger.info(`Simulating start of MCP server: ${definition.name} on port ${port}`);

		// Simulate a server process
		const mockProcess = { pid: Math.floor(Math.random() * 10000) };
		this.runningServers.set(id, { port, process: mockProcess });

		// Save the server code to a file for reference
		const codePath = path.join(this.serversDir, `${id}.js`);
		fs.writeFileSync(codePath, serverCode, 'utf8');

		return {
			port,
			url: `http://localhost:${port}`,
		};
	}

	/**
	 * Stop a running MCP server
	 */
	stopMCPServer(id: string): boolean {
		if (!this.runningServers.has(id)) {
			return false;
		}

		const serverInfo = this.runningServers.get(id)!;
		this.logger.info(`Stopping MCP server with ID ${id} on port ${serverInfo.port}`);

		// In a real implementation, we would kill the actual server process
		// For now, just remove it from the map

		this.runningServers.delete(id);
		return true;
	}

	/**
	 * Get all running MCP servers
	 */
	getRunningServers(): { id: string; name: string; port: number; url: string }[] {
		return Array.from(this.runningServers.entries()).map(([id, info]) => {
			const definition = this.serverDefinitions.get(id)!;
			return {
				id,
				name: definition.name,
				port: info.port,
				url: `http://localhost:${info.port}`,
			};
		});
	}

	/**
	 * Generate an MCP server definition from an OpenAPI specification
	 */
	async generateFromOpenAPI(openApiUrl: string): Promise<MCPServerDefinition> {
		try {
			this.logger.info(`Generating MCP server from OpenAPI spec: ${openApiUrl}`);

			// Use the OpenAPI parser utility to get the API definition
			const apiDefinition = await parseOpenAPISpec(openApiUrl);

			// Create the server definition
			const serverDefinition: MCPServerDefinition = {
				id: `openapi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
				name: apiDefinition.name,
				description: apiDefinition.description || `MCP server for ${apiDefinition.name}`,
				apiDefinition,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			this.logger.info(
				`Generated MCP server definition with ${apiDefinition.endpoints.length} endpoints`,
			);

			// Save the definition
			await this.saveServerDefinition(serverDefinition);

			return serverDefinition;
		} catch (error) {
			this.logger.error(`Error generating from OpenAPI spec:`, { error });
			throw error;
		}
	}

	// TODO: Add methods for updating server definitions, managing versions, etc.
}

// Helper function to generate MCP tool parameters from endpoint parameters
function generateToolParameters(endpoint: APIEndpoint): Record<string, any> {
	const result: Record<string, any> = {};

	if (!endpoint.parameters) {
		return result;
	}

	for (const [name, param] of Object.entries(endpoint.parameters)) {
		result[name] = {
			type: param.type || 'string',
			description: param.description || name,
			required: !!param.required,
		};

		if (param.default !== undefined) {
			result[name].default = param.default;
		}

		if (param.enum) {
			result[name].enum = param.enum;
		}
	}

	return result;
}
