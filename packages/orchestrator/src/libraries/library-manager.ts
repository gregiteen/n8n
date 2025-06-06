import { promptLibrary, PromptTemplate } from './prompt-library';
import { keywordLibrary, KeywordSet, KeywordMatch } from './keyword-library';

export interface LibraryAnalysis {
	suggestedPrompts: PromptTemplate[];
	detectedKeywords: KeywordMatch[];
	intents: string[];
	sentiment: {
		sentiment: 'positive' | 'negative' | 'neutral';
		confidence: number;
	};
	urgency: {
		level: 'high' | 'medium' | 'low';
		confidence: number;
	};
	categories: Array<{
		category: string;
		confidence: number;
	}>;
}

export interface SmartAgentConfig {
	basePromptId: string;
	enhancedPrompt: string;
	variables: Record<string, string>;
	contextKeywords: string[];
	adaptationRules: AdaptationRule[];
}

export interface AdaptationRule {
	condition: {
		keywords?: string[];
		sentiment?: 'positive' | 'negative' | 'neutral';
		urgency?: 'high' | 'medium' | 'low';
		category?: string;
	};
	action: {
		promptModification?: string;
		variableOverrides?: Record<string, string>;
		escalation?: boolean;
	};
}

export class LibraryManager {
	private adaptationRules: Map<string, AdaptationRule[]> = new Map();

	constructor() {
		this.initializeDefaultAdaptationRules();
	}

	private initializeDefaultAdaptationRules(): void {
		// Customer Support Adaptation Rules
		const supportRules: AdaptationRule[] = [
			{
				condition: {
					urgency: 'high',
					sentiment: 'negative',
				},
				action: {
					promptModification: `
URGENT PRIORITY: This customer requires immediate attention and empathetic support.
- Acknowledge their frustration immediately
- Apologize for the inconvenience
- Provide immediate solutions or escalate to human agent
- Follow up to ensure resolution`,
					escalation: true,
				},
			},
			{
				condition: {
					keywords: ['billing', 'payment', 'refund', 'charge'],
				},
				action: {
					promptModification: `
BILLING SPECIALIST MODE: You are now acting as a billing specialist.
- Verify customer account details securely
- Explain billing processes clearly
- Offer specific solutions for payment issues
- Ensure compliance with financial regulations`,
					variableOverrides: {
						role_specialization: 'billing specialist',
					},
				},
			},
			{
				condition: {
					keywords: ['technical', 'bug', 'error', 'not working'],
				},
				action: {
					promptModification: `
TECHNICAL SUPPORT MODE: You are now acting as a technical support specialist.
- Gather detailed technical information
- Provide step-by-step troubleshooting
- Request relevant logs or error messages
- Escalate to engineering if needed`,
					variableOverrides: {
						role_specialization: 'technical support specialist',
					},
				},
			},
		];

		// Sales Adaptation Rules
		const salesRules: AdaptationRule[] = [
			{
				condition: {
					keywords: ['price', 'cost', 'expensive', 'budget'],
					sentiment: 'negative',
				},
				action: {
					promptModification: `
PRICE OBJECTION HANDLING: The prospect has price concerns.
- Acknowledge their budget considerations
- Focus on value and ROI rather than price
- Offer alternative pricing options or packages
- Provide cost-benefit analysis
- Share relevant case studies showing value`,
					variableOverrides: {
						objection_type: 'price',
					},
				},
			},
			{
				condition: {
					keywords: ['demo', 'trial', 'test', 'see it'],
					sentiment: 'positive',
				},
				action: {
					promptModification: `
DEMO REQUEST DETECTED: The prospect is interested in seeing the product.
- Confirm their specific interests and use cases
- Schedule a personalized demonstration
- Prepare relevant examples for their industry
- Follow up with trial access if appropriate`,
					variableOverrides: {
						sales_stage: 'demo_request',
					},
				},
			},
		];

		// Content Creation Adaptation Rules
		const contentRules: AdaptationRule[] = [
			{
				condition: {
					keywords: ['SEO', 'ranking', 'search', 'keywords'],
				},
				action: {
					promptModification: `
SEO-FOCUSED CONTENT MODE: Create content optimized for search engines.
- Research and incorporate target keywords naturally
- Structure content with proper headings (H1, H2, H3)
- Include meta descriptions and title suggestions
- Focus on user intent and search queries
- Provide internal linking opportunities`,
					variableOverrides: {
						content_focus: 'SEO optimization',
					},
				},
			},
			{
				condition: {
					keywords: ['social media', 'viral', 'engagement', 'shares'],
				},
				action: {
					promptModification: `
SOCIAL MEDIA CONTENT MODE: Create engaging social media content.
- Use attention-grabbing hooks and headlines
- Include relevant hashtags and mentions
- Optimize for platform-specific formats
- Encourage engagement and sharing
- Include clear calls-to-action`,
					variableOverrides: {
						content_focus: 'social media engagement',
					},
				},
			},
		];

		this.adaptationRules.set('customer-support', supportRules);
		this.adaptationRules.set('sales-marketing', salesRules);
		this.adaptationRules.set('content-creation', contentRules);
	}

