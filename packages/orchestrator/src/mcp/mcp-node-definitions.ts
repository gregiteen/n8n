/**
 * MCP Node Definitions
 *
 * This file contains definitions for common n8n nodes to be wrapped as MCP tools.
 * These definitions will be used to automatically register nodes as MCP tools.
 */

import { MCPParameterSchema } from './mcp-node-wrapper';

export interface NodeDefinition {
	nodeName: string;
	displayName: string;
	description: string;
	parameters: Record<string, MCPParameterSchema>;
}

/**
 * Common node definitions for MCP integration
 */
export const commonNodeDefinitions: NodeDefinition[] = [
	// HTTP Request Node
	{
		nodeName: 'n8n-nodes-base.httpRequest',
		displayName: 'HTTP Request',
		description: 'Make HTTP requests to any API or web service',
		parameters: {
			url: {
				name: 'url',
				type: 'string',
				description: 'The URL to make the request to',
				required: true,
			},
			method: {
				name: 'method',
				type: 'string',
				description: 'The HTTP method to use',
				required: false,
				default: 'GET',
				enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
			},
			headers: {
				name: 'headers',
				type: 'object',
				description: 'Headers to include in the request',
				required: false,
			},
			queryParameters: {
				name: 'queryParameters',
				type: 'object',
				description: 'Query parameters to include in the URL',
				required: false,
			},
			body: {
				name: 'body',
				type: 'object',
				description: 'Body to include in the request (for POST, PUT, PATCH)',
				required: false,
			},
		},
	},

	// CSV Node
	{
		nodeName: 'n8n-nodes-base.spreadsheetFile',
		displayName: 'CSV Parser',
		description: 'Parse CSV data into structured data',
		parameters: {
			data: {
				name: 'data',
				type: 'string',
				description: 'CSV data to parse',
				required: true,
			},
			options: {
				name: 'options',
				type: 'object',
				description: 'Options for CSV parsing',
				required: false,
				properties: {
					delimiter: {
						name: 'delimiter',
						type: 'string',
						description: 'Character used to separate values',
						default: ',',
						required: false,
					},
					hasHeader: {
						name: 'hasHeader',
						type: 'boolean',
						description: 'Whether the first row contains headers',
						default: true,
						required: false,
					},
				},
			},
		},
	},

	// Text Manipulation Node
	{
		nodeName: 'n8n-nodes-base.set',
		displayName: 'Text Manipulation',
		description: 'Manipulate text data with various operations',
		parameters: {
			text: {
				name: 'text',
				type: 'string',
				description: 'The text to manipulate',
				required: true,
			},
			operation: {
				name: 'operation',
				type: 'string',
				description: 'The operation to perform',
				required: true,
				enum: ['uppercase', 'lowercase', 'capitalize', 'trim', 'replace'],
			},
			searchValue: {
				name: 'searchValue',
				type: 'string',
				description: 'The value to search for (for replace operation)',
				required: false,
			},
			replaceValue: {
				name: 'replaceValue',
				type: 'string',
				description: 'The value to replace with (for replace operation)',
				required: false,
			},
		},
	},

	// JSON Parse/Stringify Node
	{
		nodeName: 'n8n-nodes-base.moveBinaryData',
		displayName: 'JSON Utility',
		description: 'Parse or stringify JSON data',
		parameters: {
			operation: {
				name: 'operation',
				type: 'string',
				description: 'The operation to perform',
				required: true,
				enum: ['parse', 'stringify'],
			},
			data: {
				name: 'data',
				type: 'string',
				description: 'The data to process',
				required: true,
			},
			options: {
				name: 'options',
				type: 'object',
				description: 'Additional options for parsing/stringifying',
				required: false,
				properties: {
					indentation: {
						name: 'indentation',
						type: 'number',
						description: 'Indentation spaces for stringify operation',
						default: 2,
						required: false,
					},
				},
			},
		},
	},

	// Code Node
	{
		nodeName: 'n8n-nodes-base.code',
		displayName: 'Execute Code',
		description: 'Execute custom JavaScript code with data',
		parameters: {
			code: {
				name: 'code',
				type: 'string',
				description: 'The JavaScript code to execute',
				required: true,
			},
			input: {
				name: 'input',
				type: 'object',
				description: 'The input data to provide to the code',
				required: false,
			},
		},
	},

	// Email Send Node
	{
		nodeName: 'n8n-nodes-base.emailSend',
		displayName: 'Send Email',
		description: 'Send an email',
		parameters: {
			to: {
				name: 'to',
				type: 'string',
				description: 'Email recipient(s), comma-separated',
				required: true,
			},
			subject: {
				name: 'subject',
				type: 'string',
				description: 'Email subject',
				required: true,
			},
			body: {
				name: 'body',
				type: 'string',
				description: 'Email body content',
				required: true,
			},
			cc: {
				name: 'cc',
				type: 'string',
				description: 'CC recipients, comma-separated',
				required: false,
			},
			bcc: {
				name: 'bcc',
				type: 'string',
				description: 'BCC recipients, comma-separated',
				required: false,
			},
			attachments: {
				name: 'attachments',
				type: 'array',
				description: 'Files to attach to the email',
				required: false,
				items: {
					// This 'items' object is an MCPParameterSchema describing each item in the array
					name: 'attachmentItem', // Name for the schema of the array item
					type: 'object',
					properties: {
						name: {
							name: 'name',
							type: 'string',
							description: 'Filename of the attachment',
							required: true,
						},
						data: {
							name: 'data',
							type: 'string',
							description: 'Base64-encoded file data',
							required: true,
						},
						contentType: {
							name: 'contentType',
							type: 'string',
							description: 'MIME type of the attachment',
							required: false,
						},
					},
				},
			},
		},
	},

	// Wait Node
	{
		nodeName: 'n8n-nodes-base.wait',
		displayName: 'Wait',
		description: 'Pause execution for a specified time',
		parameters: {
			duration: {
				name: 'duration',
				type: 'number',
				description: 'Duration to wait in milliseconds',
				required: true,
			},
		},
	},

	// File Operations Node
	{
		nodeName: 'n8n-nodes-base.fileSystem',
		displayName: 'File Operations',
		description: 'Perform operations on files and directories',
		parameters: {
			operation: {
				name: 'operation',
				type: 'string',
				description: 'The operation to perform',
				required: true,
				enum: ['read', 'write', 'append', 'delete', 'list', 'exists'],
			},
			path: {
				name: 'path',
				type: 'string',
				description: 'The file or directory path',
				required: true,
			},
			content: {
				name: 'content',
				type: 'string',
				description: 'Content to write to file (for write/append operations)',
				required: false,
			},
			options: {
				name: 'options',
				type: 'object',
				description: 'Additional options for the operation',
				required: false,
			},
		},
	},
];
