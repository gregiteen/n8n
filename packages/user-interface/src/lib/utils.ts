import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	} else {
		return `${seconds}s`;
	}
}

export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days} day${days > 1 ? 's' : ''} ago`;
	} else if (hours > 0) {
		return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	} else if (minutes > 0) {
		return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	} else {
		return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
	}
}

export function getStatusColor(status: string): string {
	switch (status) {
		case 'running':
			return 'text-blue-600 bg-blue-100';
		case 'queued':
			return 'text-yellow-600 bg-yellow-100';
		case 'completed':
			return 'text-green-600 bg-green-100';
		case 'failed':
			return 'text-red-600 bg-red-100';
		case 'paused':
			return 'text-gray-600 bg-gray-100';
		case 'cancelled':
			return 'text-orange-600 bg-orange-100';
		default:
			return 'text-gray-600 bg-gray-100';
	}
}

export function getTaskTypeIcon(type: string): string {
	switch (type) {
		case 'chat':
			return '💬';
		case 'analysis':
			return '📊';
		case 'scraping':
			return '🕷️';
		case 'generation':
			return '⚡';
		case 'writing':
			return '✍️';
		case 'image-analysis':
			return '🖼️';
		case 'workflow':
			return '🔄';
		case 'decision':
			return '🎯';
		default:
			return '📋';
	}
}
