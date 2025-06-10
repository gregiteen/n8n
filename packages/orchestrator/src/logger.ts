/**
 * Logger implementation
 * This is a temporary stub until the real module is implemented
 */

export class Logger {
	private scope: string;

	constructor(scope: string) {
		this.scope = scope;
	}

	scoped(subscope: string): Logger {
		return new Logger(`${this.scope}:${subscope}`);
	}

	info(message: string, meta?: Record<string, any>): void {
		console.info(`[${this.scope}] ${message}`, meta || '');
	}

	warn(message: string, meta?: Record<string, any>): void {
		console.warn(`[${this.scope}] ${message}`, meta || '');
	}

	error(message: string, meta?: Record<string, any>): void {
		console.error(`[${this.scope}] ${message}`, meta || '');
	}

	debug(message: string, meta?: Record<string, any>): void {
		console.debug(`[${this.scope}] ${message}`, meta || '');
	}
}
