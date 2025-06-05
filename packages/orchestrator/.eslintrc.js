const sharedOptions = require('@n8n/eslint-config/shared');

module.exports = {
	extends: ['@n8n/eslint-config/node'],
	...sharedOptions(__dirname),
	rules: {
		'unicorn/filename-case': ['error', { case: 'kebabCase' }],
	},
};
