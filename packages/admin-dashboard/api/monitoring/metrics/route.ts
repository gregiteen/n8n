import { NextRequest, NextResponse } from 'next/server';
import { monitoringSystem } from '@/lib/db';

interface MetricsData {
	systemUsage: Array<{
		time: string;
		cpu: number;
		memory: number;
	}>;
	agentActivity: Array<{
		time: string;
		requests: number;
		success: number;
		failures: number;
	}>;
	workflowMetrics: Array<{
		time: string;
		executions: number;
		success_rate: number;
	}>;
}

// Helper function to generate time series data points
function generateTimePoints(hours: number = 12): Date[] {
	const now = new Date();
	const timePoints = [];

	for (let i = hours - 1; i >= 0; i--) {
		const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
		timePoints.push(time);
	}

	return timePoints;
}

// Format time for display
function formatTime(date: Date): string {
	return date.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
	});
}

// Helper function to find the closest metric to a given time
function findClosestMetric(metrics: any[], targetTime: Date) {
	if (!metrics || metrics.length === 0) return null;

	return metrics.reduce((closest, current) => {
		const currentDiff = Math.abs(new Date(current.timestamp).getTime() - targetTime.getTime());
		const closestDiff = closest
			? Math.abs(new Date(closest.timestamp).getTime() - targetTime.getTime())
			: Infinity;
		return currentDiff < closestDiff ? current : closest;
	}, null);
}

// Generate system usage metrics using the database or fallback to mock data
async function getSystemUsageMetrics(
	hours: number = 12,
): Promise<Array<{ time: string; cpu: number; memory: number }>> {
	try {
		// Get system metrics from the monitoring database
		const cpuMetrics = await monitoringSystem.getMetricsHistory(['system.cpu.usage'], hours / 24);
		const memoryMetrics = await monitoringSystem.getMetricsHistory(
			['system.memory.usage'],
			hours / 24,
		);

		// Generate time points
		const timePoints = generateTimePoints(hours);

		// Map time points to metrics
		return timePoints.map((time) => {
			const closestCpuMetric = findClosestMetric(cpuMetrics, time);
			const closestMemoryMetric = findClosestMetric(memoryMetrics, time);

			return {
				time: formatTime(time),
				cpu: closestCpuMetric?.value ?? Math.floor(Math.random() * 30) + 40, // Fallback to random
				memory: closestMemoryMetric?.value ?? Math.floor(Math.random() * 25) + 55, // Fallback to random
			};
		});
	} catch (error) {
		console.error('Error getting system metrics:', error);
		return generateMockSystemUsage(hours);
	}
}

// Generate agent activity metrics using the database or fallback to mock data
async function getAgentActivityMetrics(
	hours: number = 12,
): Promise<Array<{ time: string; requests: number; success: number; failures: number }>> {
	try {
		// Get agent metrics from the database
		const requestMetrics = await monitoringSystem.getMetricsHistory(
			['agent.requests.count'],
			hours / 24,
		);
		const errorMetrics = await monitoringSystem.getMetricsHistory(
			['agent.errors.count'],
			hours / 24,
		);

		// Generate time points
		const timePoints = generateTimePoints(hours);

		// Map time points to metrics
		return timePoints.map((time) => {
			const closestRequestMetric = findClosestMetric(requestMetrics, time);
			const closestErrorMetric = findClosestMetric(errorMetrics, time);

			const requests = closestRequestMetric?.value ?? Math.floor(Math.random() * 50) + 20;
			const failures = closestErrorMetric?.value ?? Math.floor(Math.random() * 3);

			return {
				time: formatTime(time),
				requests,
				success: requests - failures,
				failures,
			};
		});
	} catch (error) {
		console.error('Error getting agent metrics:', error);
		return generateMockAgentActivity(hours);
	}
}

// Generate workflow metrics using the database or fallback to mock data
async function getWorkflowMetrics(
	hours: number = 12,
): Promise<Array<{ time: string; executions: number; success_rate: number }>> {
	try {
		// Get workflow metrics from the database
		const executionMetrics = await monitoringSystem.getMetricsHistory(
			['workflow.executions.count'],
			hours / 24,
		);
		const successRateMetrics = await monitoringSystem.getMetricsHistory(
			['workflow.success_rate'],
			hours / 24,
		);

		// Generate time points
		const timePoints = generateTimePoints(hours);

		// Map time points to metrics
		return timePoints.map((time) => {
			const closestExecutionMetric = findClosestMetric(executionMetrics, time);
			const closestSuccessRateMetric = findClosestMetric(successRateMetrics, time);

			return {
				time: formatTime(time),
				executions: closestExecutionMetric?.value ?? Math.floor(Math.random() * 20) + 5,
				success_rate: closestSuccessRateMetric?.value ?? Math.floor(Math.random() * 15) + 85,
			};
		});
	} catch (error) {
		console.error('Error getting workflow metrics:', error);
		return generateMockWorkflowMetrics(hours);
	}
}

// Generate mock system usage data when database is unavailable
function generateMockSystemUsage(
	hours: number = 12,
): Array<{ time: string; cpu: number; memory: number }> {
	const timePoints = generateTimePoints(hours);

	return timePoints.map((time) => ({
		time: formatTime(time),
		cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
		memory: Math.floor(Math.random() * 25) + 55, // 55-80%
	}));
}

// Generate mock agent activity data when database is unavailable
function generateMockAgentActivity(
	hours: number = 12,
): Array<{ time: string; requests: number; success: number; failures: number }> {
	const timePoints = generateTimePoints(hours);

	return timePoints.map((time) => {
		const requests = Math.floor(Math.random() * 50) + 20;
		const failures = Math.floor(Math.random() * 3);

		return {
			time: formatTime(time),
			requests,
			success: requests - failures,
			failures,
		};
	});
}

// Generate mock workflow metrics data when database is unavailable
function generateMockWorkflowMetrics(
	hours: number = 12,
): Array<{ time: string; executions: number; success_rate: number }> {
	const timePoints = generateTimePoints(hours);

	return timePoints.map((time) => ({
		time: formatTime(time),
		executions: Math.floor(Math.random() * 20) + 5,
		success_rate: Math.floor(Math.random() * 15) + 85, // 85-100%
	}));
}

export async function GET(request: NextRequest) {
	try {
		// Get timeRange parameter (default to 12h)
		const { searchParams } = new URL(request.url);
		const timeRange = searchParams.get('timeRange') || '12h';
		const hours = parseInt(timeRange.replace('h', '')) || 12;

		// Gather all metrics in parallel
		const [systemUsage, agentActivity, workflowMetrics] = await Promise.all([
			getSystemUsageMetrics(hours),
			getAgentActivityMetrics(hours),
			getWorkflowMetrics(hours),
		]);

		// Construct the response
		const metricsData: MetricsData = {
			systemUsage,
			agentActivity,
			workflowMetrics,
		};

		return NextResponse.json(metricsData);
	} catch (error) {
		console.error('Error fetching metrics:', error);
		return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
	}
}
