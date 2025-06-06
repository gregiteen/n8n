import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AiOrchestratorApi implements ICredentialType {
	name = 'aiOrchestratorApi';

	displayName = 'AI Orchestrator API';

	documentationUrl = 'https://docs.n8n.io/credentials/ai-orchestrator/';

	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'url',
			type: 'string',
			default: 'http://localhost:3001',
			description: 'The base URL of the AI Orchestrator API',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'The API key for authentication with the AI Orchestrator',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/api/health',
			method: 'GET',
		},
	};
}
