/** @type {import('jest').Config} */
module.exports = {
	...require('../../../jest.config'),
	testTimeout: 10_000,
	moduleNameMapper: {
		// Map specific core package imports first (most specific first)
		'^@/errors/error-reporter$': '<rootDir>/../../core/src/errors/error-reporter.ts',
		'^@/interfaces$': '<rootDir>/../../core/src/interfaces.ts',
		'^@/execution-engine/(.*)$': '<rootDir>/../../core/src/execution-engine/$1',

		// Map task-runner internal imports (these should stay within task-runner)
		'^@/js-task-runner/(.*)$': '<rootDir>/src/js-task-runner/$1',
		'^@/task-runner$': '<rootDir>/src/task-runner.ts',
		'^@/task-state$': '<rootDir>/src/task-state.ts',
		'^@/config/(.*)$': '<rootDir>/src/config/$1',
		'^@/runner-types$': '<rootDir>/src/runner-types.ts',
		'^@/node-types$': '<rootDir>/src/node-types.ts',

		// Generic core package mapping (less specific, comes last)
		'^@/(.*)$': '<rootDir>/../../core/src/$1',
	},
};
