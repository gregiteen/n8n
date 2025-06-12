import type { NodeType, N8nClient } from './n8n-client';

export class NodeDiscoveryService {
	private n8nClient: N8nClient;

	private nodeCache: Map<string, NodeType> = new Map();

	private lastCacheUpdate = 0;

	private cacheTTL = 60 * 60 * 1000; // 1 hour

	constructor(n8nClient: N8nClient) {
		this.n8nClient = n8nClient;
	}

	async getAllNodeTypes(): Promise<NodeType[]> {
		await this.refreshCacheIfNeeded();
		return Array.from(this.nodeCache.values());
	}

	async getNodeType(name: string): Promise<NodeType | null> {
		await this.refreshCacheIfNeeded();
		return this.nodeCache.get(name) ?? null;
	}

	async searchNodeTypes(query: string): Promise<NodeType[]> {
		await this.refreshCacheIfNeeded();
		const normalizedQuery = query.toLowerCase();
		return Array.from(this.nodeCache.values()).filter(
			(node) =>
				node.name.toLowerCase().includes(normalizedQuery) ||
				node.displayName.toLowerCase().includes(normalizedQuery) ||
				node.description.toLowerCase().includes(normalizedQuery),
		);
	}

	async findNodesByCapability(capability: string): Promise<NodeType[]> {
		await this.refreshCacheIfNeeded();
		return Array.from(this.nodeCache.values()).filter((node) =>
			node.description.toLowerCase().includes(capability.toLowerCase()),
		);
	}

	private async refreshCacheIfNeeded(): Promise<void> {
		const now = Date.now();
		if (now - this.lastCacheUpdate > this.cacheTTL || this.nodeCache.size === 0) {
			const nodeTypes = await this.n8nClient.getAllNodeTypes();
			this.nodeCache.clear();
			nodeTypes.forEach((nt: NodeType) => {
				this.nodeCache.set(nt.name, nt);
			});
			this.lastCacheUpdate = now;
		}
	}
}
