import axios from 'axios';
import { ApplicationError } from 'n8n-workflow';

interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

interface WebPageContent {
	url: string;
	title: string;
	content: string;
	links?: string[];
}

/**
 * Service for web browsing capabilities used by AI agents
 */
export class BrowserService {
	private userAgent = 'Mozilla/5.0 (compatible; N8N-AI-Agent/1.0; +https://n8n.io)';

	/**
	 * Perform a web search using a search API
	 */
	async search(query: string, limit = 5): Promise<SearchResult[]> {
		try {
			// Note: In a production environment, this would connect to a real search API
			// For MVP, we'll use a simulated search function
			return this.simulateSearch(query, limit);
		} catch (error) {
			console.error('Search error:', error);
			throw new ApplicationError(`Failed to perform web search: ${(error as Error).message}`);
		}
	}

	/**
	 * Fetch and extract content from a web page
	 */
	async fetchWebPage(url: string): Promise<WebPageContent> {
		try {
			const response = await axios.get(url, {
				headers: {
					'User-Agent': this.userAgent,
				},
				timeout: 10000,
			});

			const html = response.data;

			// Extract title
			const titleMatch = html.match(/<title>(.*?)<\/title>/i);
			const title = titleMatch ? titleMatch[1] : 'No title found';

			// Extract main content (basic implementation - would be more sophisticated in production)
			const content = this.extractTextFromHtml(html);

			// Extract links (optional)
			const links = this.extractLinks(html, url);

			return {
				url,
				title,
				content,
				links,
			};
		} catch (error) {
			console.error('Web page fetch error:', error);
			throw new ApplicationError(`Failed to fetch web page: ${(error as Error).message}`);
		}
	}

	/**
	 * Navigate to a specific link on a page
	 */
	async navigateToLink(pageUrl: string, linkText: string): Promise<WebPageContent> {
		try {
			// First get the current page
			const page = await this.fetchWebPage(pageUrl);

			// Find the link URL based on link text
			if (!page.links || page.links.length === 0) {
				throw new ApplicationError('No links found on page');
			}

			// Simple fuzzy match to find the most relevant link
			const linkUrl = this.findBestMatchingLink(page.links, linkText);

			if (!linkUrl) {
				throw new ApplicationError(`No link matching "${linkText}" found on page`);
			}

			// Now fetch the linked page
			return this.fetchWebPage(linkUrl);
		} catch (error) {
			console.error('Navigation error:', error);
			throw new ApplicationError(`Failed to navigate to link: ${(error as Error).message}`);
		}
	}

	/**
	 * Extract text content from HTML (simple implementation)
	 */
	private extractTextFromHtml(html: string): string {
		// Remove scripts and styles
		let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
		text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');

		// Remove HTML tags
		text = text.replace(/<[^>]*>/g, ' ');

		// Clean up whitespace
		text = text.replace(/\s+/g, ' ').trim();

		// Decode HTML entities
		text = text
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#039;/g, "'");

		return text;
	}

	/**
	 * Extract links from HTML
	 */
	private extractLinks(html: string, baseUrl: string): string[] {
		const links: string[] = [];
		const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;

		let match;
		while ((match = linkRegex.exec(html)) !== null) {
			let href = match[1];

			// Skip anchor links, javascript, and mailto
			if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
				continue;
			}

			// Convert relative URLs to absolute
			if (!href.startsWith('http')) {
				const url = new URL(href, baseUrl);
				href = url.toString();
			}

			links.push(href);
		}

		return Array.from(new Set(links)); // Remove duplicates
	}

	/**
	 * Find best matching link based on link text
	 */
	private findBestMatchingLink(links: string[], targetText: string): string | null {
		const normalizedTarget = targetText.toLowerCase();

		// First try exact matches in the URL
		for (const link of links) {
			if (link.toLowerCase().includes(normalizedTarget)) {
				return link;
			}
		}

		// If no exact match, return first link as fallback
		return links.length > 0 ? links[0] : null;
	}

	/**
	 * Simulate search results for development/testing
	 */
	private simulateSearch(query: string, limit: number): SearchResult[] {
		const results: SearchResult[] = [
			{
				title: `Results for: ${query}`,
				url: `https://example.com/search?q=${encodeURIComponent(query)}`,
				snippet: `This is a simulated search result for "${query}". In production, this would use a real search API.`,
			},
			{
				title: `${query} - Wikipedia`,
				url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
				snippet: `Wikipedia article about ${query} with comprehensive information and references.`,
			},
			{
				title: `Latest news about ${query}`,
				url: `https://news.example.com/topics/${encodeURIComponent(query)}`,
				snippet: `Get the latest news and updates about ${query} from trusted sources.`,
			},
			{
				title: `${query} research papers`,
				url: `https://papers.example.org/search?q=${encodeURIComponent(query)}`,
				snippet: `Academic research and papers related to ${query} from leading universities and researchers.`,
			},
			{
				title: `${query} tutorials and guides`,
				url: `https://learn.example.net/tutorials/${encodeURIComponent(query)}`,
				snippet: `Step-by-step tutorials and comprehensive guides about ${query} for beginners and experts.`,
			},
		];

		return results.slice(0, limit);
	}
}
