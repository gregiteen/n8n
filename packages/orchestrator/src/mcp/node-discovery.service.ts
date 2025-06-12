/**
 * Node Discovery Service for MCP
 *
 * This service discovers available n8n nodes and registers them as MCP tools.
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { N8nClient, NodeType } from '../services/n8n-client';
import { MCPNodeWrapper } from './mcp-node-wrapper';
import { commonNodeDefinitions } from './mcp-node-definitions';
import { MCPToolExecutorFn } from './types';

@Service()
export class NodeDiscoveryService {
	private nodeTypeRegistry: Map<string, NodeType> = new Map();

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(N8nClient) private readonly n8nClient: N8nClient,
		@Inject(MCPNodeWrapper) private readonly mcpNodeWrapper: MCPNodeWrapper,
	) {
		this.logger = this.logger.scoped('node-discovery');
	}

	/**
	 * Initialize the node discovery service
	 */
	async initialize(): Promise<void> {
		this.logger.info('Initializing node discovery service');

		this.registerCommonNodes();

		try {
			const discoveredNodeTypes = await this.n8nClient.getAllNodeTypes();
			if (discoveredNodeTypes) {
				discoveredNodeTypes.forEach((nt: NodeType) => {
					if (nt.name && !this.nodeTypeRegistry.has(nt.name)) {
						this.nodeTypeRegistry.set(nt.name, nt);
						this.logger.debug(`Discovered and registered node type: ${nt.name}`);
					}
				});
				this.logger.info(
					`Processed ${discoveredNodeTypes.length} discovered node types during initialization.`,
				);
			}
		} catch (error: any) {
			this.logger.warn(
				'Could not discover nodes from n8n API during initialization. Using only predefined nodes.',
				{ error: error.message },
			);
		}
	}

	/**
	 * Register common node definitions from our predefined list
	 */
	private registerCommonNodes(): void {
		this.logger.debug(`Registering ${commonNodeDefinitions.length} predefined nodes as MCP tools`);

		commonNodeDefinitions.forEach((definition) => {
			try {
				// Define a placeholder executor for common nodes
				const placeholderExecutor: MCPToolExecutorFn = async (params: Record<string, any>) => {
					this.logger.info(`Executing placeholder for common node: ${definition.displayName}`, {
						params,
					});
					// In a real scenario, this would delegate to a specific execution logic
					// For now, it returns a mock success response
					return {
						result: {
							message: `Successfully executed ${definition.displayName} (placeholder)`,
							params,
						},
						error: undefined,
					};
				};

				this.mcpNodeWrapper.registerNodeAsTool(
					definition.nodeName,
					definition.displayName,
					definition.description,
					definition.parameters,
					placeholderExecutor, // Pass the placeholder executor
				);
			} catch (error: any) {
				this.logger.error(`Error registering predefined node ${definition.nodeName}:`, {
					error: error.message,
				});
			}
		});

		this.logger.info(
			`Successfully registered ${commonNodeDefinitions.length} predefined nodes as MCP tools`,
		);
	}

	/**
	 * Discover nodes from the n8n API and register them
	 */
	async discoverNodes(): Promise<void> {
		this.logger.info('Discovering nodes from n8n API...');
		let registeredCount = 0;
		try {
			const discoveredNodeTypes = await this.n8nClient.getAllNodeTypes();
			if (discoveredNodeTypes) {
				discoveredNodeTypes.forEach((nt: NodeType) => {
					if (nt.name && !this.nodeTypeRegistry.has(nt.name)) {
						this.nodeTypeRegistry.set(nt.name, nt);
						this.logger.debug(`Discovered node type: ${nt.name}`);
						registeredCount++;
						// TODO: Dynamically register these as MCP tools if needed
						// This would involve mapping NodeType properties to MCPParameterSchema
						// and creating an MCPToolExecutorFn, then calling this.mcpNodeWrapper.registerNodeAsTool
					}
				});
				this.logger.info(
					`Discovered and added ${registeredCount} new unique node types to the registry.`,
				);
			} else {
				this.logger.warn(
					'No node types returned from n8nClient.getAllNodeTypes() during discoverNodes call.',
				);
			}
		} catch (error: any) {
			this.logger.error('Error during discoverNodes call:', { error: error.message });
		}
	}

	/**
	 * Get all discovered node types
	 */
	getNodeTypes(): NodeType[] {
		return Array.from(this.nodeTypeRegistry.values());
	}
}
