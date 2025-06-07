export interface KeywordSet {
	id: string;
	name: string;
	description: string;
	category: string;
	keywords: string[];
	synonyms: string[];
	context: string;
	weight: number; // 1-10 scale for importance
	metadata?: {
		language?: string;
		domain?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}

export interface KeywordMatch {
	keyword: string;
	confidence: number;
	context: string;
	category: string;
	synonymFound?: string;
}

export class KeywordLibrary {
	private keywordSets: Map<string, KeywordSet> = new Map();

	private keywordIndex: Map<string, string[]> = new Map(); // keyword -> keywordSet IDs

	constructor() {
		this.initializeDefaultKeywords();
		this.buildIndex();
	}

	private initializeDefaultKeywords(): void {
		const defaultKeywordSets: KeywordSet[] = [
			// Customer Support Keywords
			{
				id: 'support-general',
				name: 'General Support Requests',
				description: 'Common customer support inquiry keywords',
				category: 'customer-support',
				keywords: [
					'help',
					'support',
					'assistance',
					'problem',
					'issue',
					'bug',
					'error',
					'trouble',
					'broken',
					'not working',
					'question',
					'how to',
					'guide',
					'tutorial',
					'documentation',
					'manual',
					'instructions',
				],
				synonyms: [
					'aid',
					'assist',
					'guidance',
					'concern',
					'difficulty',
					'malfunction',
					'fault',
					'glitch',
					'inquiry',
					'query',
					'walkthrough',
					'handbook',
				],
				context: 'General customer support and help requests',
				weight: 8,
			},
			{
				id: 'support-billing',
				name: 'Billing and Payment Issues',
				description: 'Keywords related to billing, payments, and financial concerns',
				category: 'customer-support',
				keywords: [
					'billing',
					'payment',
					'invoice',
					'charge',
					'refund',
					'subscription',
					'renewal',
					'upgrade',
					'downgrade',
					'plan',
					'pricing',
					'cost',
					'fee',
					'transaction',
					'receipt',
					'credit card',
					'bank account',
				],
				synonyms: [
					'bill',
					'pay',
					'receipt',
					'cost',
					'money back',
					'membership',
					'auto-renew',
					'enhance',
					'reduce',
					'package',
					'rate',
					'expense',
					'payment method',
					'financial',
					'account',
				],
				context: 'Billing, payment, and subscription-related inquiries',
				weight: 9,
			},
			{
				id: 'support-technical',
				name: 'Technical Issues',
				description: 'Keywords for technical problems and troubleshooting',
				category: 'customer-support',
				keywords: [
					'technical',
					'bug',
					'error',
					'crash',
					'freeze',
					'slow',
					'performance',
					'login',
					'password',
					'access',
					'permission',
					'sync',
					'connection',
					'network',
					'server',
					'database',
					'API',
					'integration',
					'compatibility',
				],
				synonyms: [
					'tech',
					'glitch',
					'fault',
					'hang',
					'lag',
					'speed',
					'sign in',
					'credentials',
					'authenticate',
					'authorize',
					'synchronize',
					'link',
					'connectivity',
					'backend',
					'data',
					'interface',
					'compatible',
				],
				context: 'Technical problems and system-related issues',
				weight: 9,
			},

			// Sales and Marketing Keywords
			{
				id: 'sales-interest',
				name: 'Sales Interest Indicators',
				description: 'Keywords indicating sales interest and purchase intent',
				category: 'sales-marketing',
				keywords: [
					'buy',
					'purchase',
					'price',
					'cost',
					'demo',
					'trial',
					'free',
					'discount',
					'offer',
					'deal',
					'quote',
					'proposal',
					'contract',
					'interested',
					'considering',
					'evaluating',
					'comparing',
					'budget',
				],
				synonyms: [
					'acquire',
					'obtain',
					'rate',
					'expense',
					'demonstration',
					'test',
					'complimentary',
					'savings',
					'promotion',
					'bargain',
					'estimate',
					'suggestion',
					'agreement',
					'curious',
					'thinking about',
					'assessing',
				],
				context: 'Indicators of sales interest and buying intent',
				weight: 10,
			},
			{
				id: 'sales-objections',
				name: 'Common Sales Objections',
				description: 'Keywords indicating sales objections and concerns',
				category: 'sales-marketing',
				keywords: [
					'expensive',
					'costly',
					'budget',
					'timing',
					'not ready',
					'think about',
					'compare',
					'competition',
					'features',
					'limitations',
					'concerns',
					'hesitant',
					'unsure',
					'doubt',
					'risk',
					'commitment',
				],
				synonyms: [
					'pricey',
					'high cost',
					'funds',
					'schedule',
					'unprepared',
					'consider',
					'alternatives',
					'rivals',
					'capabilities',
					'restrictions',
					'worries',
					'reluctant',
					'uncertain',
					'question',
					'danger',
					'obligation',
				],
				context: 'Common objections and concerns in sales conversations',
				weight: 8,
			},

			// Content Creation Keywords
			{
				id: 'content-types',
				name: 'Content Types and Formats',
				description: 'Keywords for different content types and formats',
				category: 'content-creation',
				keywords: [
					'blog',
					'article',
					'post',
					'content',
					'copy',
					'text',
					'write',
					'email',
					'newsletter',
					'social media',
					'video',
					'podcast',
					'infographic',
					'case study',
					'whitepaper',
					'ebook',
					'guide',
				],
				synonyms: [
					'weblog',
					'piece',
					'entry',
					'material',
					'copywriting',
					'words',
					'compose',
					'message',
					'bulletin',
					'social',
					'audio',
					'broadcast',
					'visual',
					'study',
					'report',
					'book',
					'manual',
				],
				context: 'Different types of content and writing formats',
				weight: 7,
			},
			{
				id: 'content-goals',
				name: 'Content Goals and Objectives',
				description: 'Keywords related to content marketing goals',
				category: 'content-creation',
				keywords: [
					'SEO',
					'ranking',
					'traffic',
					'engagement',
					'conversion',
					'leads',
					'awareness',
					'brand',
					'education',
					'entertainment',
					'viral',
					'shares',
					'likes',
					'comments',
					'subscribers',
					'followers',
				],
				synonyms: [
					'search optimization',
					'position',
					'visitors',
					'interaction',
					'sales',
					'prospects',
					'recognition',
					'identity',
					'teaching',
					'fun',
					'popular',
					'distribution',
					'approval',
					'feedback',
					'members',
					'audience',
				],
				context: 'Content marketing goals and success metrics',
				weight: 8,
			},

			// Data Analysis Keywords
			{
				id: 'data-analysis',
				name: 'Data Analysis Terms',
				description: 'Keywords for data analysis and reporting',
				category: 'data-analysis',
				keywords: [
					'data',
					'analytics',
					'metrics',
					'KPI',
					'dashboard',
					'report',
					'chart',
					'graph',
					'visualization',
					'trend',
					'pattern',
					'insight',
					'correlation',
					'regression',
					'prediction',
					'forecast',
					'statistics',
				],
				synonyms: [
					'information',
					'analysis',
					'measurements',
					'indicators',
					'panel',
					'summary',
					'diagram',
					'plot',
					'display',
					'direction',
					'behavior',
					'finding',
					'relationship',
					'modeling',
					'projection',
					'estimate',
					'numbers',
				],
				context: 'Data analysis, reporting, and business intelligence',
				weight: 9,
			},

			// Development Keywords
			{
				id: 'dev-general',
				name: 'General Development',
				description: 'Common software development keywords',
				category: 'development',
				keywords: [
					'code',
					'programming',
					'development',
					'software',
					'application',
					'website',
					'API',
					'database',
					'frontend',
					'backend',
					'fullstack',
					'framework',
					'library',
					'package',
					'module',
					'component',
				],
				synonyms: [
					'coding',
					'programming',
					'building',
					'program',
					'app',
					'site',
					'interface',
					'data store',
					'client-side',
					'server-side',
					'full-stack',
					'platform',
					'toolkit',
					'dependency',
					'unit',
					'element',
				],
				context: 'General software development and programming',
				weight: 8,
			},
			{
				id: 'dev-languages',
				name: 'Programming Languages',
				description: 'Popular programming languages and technologies',
				category: 'development',
				keywords: [
					'JavaScript',
					'Python',
					'Java',
					'TypeScript',
					'React',
					'Node.js',
					'PHP',
					'C#',
					'C++',
					'Go',
					'Rust',
					'Swift',
					'Kotlin',
					'Ruby',
					'Vue',
					'Angular',
					'HTML',
					'CSS',
					'SQL',
					'MongoDB',
				],
				synonyms: [
					'JS',
					'TS',
					'ReactJS',
					'NodeJS',
					'C sharp',
					'Golang',
					'VueJS',
					'AngularJS',
					'Cascading Style Sheets',
					'Structured Query Language',
					'Mongo',
				],
				context: 'Programming languages and development technologies',
				weight: 9,
			},

			// Education Keywords
			{
				id: 'education-subjects',
				name: 'Educational Subjects',
				description: 'Common educational subjects and topics',
				category: 'education',
				keywords: [
					'math',
					'mathematics',
					'science',
					'physics',
					'chemistry',
					'biology',
					'history',
					'english',
					'literature',
					'language',
					'computer science',
					'engineering',
					'business',
					'economics',
					'psychology',
					'philosophy',
				],
				synonyms: [
					'maths',
					'arithmetic',
					'natural science',
					'physical science',
					'life science',
					'past',
					'grammar',
					'writing',
					'linguistics',
					'computing',
					'technology',
					'commerce',
					'finance',
					'behavior',
					'ethics',
				],
				context: 'Academic subjects and educational topics',
				weight: 8,
			},

			// Intent Recognition Keywords
			{
				id: 'intent-question',
				name: 'Question Intent',
				description: 'Keywords indicating question or inquiry intent',
				category: 'intent-recognition',
				keywords: [
					'what',
					'how',
					'why',
					'when',
					'where',
					'who',
					'which',
					'can you',
					'could you',
					'would you',
					'do you',
					'is it',
					'are there',
					'explain',
					'tell me',
					'show me',
				],
				synonyms: ['define', 'describe', 'clarify', 'demonstrate', 'illustrate'],
				context: 'Question and inquiry patterns',
				weight: 10,
			},
			{
				id: 'intent-request',
				name: 'Request Intent',
				description: 'Keywords indicating action or request intent',
				category: 'intent-recognition',
				keywords: [
					'please',
					'help me',
					'I need',
					'I want',
					'can you help',
					'create',
					'make',
					'build',
					'generate',
					'provide',
					'give me',
					'send',
					'schedule',
					'book',
					'order',
					'buy',
					'download',
				],
				synonyms: [
					'assist',
					'require',
					'desire',
					'construct',
					'produce',
					'supply',
					'deliver',
					'arrange',
					'reserve',
					'purchase',
					'acquire',
					'get',
				],
				context: 'Action requests and task commands',
				weight: 9,
			},

			// Sentiment Keywords
			{
				id: 'sentiment-positive',
				name: 'Positive Sentiment',
				description: 'Keywords indicating positive sentiment',
				category: 'sentiment',
				keywords: [
					'good',
					'great',
					'excellent',
					'amazing',
					'wonderful',
					'fantastic',
					'love',
					'like',
					'happy',
					'satisfied',
					'pleased',
					'impressed',
					'perfect',
					'awesome',
					'brilliant',
					'outstanding',
					'superb',
				],
				synonyms: [
					'fine',
					'terrific',
					'incredible',
					'marvelous',
					'fabulous',
					'enjoy',
					'appreciate',
					'content',
					'delighted',
					'thrilled',
					'flawless',
					'remarkable',
					'exceptional',
					'magnificent',
				],
				context: 'Positive emotions and satisfaction',
				weight: 8,
			},
			{
				id: 'sentiment-negative',
				name: 'Negative Sentiment',
				description: 'Keywords indicating negative sentiment',
				category: 'sentiment',
				keywords: [
					'bad',
					'terrible',
					'awful',
					'horrible',
					'disappointing',
					'frustrated',
					'angry',
					'upset',
					'annoyed',
					'dissatisfied',
					'unhappy',
					'hate',
					'dislike',
					'worst',
					'useless',
					'broken',
					'failed',
					'poor',
				],
				synonyms: [
					'dreadful',
					'appalling',
					'disappointing',
					'irritated',
					'furious',
					'disturbed',
					'bothered',
					'displeased',
					'miserable',
					'despise',
					'detest',
					'inferior',
					'worthless',
					'damaged',
					'unsuccessful',
					'inadequate',
				],
				context: 'Negative emotions and dissatisfaction',
				weight: 9,
			},

			// Urgency Keywords
			{
				id: 'urgency-high',
				name: 'High Urgency',
				description: 'Keywords indicating high urgency or priority',
				category: 'urgency',
				keywords: [
					'urgent',
					'emergency',
					'critical',
					'immediate',
					'ASAP',
					'rush',
					'priority',
					'important',
					'deadline',
					'time sensitive',
					'now',
					'quickly',
					'fast',
					'soon',
					'today',
					'right away',
				],
				synonyms: [
					'pressing',
					'crisis',
					'crucial',
					'instant',
					'as soon as possible',
					'hurry',
					'high priority',
					'essential',
					'due date',
					'urgent',
					'immediately',
					'rapidly',
					'swift',
					'shortly',
					'instantly',
					'at once',
				],
				context: 'High priority and urgent requests',
				weight: 10,
			},
		];

		defaultKeywordSets.forEach((keywordSet) => {
			this.keywordSets.set(keywordSet.id, keywordSet);
		});
	}

	private buildIndex(): void {
		this.keywordIndex.clear();

		for (const [keywordSetId, keywordSet] of this.keywordSets) {
			// Index primary keywords
			keywordSet.keywords.forEach((keyword) => {
				const normalizedKeyword = keyword.toLowerCase();
				if (!this.keywordIndex.has(normalizedKeyword)) {
					this.keywordIndex.set(normalizedKeyword, []);
				}
				this.keywordIndex.get(normalizedKeyword)!.push(keywordSetId);
			});

			// Index synonyms
			keywordSet.synonyms.forEach((synonym) => {
				const normalizedSynonym = synonym.toLowerCase();
				if (!this.keywordIndex.has(normalizedSynonym)) {
					this.keywordIndex.set(normalizedSynonym, []);
				}
				this.keywordIndex.get(normalizedSynonym)!.push(keywordSetId);
			});
		}
	}

	addKeywordSet(keywordSet: KeywordSet): void {
		this.keywordSets.set(keywordSet.id, keywordSet);
		this.buildIndex(); // Rebuild index to include new keywords
	}

	getKeywordSet(id: string): KeywordSet | undefined {
		return this.keywordSets.get(id);
	}

	getAllKeywordSets(): KeywordSet[] {
		return Array.from(this.keywordSets.values());
	}

	getKeywordSetsByCategory(category: string): KeywordSet[] {
		return this.getAllKeywordSets().filter((set) => set.category === category);
	}

	analyzeText(text: string): KeywordMatch[] {
		const matches: KeywordMatch[] = [];
		const normalizedText = text.toLowerCase();
		const words = normalizedText.split(/\s+/);
		const phrases = this.generatePhrases(words);

		// Check for keyword matches
		for (const phrase of phrases) {
			const keywordSetIds = this.keywordIndex.get(phrase);
			if (keywordSetIds) {
				for (const keywordSetId of keywordSetIds) {
					const keywordSet = this.keywordSets.get(keywordSetId);
					if (keywordSet) {
						const confidence = this.calculateConfidence(phrase, keywordSet, normalizedText);
						const isSynonym = keywordSet.synonyms.includes(phrase);

						matches.push({
							keyword: phrase,
							confidence,
							context: keywordSet.context,
							category: keywordSet.category,
							synonymFound: isSynonym ? phrase : undefined,
						});
					}
				}
			}
		}

		// Remove duplicates and sort by confidence
		const uniqueMatches = this.removeDuplicateMatches(matches);
		return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
	}

	private generatePhrases(words: string[]): string[] {
		const phrases: string[] = [];

		// Single words
		phrases.push(...words);

		// Two-word phrases
		for (let i = 0; i < words.length - 1; i++) {
			phrases.push(`${words[i]} ${words[i + 1]}`);
		}

		// Three-word phrases
		for (let i = 0; i < words.length - 2; i++) {
			phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
		}

		return phrases;
	}

	private calculateConfidence(phrase: string, keywordSet: KeywordSet, fullText: string): number {
		let confidence = 0.5; // Base confidence

		// Boost confidence based on keyword weight
		confidence += (keywordSet.weight / 10) * 0.3;

		// Boost confidence for exact keyword matches vs synonyms
		if (keywordSet.keywords.includes(phrase)) {
			confidence += 0.2;
		}

		// Boost confidence based on phrase length (longer phrases are more specific)
		const wordCount = phrase.split(' ').length;
		if (wordCount > 1) {
			confidence += (wordCount - 1) * 0.1;
		}

		// Boost confidence based on frequency in text
		const frequency = (fullText.match(new RegExp(phrase, 'g')) || []).length;
		if (frequency > 1) {
			confidence += Math.min(frequency * 0.1, 0.3);
		}

		// Cap confidence at 1.0
		return Math.min(confidence, 1.0);
	}

	private removeDuplicateMatches(matches: KeywordMatch[]): KeywordMatch[] {
		const seen = new Set<string>();
		return matches.filter((match) => {
			const key = `${match.keyword}-${match.category}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
	}

	extractIntents(text: string): string[] {
		const matches = this.analyzeText(text);
		const intents = new Set<string>();

		for (const match of matches) {
			if (match.category === 'intent-recognition' && match.confidence > 0.6) {
				intents.add(match.context);
			}
		}

		return Array.from(intents);
	}

	detectSentiment(text: string): {
		sentiment: 'positive' | 'negative' | 'neutral';
		confidence: number;
	} {
		const matches = this.analyzeText(text);
		let positiveScore = 0;
		let negativeScore = 0;

		for (const match of matches) {
			if (match.category === 'sentiment') {
				if (match.context.includes('Positive')) {
					positiveScore += match.confidence;
				} else if (match.context.includes('Negative')) {
					negativeScore += match.confidence;
				}
			}
		}

		const totalScore = positiveScore + negativeScore;
		if (totalScore === 0) {
			return { sentiment: 'neutral', confidence: 0 };
		}

		if (positiveScore > negativeScore) {
			return { sentiment: 'positive', confidence: positiveScore / totalScore };
		} else {
			return { sentiment: 'negative', confidence: negativeScore / totalScore };
		}
	}

	detectUrgency(text: string): { level: 'high' | 'medium' | 'low'; confidence: number } {
		const matches = this.analyzeText(text);
		let urgencyScore = 0;

		for (const match of matches) {
			if (match.category === 'urgency') {
				urgencyScore += match.confidence;
			}
		}

		if (urgencyScore > 0.7) {
			return { level: 'high', confidence: urgencyScore };
		} else if (urgencyScore > 0.3) {
			return { level: 'medium', confidence: urgencyScore };
		} else {
			return { level: 'low', confidence: urgencyScore };
		}
	}

	categorizeQuery(text: string): Array<{ category: string; confidence: number }> {
		const matches = this.analyzeText(text);
		const categoryScores = new Map<string, number>();

		for (const match of matches) {
			const currentScore = categoryScores.get(match.category) || 0;
			categoryScores.set(match.category, currentScore + match.confidence);
		}

		const categories = Array.from(categoryScores.entries())
			.map(([category, score]) => ({ category, confidence: score }))
			.sort((a, b) => b.confidence - a.confidence);

		return categories;
	}

	searchKeywords(query: string): KeywordSet[] {
		const searchTerm = query.toLowerCase();
		return this.getAllKeywordSets().filter(
			(keywordSet) =>
				keywordSet.name.toLowerCase().includes(searchTerm) ||
				keywordSet.description.toLowerCase().includes(searchTerm) ||
				keywordSet.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm)) ||
				keywordSet.synonyms.some((synonym) => synonym.toLowerCase().includes(searchTerm)),
		);
	}

	getCategories(): string[] {
		const categories = new Set<string>();
		this.getAllKeywordSets().forEach((keywordSet) => categories.add(keywordSet.category));
		return Array.from(categories).sort();
	}

	updateKeywordSet(id: string, updates: Partial<KeywordSet>): boolean {
		const existingSet = this.keywordSets.get(id);
		if (!existingSet) {
			return false;
		}

		const updatedSet = {
			...existingSet,
			...updates,
			metadata: {
				...existingSet.metadata,
				...updates.metadata,
				updatedAt: new Date().toISOString(),
			},
		};

		this.keywordSets.set(id, updatedSet);
		this.buildIndex(); // Rebuild index for updated keywords
		return true;
	}

	deleteKeywordSet(id: string): boolean {
		const deleted = this.keywordSets.delete(id);
		if (deleted) {
			this.buildIndex(); // Rebuild index after deletion
		}
		return deleted;
	}

	exportKeywords(): string {
		const keywordsData = {
			version: '1.0',
			exportDate: new Date().toISOString(),
			keywordSets: this.getAllKeywordSets(),
		};

		return JSON.stringify(keywordsData, null, 2);
	}

	importKeywords(jsonData: string): { success: number; errors: string[] } {
		try {
			const data = JSON.parse(jsonData);
			const results = { success: 0, errors: [] as string[] };

			if (!data.keywordSets || !Array.isArray(data.keywordSets)) {
				results.errors.push('Invalid import format: keywordSets array not found');
				return results;
			}

			for (const keywordSetData of data.keywordSets) {
				try {
					const errors = this.validateKeywordSet(keywordSetData);
					if (errors.length > 0) {
						results.errors.push(`Keyword Set ${keywordSetData.id}: ${errors.join(', ')}`);
						continue;
					}

					this.addKeywordSet(keywordSetData);
					results.success++;
				} catch (error) {
					results.errors.push(
						`Keyword Set ${keywordSetData.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
					);
				}
			}

			return results;
		} catch (error) {
			return {
				success: 0,
				errors: [`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
			};
		}
	}

	private validateKeywordSet(keywordSet: KeywordSet): string[] {
		const errors: string[] = [];

		if (!keywordSet.id || keywordSet.id.trim() === '') {
			errors.push('Keyword set ID is required');
		}

		if (!keywordSet.name || keywordSet.name.trim() === '') {
			errors.push('Keyword set name is required');
		}

		if (!keywordSet.category || keywordSet.category.trim() === '') {
			errors.push('Keyword set category is required');
		}

		if (!Array.isArray(keywordSet.keywords) || keywordSet.keywords.length === 0) {
			errors.push('Keywords array is required and must not be empty');
		}

		if (!Array.isArray(keywordSet.synonyms)) {
			errors.push('Synonyms must be an array');
		}

		if (typeof keywordSet.weight !== 'number' || keywordSet.weight < 1 || keywordSet.weight > 10) {
			errors.push('Weight must be a number between 1 and 10');
		}

		return errors;
	}
}

// Export a singleton instance
export const keywordLibrary = new KeywordLibrary();
