module.exports = {
	extends: ['../../.eslintrc.js'],
	parserOptions: {
		project: './tsconfig.json',
	},
	rules: {
		'@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/no-explicit-any': 'error',
	},
};
