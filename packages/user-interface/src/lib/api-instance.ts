/**
 * API Service Instance - Singleton instance for stores to use
 */

import { APIService, DEFAULT_API_CONFIG, DEFAULT_WS_CONFIG } from './api/index';

// Create singleton instance with proper typing
export const apiService: APIService = new APIService(DEFAULT_API_CONFIG, DEFAULT_WS_CONFIG);

// Export the instance as default
export default apiService;
