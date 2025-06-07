import axios from 'axios';
import { ApplicationError } from 'n8n-workflow';

import type { ModelProvider } from '../agent';
import { AgentFactoryService } from './agent-factory.service';

export interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

export interface WebBrowseResult {
	query: string;
	results: SearchResult[];
	summary: string;
}

export class WebBrowserService {
	private agentFactory: AgentFactoryService;

	constructor(agentFactory = new AgentFactoryService()) {
		this.agentFactory = agentFactory;
	}

	async search(query: string): Promise<SearchResult[]> {
		try {
			// This is a placeholder for an actual search API integration
			// In a real implementation, you would integrate with a search API like Google Custom Search, Bing, or a web scraping service

			// For demo purposes, returning mock results
			return [
				{
					title: 'Search Result 1 for ' + query,
					url: 'https://example.com/result1',
					snippet: 'This is a sample search result snippet for the query: ' + query,
				},
				{
					title: 'Search Result 2 for ' + query,
					url: 'https://example.com/result2',
					snippet: 'Another sample search result for the query: ' + query,
				},
				{
					title: 'Search Result 3 for ' + query,
					url: 'https://example.com/result3',
					snippet: 'A third sample search result for: ' + query,
				},
			];
		} catch (error) {
			console.error('Search error:', error);
			throw new ApplicationError(`Failed to perform web search: ${(error as Error).message}`);
		}
	}

	async fetchWebContent(url: string): Promise<string> {
		try {
			const response = await axios.get(url);
			return response.data;
		} catch (error) {
			console.error('Fetch web content error:', error);
			throw new ApplicationError(`Failed to fetch web content: ${(error as Error).message}`);
		}
	}

	async browseWeb(
		query: string,
		model?: string,
		provider?: ModelProvider,
	): Promise<WebBrowseResult> {
		try {
			// Create a web browsing agent
			const agent = await this.agentFactory.createWebBrowsingAgent(model, provider);

			// First, search for information
			const searchResults = await this.search(query);

			// Fetch content from the first few results
			const contentPromises = searchResults.slice(0, 3).map(async (result) => {
				try {
					const content = await this.fetchWebContent(result.url);
					return {
						url: result.url,
						title: result.title,
						content: this.extractMainContent(content),
					};
				} catch (error) {
					console.warn(`Failed to fetch content from ${result.url}:`, error);
					return {
						url: result.url,
						title: result.title,
						content: result.snippet,
					};
				}
			});

			const contents = await Promise.all(contentPromises);

			// Create a prompt for the agent to summarize the information
			const prompt = `
        I searched the web for "${query}" and found these results:
        
        ${contents
					.map(
						(content, i) => `
        [Source ${i + 1}: ${content.title}]
        URL: ${content.url}
        ${content.content.substring(0, 1000)}...
        `,
					)
					.join('\n\n')}
        
        Please provide a comprehensive summary of this information that answers the query: "${query}"
      `;

			// Get the summary from the agent
			const summary = await agent.send(prompt);

			return {
				query,
				results: searchResults,
				summary,
			};
		} catch (error) {
			console.error('Web browsing error:', error);
			throw new ApplicationError(`Web browsing failed: ${(error as Error).message}`);
		}
	}

	private extractMainContent(html: string): string {
		// This is a very simplistic content extraction
		// In a real implementation, you would use a proper HTML parser and content extractor

		// Remove HTML tags
		let text = html.replace(/<[^>]*>/g, ' ');

		// Remove extra whitespace
		text = text.replace(/\s+/g, ' ').trim();

		return text;
	}
}
