// Export library classes and interfaces
export { PromptLibrary, promptLibrary } from './prompt-library';
export type { PromptTemplate } from './prompt-library';

export { KeywordLibrary, keywordLibrary } from './keyword-library';
export type { KeywordSet, KeywordMatch } from './keyword-library';

export { LibraryManager, libraryManager } from './library-manager';
export type {
	LibraryAnalysis,
	SmartAgentConfig,
	AdaptationRule,
} from './library-manager';

// Import instances for use in convenience exports
import { keywordLibrary } from './keyword-library';
import { libraryManager } from './library-manager';
import { promptLibrary } from './prompt-library';

// Convenience exports for commonly used functionality
export const libraries = {
	prompt: promptLibrary,
	keyword: keywordLibrary,
	manager: libraryManager,
};

// Utility functions for quick access
export const analyzeText = (text: string) => libraryManager.analyzeUserInput(text);
export const getPromptRecommendations = (text: string, limit?: number) =>
	libraryManager.getPromptRecommendations(text, limit);
export const createSmartAgent = (
	input: string,
	promptId: string,
	variables?: Record<string, string>,
) => libraryManager.createSmartAgentConfig(input, promptId, variables);
export const searchAll = (query: string) => libraryManager.searchLibraries(query);
