// Test setup file for orchestrator package
import 'dotenv/config';

// Set up environment variables for testing
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

// Mock n8n-workflow
jest.mock(
	'n8n-workflow',
	() => ({
		ApplicationError: class ApplicationError extends Error {
			constructor(message: string, extra?: any) {
				super(message);
				this.name = 'ApplicationError';
			}
		},
	}),
	{ virtual: true },
);

// Mock OpenAI
jest.mock('openai', () => ({
	__esModule: true,
	OpenAI: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [{ message: { content: 'mocked openai response' } }],
				}),
			},
		},
	})),
}));

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		messages: {
			create: jest.fn().mockResolvedValue({
				content: [{ text: 'mocked anthropic response' }],
			}),
		},
	})),
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
	GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
		getGenerativeModel: jest.fn().mockReturnValue({
			generateContent: jest.fn().mockResolvedValue({
				response: {
					text: jest.fn().mockReturnValue('mocked gemini response'),
				},
			}),
		}),
	})),
}));

// Mock OpenRouter
jest.mock('openrouter-client', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [{ message: { content: 'mocked openrouter response' } }],
				}),
			},
		},
	})),
}));

// Global test setup
beforeEach(() => {
	jest.clearAllMocks();
});
