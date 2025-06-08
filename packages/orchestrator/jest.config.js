/** @type {import('jest').Config} */
module.exports = {
	...require('../../jest.config'),
	testTimeout: 10_000,
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				isolatedModules: false, // Set to false to avoid the deprecation warning
				tsconfig: 'tsconfig.json',
			},
		],
	},
};
