/**
 * Error Recovery Service
 *
 * Provides robust error handling and recovery strategies for tasks and workflows
 * including retries with exponential backoff, circuit breaking, and fallbacks.
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { Task, TaskStatus } from '../services/task-management/task-types';

// Error types that can be handled
export enum ErrorType {
	TEMPORARY = 'temporary',
	PERMANENT = 'permanent',
	TIMEOUT = 'timeout',
	RESOURCE_CONSTRAINT = 'resource_constraint',
	VALIDATION = 'validation',
	AUTHORIZATION = 'authorization',
	NOT_FOUND = 'not_found',
	UNKNOWN = 'unknown',
}

// Recovery strategies
export enum RecoveryStrategy {
	RETRY = 'retry',
	FALLBACK = 'fallback',
	CIRCUIT_BREAK = 'circuit_break',
	NOTIFY = 'notify',
	ABORT = 'abort',
}

// Configuration for recovery strategies
export interface RecoveryConfig {
	maxRetries: number;
	initialDelay: number;
	maxDelay: number;
	backoffFactor: number;
	fallbackFunction?: (task: Task, error: Error) => Promise<any>;
	notifyFunction?: (task: Task, error: Error) => Promise<void>;
}

@Service()
export class ErrorRecoveryService {
	// Default config
	private defaultConfig: RecoveryConfig = {
		maxRetries: 3,
		initialDelay: 1000, // 1 second
		maxDelay: 30000, // 30 seconds
		backoffFactor: 2,
	};

	// Circuit breaker state
	private circuitState: Map<
		string,
		{
			failures: number;
			lastFailure: Date;
			state: 'closed' | 'open' | 'half-open';
		}
	> = new Map();

	// Threshold for circuit breaking
	private circuitBreakThreshold = 5;
	private circuitBreakResetTimeout = 60000; // 1 minute

	constructor(@Inject(Logger) private readonly logger: Logger) {
		this.logger = this.logger.scoped('error-recovery');
	}

	/**
	 * Classify an error to determine the appropriate recovery strategy
	 */
	classifyError(error: Error): ErrorType {
		if (!error) return ErrorType.UNKNOWN;

		const message = error.message.toLowerCase();

		if (message.includes('timeout') || message.includes('timed out')) {
			return ErrorType.TIMEOUT;
		}

		if (
			message.includes('rate limit') ||
			message.includes('too many requests') ||
			message.includes('429')
		) {
			return ErrorType.TEMPORARY;
		}

		if (message.includes('not found') || message.includes('404')) {
			return ErrorType.NOT_FOUND;
		}

		if (
			message.includes('unauthorized') ||
			message.includes('forbidden') ||
			message.includes('401') ||
			message.includes('403')
		) {
			return ErrorType.AUTHORIZATION;
		}

		if (message.includes('validation') || message.includes('invalid')) {
			return ErrorType.VALIDATION;
		}

		if (message.includes('memory') || message.includes('cpu') || message.includes('resource')) {
			return ErrorType.RESOURCE_CONSTRAINT;
		}

		return ErrorType.UNKNOWN;
	}

	/**
	 * Determine the best recovery strategy for an error
	 */
	determineRecoveryStrategy(errorType: ErrorType, task: Task, attempt: number): RecoveryStrategy {
		// Check if we've exceeded max retries
		const maxRetries = task.maxRetries || this.defaultConfig.maxRetries;
		if (attempt > maxRetries) {
			return RecoveryStrategy.ABORT;
		}

		// Check if the circuit is open for this type of task
		// Ensure task.taskType (which can be a string or TaskType enum) is handled consistently for circuitKey
		const circuitKey = `${String(task.taskType)}-${errorType}`;
		const circuitInfo = this.circuitState.get(circuitKey);
		if (circuitInfo && circuitInfo.state === 'open') {
			const timeSinceLastFailure = new Date().getTime() - circuitInfo.lastFailure.getTime();
			if (timeSinceLastFailure < this.circuitBreakResetTimeout) {
				return RecoveryStrategy.FALLBACK;
			}

			// Reset to half-open state after timeout
			this.circuitState.set(circuitKey, {
				...circuitInfo,
				state: 'half-open',
			});
		}

		// Choose strategy based on error type
		switch (errorType) {
			case ErrorType.TEMPORARY:
			case ErrorType.TIMEOUT:
				return RecoveryStrategy.RETRY;

			case ErrorType.NOT_FOUND:
			case ErrorType.VALIDATION:
				// These are likely permanent issues that retrying won't fix
				return RecoveryStrategy.ABORT;

			case ErrorType.AUTHORIZATION:
				// Auth issues might be temporary or permanent
				return attempt <= 1 ? RecoveryStrategy.RETRY : RecoveryStrategy.NOTIFY;

			case ErrorType.RESOURCE_CONSTRAINT:
				// Resource issues might resolve with a backoff
				return RecoveryStrategy.RETRY;

			case ErrorType.PERMANENT:
				return RecoveryStrategy.ABORT;

			case ErrorType.UNKNOWN:
			default:
				// Be conservative with unknown errors
				return attempt <= 2 ? RecoveryStrategy.RETRY : RecoveryStrategy.ABORT;
		}
	}

	/**
	 * Update the circuit breaker state based on success or failure
	 */
	updateCircuitState(task: Task, errorType: ErrorType, isSuccess: boolean): void {
		// Ensure task.taskType (which can be a string or TaskType enum) is handled consistently for circuitKey
		const circuitKey = `${String(task.taskType)}-${errorType}`;
		let circuitInfo = this.circuitState.get(circuitKey);

		if (!circuitInfo) {
			circuitInfo = {
				failures: 0,
				lastFailure: new Date(),
				state: 'closed',
			};
		}

		if (isSuccess) {
			// On success, if we're in half-open state, close the circuit
			if (circuitInfo.state === 'half-open') {
				circuitInfo.state = 'closed';
				circuitInfo.failures = 0;
			}
		} else {
			// On failure
			circuitInfo.failures++;
			circuitInfo.lastFailure = new Date();

			// If failures exceed threshold, open the circuit
			if (circuitInfo.failures >= this.circuitBreakThreshold) {
				circuitInfo.state = 'open';
				this.logger.warn(
					`Circuit breaker tripped for ${String(task.taskType)} tasks with ${errorType} errors. ` +
						`Circuit will remain open for ${this.circuitBreakResetTimeout / 1000} seconds.`,
				);
			}
		}

		this.circuitState.set(circuitKey, circuitInfo);
	}

	/**
	 * Calculate retry delay using exponential backoff
	 */
	calculateRetryDelay(attempt: number, config: RecoveryConfig): number {
		const delay = Math.min(
			config.maxDelay,
			config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
		);

		// Add jitter to prevent thundering herd problem
		const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 randomization factor
		return Math.floor(delay * jitter);
	}

	/**
	 * Handle a task error and execute recovery strategy
	 */
	async handleTaskError(
		task: Task,
		error: Error,
		attempt: number = 1,
		config: RecoveryConfig = this.defaultConfig,
	): Promise<{
		shouldRetry: boolean;
		retryDelay?: number;
		fallbackResult?: any;
		status: TaskStatus; // This TaskStatus is now correctly from task-types.ts
		errorMessage?: string;
	}> {
		// Classify the error
		const errorType = this.classifyError(error);

		// Determine recovery strategy
		const strategy = this.determineRecoveryStrategy(errorType, task, attempt);

		this.logger.debug(
			`Task ${task.id} error recovery: type=${errorType}, strategy=${strategy}, attempt=${attempt}`,
		);

		// Execute strategy
		switch (strategy) {
			case RecoveryStrategy.RETRY:
				// Update circuit state
				this.updateCircuitState(task, errorType, false);

				// Calculate retry delay
				const retryDelay = this.calculateRetryDelay(attempt, config);

				return {
					shouldRetry: true,
					retryDelay,
					status: TaskStatus.QUEUED,
					errorMessage: `Retrying after error: ${error.message} (attempt ${attempt})`,
				};

			case RecoveryStrategy.FALLBACK:
				if (config.fallbackFunction) {
					try {
						const fallbackResult = await config.fallbackFunction(task, error);
						return {
							shouldRetry: false,
							fallbackResult,
							status: TaskStatus.COMPLETED,
							errorMessage: `Used fallback after error: ${error.message}`,
						};
					} catch (fallbackError: any) {
						return {
							shouldRetry: false,
							status: TaskStatus.FAILED,
							errorMessage: `Fallback also failed: ${fallbackError.message} after error: ${error.message}`,
						};
					}
				}
				return {
					shouldRetry: false,
					status: TaskStatus.FAILED,
					errorMessage: `No fallback available for error: ${error.message}`,
				};

			case RecoveryStrategy.NOTIFY:
				if (config.notifyFunction) {
					await config.notifyFunction(task, error);
				}
				return {
					shouldRetry: false,
					status: TaskStatus.FAILED,
					errorMessage: `Notification sent for error: ${error.message}`,
				};

			case RecoveryStrategy.CIRCUIT_BREAK:
				this.updateCircuitState(task, errorType, false);
				return {
					shouldRetry: false,
					status: TaskStatus.FAILED,
					errorMessage: `Circuit breaker activated after error: ${error.message}`,
				};

			case RecoveryStrategy.ABORT:
			default:
				return {
					shouldRetry: false,
					status: TaskStatus.FAILED,
					errorMessage: `Task aborted after error: ${error.message}`,
				};
		}
	}

	/**
	 * Record a successful task completion for circuit breaking purposes
	 */
	recordTaskSuccess(task: Task, errorType: ErrorType): void {
		this.updateCircuitState(task, errorType, true);
	}
}
