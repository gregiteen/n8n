/**
 * Task Error Handler Service
 * Integrates with the ErrorRecoveryService to handle task errors and retries
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { ErrorRecoveryService, RecoveryConfig } from '../error-handling/error-recovery';
import { Task, TaskRetryConfig } from './task-types';

@Service()
export class TaskErrorHandlerService {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(ErrorRecoveryService) private readonly errorRecoveryService: ErrorRecoveryService,
	) {
		this.logger = this.logger.scoped('task-error-handler');
	}

	/**
	 * Create recovery config from task configuration or use defaults
	 */
	createRetryConfig(task: Task): RecoveryConfig {
		return {
			maxRetries: task.maxRetries,
			initialDelay: task.retryConfig?.initialDelay || 1000,
			maxDelay: task.retryConfig?.maxDelay || 30000,
			backoffFactor: task.retryConfig?.backoffFactor || 2,
			fallbackFunction: task.retryConfig?.fallbackFunction,
			notifyFunction: task.retryConfig?.notifyFunction,
		};
	}

	/**
	 * Handle task error and determine retry strategy
	 */
	async handleTaskError(
		task: Task,
		error: Error,
		retryCount: number,
	): Promise<{
		shouldRetry: boolean;
		retryDelay?: number;
		status: string;
		errorMessage?: string;
		fallbackResult?: any;
		errorType: string;
	}> {
		// Create recovery config from task configuration
		const recoveryConfig = this.createRetryConfig(task);

		// Use error recovery service to determine retry strategy
		const errorRecoveryResult = await this.errorRecoveryService.handleTaskError(
			task,
			error,
			retryCount + 1,
			recoveryConfig,
		);

		// Get the error type for logging and tracking
		const errorType = this.errorRecoveryService.classifyError(error).toString();

		return {
			...errorRecoveryResult,
			errorType,
		};
	}

	/**
	 * Record a successful task completion for circuit breaking purposes
	 */
	recordTaskSuccess(task: Task, previousErrorType?: string): void {
		if (previousErrorType) {
			const errorType = previousErrorType as any;
			this.errorRecoveryService.recordTaskSuccess(task, errorType);
		}
	}
}
