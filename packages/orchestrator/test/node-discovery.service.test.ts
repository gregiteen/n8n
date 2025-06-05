import { N8nClient, type NodeType } from '../src/services/n8n-client';
import { NodeDiscoveryService } from '../src/services/node-discovery.service';

class MockClient extends N8nClient {
	constructor(nodes: NodeType[]) {
		super({ baseUrl: '', apiKey: '' });
		this._nodes = nodes;
	}

	private _nodes: NodeType[];

	async getNodeTypes(): Promise<NodeType[]> {
		return this._nodes;
	}
}

describe('NodeDiscoveryService', () => {
	const nodes: NodeType[] = [
		{ name: 'http', displayName: 'HTTP', description: 'Makes HTTP requests' },
		{ name: 'email', displayName: 'Email', description: 'Sends emails' },
	];
	const service = new NodeDiscoveryService(new MockClient(nodes));

	test('searchNodeTypes finds nodes by name', async () => {
		const result = await service.searchNodeTypes('http');
		expect(result[0].name).toBe('http');
	});

	test('findNodesByCapability matches description', async () => {
		const result = await service.findNodesByCapability('emails');
		expect(result[0].name).toBe('email');
	});
});