	public analyzeUserInput(input: string): LibraryAnalysis {
		// Analyze keywords and extract insights
		const detectedKeywords = keywordLibrary.analyzeText(input);
		const intents = keywordLibrary.extractIntents(input);
		const sentiment = keywordLibrary.detectSentiment(input);
		const urgency = keywordLibrary.detectUrgency(input);
		const categories = keywordLibrary.categorizeQuery(input);

		// Suggest relevant prompts based on analysis
		const suggestedPrompts = this.suggestPrompts(detectedKeywords, categories);

		return {
			suggestedPrompts,
			detectedKeywords,
			intents,
			sentiment,
			urgency,
			categories,
		};
	}

	private suggestPrompts(
		keywords: KeywordMatch[],
		categories: Array<{ category: string; confidence: number }>,
	): PromptTemplate[] {
		const suggestions: PromptTemplate[] = [];
		const seenPrompts = new Set<string>();

		// Get prompts based on top categories
		for (const { category, confidence } of categories.slice(0, 3)) {
			if (confidence > 0.3) {
				const categoryPrompts = promptLibrary.getPromptsByCategory(category);
				for (const prompt of categoryPrompts) {
					if (!seenPrompts.has(prompt.id)) {
						suggestions.push(prompt);
						seenPrompts.add(prompt.id);
					}
				}
			}
		}

		// Get prompts based on keyword tags
		const keywordTags = keywords
			.filter((k) => k.confidence > 0.5)
			.map((k) => k.keyword)
			.slice(0, 5);

		if (keywordTags.length > 0) {
			const tagPrompts = promptLibrary.getPromptsByTags(keywordTags);
			for (const prompt of tagPrompts) {
				if (!seenPrompts.has(prompt.id)) {
					suggestions.push(prompt);
					seenPrompts.add(prompt.id);
				}
			}
		}

		// Sort by relevance and return top suggestions
		return suggestions.slice(0, 5);
	}

	public createSmartAgentConfig(
		userInput: string,
		basePromptId: string,
		variables: Record<string, string> = {},
	): SmartAgentConfig | null {
		const basePrompt = promptLibrary.getPrompt(basePromptId);
		if (!basePrompt) {
			return null;
		}

		const analysis = this.analyzeUserInput(userInput);
		const contextKeywords = analysis.detectedKeywords
			.filter((k) => k.confidence > 0.6)
			.map((k) => k.keyword);

		// Apply adaptation rules
		const adaptationRules = this.getApplicableRules(basePrompt.category, analysis);
		let enhancedPrompt = basePrompt.template;
		let mergedVariables = { ...variables };

		for (const rule of adaptationRules) {
			if (rule.action.promptModification) {
				enhancedPrompt += '\n\n' + rule.action.promptModification;
			}
			if (rule.action.variableOverrides) {
				mergedVariables = { ...mergedVariables, ...rule.action.variableOverrides };
			}
		}

		return {
			basePromptId,
			enhancedPrompt,
			variables: mergedVariables,
			contextKeywords,
			adaptationRules,
		};
	}

	private getApplicableRules(category: string, analysis: LibraryAnalysis): AdaptationRule[] {
		const categoryRules = this.adaptationRules.get(category) || [];
		const applicableRules: AdaptationRule[] = [];

		for (const rule of categoryRules) {
			if (this.isRuleApplicable(rule, analysis)) {
				applicableRules.push(rule);
			}
		}

		return applicableRules;
	}

	private isRuleApplicable(rule: AdaptationRule, analysis: LibraryAnalysis): boolean {
		const { condition } = rule;

		// Check keyword conditions
		if (condition.keywords) {
			const hasMatchingKeyword = condition.keywords.some((keyword) =>
				analysis.detectedKeywords.some(
					(detected) =>
						detected.keyword.includes(keyword.toLowerCase()) && detected.confidence > 0.5,
				),
			);
			if (!hasMatchingKeyword) return false;
		}

		// Check sentiment conditions
		if (condition.sentiment && analysis.sentiment.sentiment !== condition.sentiment) {
			return false;
		}

		// Check urgency conditions
		if (condition.urgency && analysis.urgency.level !== condition.urgency) {
			return false;
		}

		// Check category conditions
		if (condition.category) {
			const hasMatchingCategory = analysis.categories.some(
				(cat) => cat.category === condition.category && cat.confidence > 0.5,
			);
			if (!hasMatchingCategory) return false;
		}

		return true;
	}

	public enhancePromptWithContext(
		promptId: string,
		userContext: string,
		variables: Record<string, string> = {},
	): string | null {
		const prompt = promptLibrary.getPrompt(promptId);
		if (!prompt) {
			return null;
		}

		const analysis = this.analyzeUserInput(userContext);
		const config = this.createSmartAgentConfig(userContext, promptId, variables);

		if (!config) {
			return promptLibrary.renderPrompt(promptId, variables);
		}

		return promptLibrary.renderPrompt(promptId, config.variables);
	}

