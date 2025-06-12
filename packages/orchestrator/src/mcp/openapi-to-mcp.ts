/**
 * OpenAPI to MCP Converter
 *
 * Utilities to convert OpenAPI specifications to MCP server definitions
 */

import { APIDefinition, APIEndpoint } from '../services/mcp-server-generator.service';
import axios from 'axios';

// OpenAPI types
interface OpenAPIOperation {
	summary?: string;
	description?: string;
	parameters?: Array<{
		name: string;
		in: string;
		description?: string;
		required?: boolean;
		schema?: any;
	}>;
	requestBody?: {
		content?: Record<
			string,
			{
				schema?: any;
			}
		>;
	};
	responses?: Record<
		string,
		{
			description?: string;
			content?: Record<
				string,
				{
					schema?: any;
				}
			>;
		}
	>;
}

interface OpenAPIPathItem {
	get?: OpenAPIOperation;
	post?: OpenAPIOperation;
	put?: OpenAPIOperation;
	delete?: OpenAPIOperation;
	patch?: OpenAPIOperation;
	parameters?: Array<any>;
}

interface OpenAPISpec {
	info: {
		title: string;
		description?: string;
		version: string;
	};
	servers?: Array<{
		url: string;
		description?: string;
	}>;
	paths: Record<string, OpenAPIPathItem>;
	components?: {
		schemas?: Record<string, any>;
		securitySchemes?: Record<string, any>;
	};
}

/**
 * Extract authentication information from OpenAPI spec
 */
function extractAuthentication(spec: OpenAPISpec): {
	type: 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2';
	location?: 'header' | 'query';
	key?: string;
} {
	if (!spec.components?.securitySchemes) {
		return { type: 'none' };
	}

	const schemes = spec.components.securitySchemes;

	// Check for different auth types in order of preference
	if (schemes.bearerAuth || schemes.BearerAuth) {
		return { type: 'bearer' };
	}

	if (schemes.basicAuth || schemes.BasicAuth) {
		return { type: 'basic' };
	}

	// Look for API key auth
	for (const [_key, scheme] of Object.entries(schemes)) {
		if (scheme.type === 'apiKey') {
			return {
				type: 'api_key',
				location: scheme.in === 'header' ? 'header' : 'query',
				key: scheme.name,
			};
		}
	}

	// Check for OAuth2
	for (const [_key, scheme] of Object.entries(schemes)) {
		if (scheme.type === 'oauth2') {
			return { type: 'oauth2' };
		}
	}

	return { type: 'none' };
}

/**
 * Convert OpenAPI operation to an API endpoint
 */
function convertOperation(path: string, method: string, operation: OpenAPIOperation): APIEndpoint {
	// Extract parameters
	const parameters: Record<string, any> = {};

	// Path params
	if (operation.parameters) {
		for (const param of operation.parameters) {
			parameters[param.name] = {
				type: param.schema?.type || 'string',
				description: param.description || '',
				required: param.required || false,
				in: param.in,
			};
		}
	}

	// Request body
	if (operation.requestBody?.content) {
		const contentType = Object.keys(operation.requestBody.content)[0];
		if (contentType) {
			const schema = operation.requestBody.content[contentType].schema;
			if (schema) {
				parameters.body = {
					type: 'object',
					description: 'Request body',
					properties: schema.properties || {},
				};
			}
		}
	}

	// Response schema
	let responseSchema = {};
	if (operation.responses) {
		// Find successful response (2xx)
		const successResponse = Object.entries(operation.responses).find(([code]) =>
			code.startsWith('2'),
		);

		if (successResponse) {
			const [_, response] = successResponse;
			if (response.content) {
				const contentType = Object.keys(response.content)[0];
				if (contentType) {
					responseSchema = response.content[contentType].schema || {};
				}
			}
		}
	}

	return {
		method: method.toUpperCase(),
		path,
		description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
		parameters,
		responseSchema,
	};
}

/**
 * Parse OpenAPI spec into API definition
 */
export async function parseOpenAPISpec(openApiUrl: string): Promise<APIDefinition> {
	// Fetch the OpenAPI spec
	const response = await axios.get(openApiUrl);
	const spec = response.data as OpenAPISpec;

	// Basic validation
	if (!spec || !spec.info || !spec.paths) {
		throw new Error('Invalid OpenAPI specification');
	}

	// Create API definition
	const apiDefinition: APIDefinition = {
		name: spec.info.title || 'API',
		baseUrl: spec.servers?.[0]?.url || '',
		description: spec.info.description || `Generated from ${openApiUrl}`,
		authentication: extractAuthentication(spec),
		endpoints: [],
	};

	// Extract endpoints
	for (const [path, pathItem] of Object.entries(spec.paths)) {
		// Process each HTTP method
		if (pathItem.get) {
			apiDefinition.endpoints.push(convertOperation(path, 'get', pathItem.get));
		}

		if (pathItem.post) {
			apiDefinition.endpoints.push(convertOperation(path, 'post', pathItem.post));
		}

		if (pathItem.put) {
			apiDefinition.endpoints.push(convertOperation(path, 'put', pathItem.put));
		}

		if (pathItem.delete) {
			apiDefinition.endpoints.push(convertOperation(path, 'delete', pathItem.delete));
		}

		if (pathItem.patch) {
			apiDefinition.endpoints.push(convertOperation(path, 'patch', pathItem.patch));
		}
	}

	return apiDefinition;
}
