/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	env: {
		CUSTOM_KEY: 'admin-dashboard',
	},
	async redirects() {
		return [
			{
				source: '/',
				destination: '/dashboard',
				permanent: true,
			},
		];
	},
};

module.exports = nextConfig;
