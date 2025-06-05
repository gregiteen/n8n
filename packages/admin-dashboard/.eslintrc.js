const sharedOptions = require('@n8n/eslint-config/shared');

/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	extends: [
		'next/core-web-vitals',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:jsx-a11y/recommended',
		'@n8n/eslint-config/base',
	],

	...sharedOptions(__dirname),

	env: {
		browser: true,
		es6: true,
		node: true,
	},

	settings: {
		react: {
			version: 'detect',
		},
	},

	ignorePatterns: [
		'**/*.js',
		'**/*.d.ts',
		'next.config.js',
		'tailwind.config.js',
		'postcss.config.js',
		'.next/**',
		'out/**',
		'dist/**',
	],

	rules: {
		// React specific rules
		'react/react-in-jsx-scope': 'off', // Not needed in Next.js 13+
		'react/prop-types': 'off', // Using TypeScript for prop validation
		'react/no-unescaped-entities': 'off',
		'react/display-name': 'off',

		// Next.js specific rules
		'@next/next/no-html-link-for-pages': 'off',

		// Accessibility rules
		'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component handles this

		// TypeScript rules adjustments
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-non-null-assertion': 'warn',

		// Import rules
		'import/order': [
			'error',
			{
				groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
				'newlines-between': 'always',
				alphabetize: {
					order: 'asc',
					caseInsensitive: true,
				},
			},
		],

		// General rules
		'unicorn/filename-case': ['error', { case: 'kebabCase' }],
		'no-console': 'warn',
		'prefer-const': 'error',
		'no-var': 'error',

		// Disable some overly strict rules for admin dashboard
		'unicorn/prevent-abbreviations': 'off',
		'unicorn/no-null': 'off',
		'unicorn/prefer-module': 'off',
	},

	overrides: [
		{
			files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**/*.ts', '**/__tests__/**/*.ts'],
			rules: {
				'import/no-extraneous-dependencies': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
			},
		},
		{
			files: ['src/app/**/page.tsx', 'src/app/**/layout.tsx'],
			rules: {
				'import/no-default-export': 'off', // Next.js requires default exports for pages
			},
		},
	],
};
