/**
 * Type definitions for MCP Tools and related types
 */

import { MCPToolSchema } from './mcp-node-wrapper';

/**
 * MCP tool execution function type
 */
export type MCPToolExecutorFn = (params: Record<string, any>) => Promise<any>;

/**
 * MCP tool structure
 */
export interface MCPTool {
	schema: MCPToolSchema;
	executor: MCPToolExecutorFn;
	nodeName: string;
}
