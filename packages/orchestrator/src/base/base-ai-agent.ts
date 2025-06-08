// Base AI Agent Implementation

export interface BaseAiAgentOptions {
	systemPrompt?: string;
	capabilities?: string[];
}

/**
 * Base class for AI agents
 */
export class BaseAiAgent {
	protected capabilities: string[] = [];

	constructor(options: BaseAiAgentOptions = {}) {
		if (options.capabilities) {
			this.capabilities = options.capabilities;
		}
	}

	/**
	 * Check if agent has the requested capability
	 */
	hasCapability(capability: string): boolean {
		return this.capabilities.includes(capability);
	}

	/**
	 * Get all available capabilities
	 */
	getCapabilities(): string[] {
		return [...this.capabilities];
	}
}