	public getPromptRecommendations(
		userInput: string,
		limit: number = 3,
	): Array<{ prompt: PromptTemplate; relevanceScore: number; reasoning: string }> {
		const analysis = this.analyzeUserInput(userInput);
		const recommendations: Array<{
			prompt: PromptTemplate;
			relevanceScore: number;
			reasoning: string;
		}> = [];

		for (const prompt of analysis.suggestedPrompts.slice(0, limit)) {
			const relevanceScore = this.calculateRelevanceScore(prompt, analysis);
			const reasoning = this.generateReasoningExplanation(prompt, analysis);

			recommendations.push({
				prompt,
				relevanceScore,
				reasoning,
			});
		}

		return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
	}

	private calculateRelevanceScore(prompt: PromptTemplate, analysis: LibraryAnalysis): number {
		let score = 0;

		// Category match bonus
		const categoryMatch = analysis.categories.find((cat) => cat.category === prompt.category);
		if (categoryMatch) {
			score += categoryMatch.confidence * 0.4;
		}

		// Tag match bonus
		const matchingTags = prompt.tags.filter((tag) =>
			analysis.detectedKeywords.some(
				(keyword) =>
					keyword.keyword.includes(tag.toLowerCase()) ||
					tag.toLowerCase().includes(keyword.keyword),
			),
		);
		score += (matchingTags.length / prompt.tags.length) * 0.3;

		// Keyword match bonus
		const keywordScore =
			analysis.detectedKeywords
				.filter((keyword) => keyword.confidence > 0.5)
				.reduce((acc, keyword) => acc + keyword.confidence, 0) / analysis.detectedKeywords.length;
		score += keywordScore * 0.3;

		return Math.min(score, 1.0);
	}

	private generateReasoningExplanation(prompt: PromptTemplate, analysis: LibraryAnalysis): string {
		const reasons: string[] = [];

		// Category relevance
		const categoryMatch = analysis.categories.find((cat) => cat.category === prompt.category);
		if (categoryMatch && categoryMatch.confidence > 0.5) {
			reasons.push(
				`Matches ${prompt.category} category with ${Math.round(categoryMatch.confidence * 100)}% confidence`,
			);
		}

		// Keyword relevance
		const relevantKeywords = analysis.detectedKeywords
			.filter((k) => k.confidence > 0.6)
			.map((k) => k.keyword)
			.slice(0, 3);
		if (relevantKeywords.length > 0) {
			reasons.push(`Contains relevant keywords: ${relevantKeywords.join(', ')}`);
		}

		// Sentiment and urgency context
		if (analysis.sentiment.confidence > 0.7) {
			reasons.push(`Suitable for ${analysis.sentiment.sentiment} sentiment`);
		}

		if (analysis.urgency.confidence > 0.7) {
			reasons.push(`Appropriate for ${analysis.urgency.level} urgency situations`);
		}

		return reasons.join('; ') || 'General relevance to query content';
	}

	public searchLibraries(query: string): {
		prompts: PromptTemplate[];
		keywords: KeywordSet[];
		analysis: LibraryAnalysis;
	} {
		const prompts = promptLibrary.searchPrompts(query);
		const keywords = keywordLibrary.searchKeywords(query);
		const analysis = this.analyzeUserInput(query);

		return {
			prompts,
			keywords,
			analysis,
		};
	}

	public addAdaptationRule(category: string, rule: AdaptationRule): void {
		const existingRules = this.adaptationRules.get(category) || [];
		existingRules.push(rule);
		this.adaptationRules.set(category, existingRules);
	}

	public getAdaptationRules(category: string): AdaptationRule[] {
		return this.adaptationRules.get(category) || [];
	}

	public exportLibraries(): string {
		const libraryData = {
			version: '1.0',
			exportDate: new Date().toISOString(),
			prompts: promptLibrary.getAllPrompts(),
			keywords: keywordLibrary.getAllKeywordSets(),
			adaptationRules: Object.fromEntries(this.adaptationRules),
		};

		return JSON.stringify(libraryData, null, 2);
	}

	public importLibraries(jsonData: string): {
		promptResults: { success: number; errors: string[] };
		keywordResults: { success: number; errors: string[] };
		adaptationRules: number;
	} {
		try {
			const data = JSON.parse(jsonData);

			const promptResults = data.prompts
				? promptLibrary.importPrompts(JSON.stringify({ prompts: data.prompts }))
				: { success: 0, errors: [] };

			const keywordResults = data.keywords
				? keywordLibrary.importKeywords(JSON.stringify({ keywordSets: data.keywords }))
				: { success: 0, errors: [] };

			let adaptationRulesCount = 0;
			if (data.adaptationRules) {
				for (const [category, rules] of Object.entries(data.adaptationRules)) {
					this.adaptationRules.set(category, rules as AdaptationRule[]);
					adaptationRulesCount += (rules as AdaptationRule[]).length;
				}
			}

			return {
				promptResults,
				keywordResults,
				adaptationRules: adaptationRulesCount,
			};
		} catch (error) {
			return {
				promptResults: {
					success: 0,
					errors: [`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`],
				},
				keywordResults: { success: 0, errors: [] },
				adaptationRules: 0,
			};
		}
	}
}

// Export a singleton instance
export const libraryManager = new LibraryManager();
