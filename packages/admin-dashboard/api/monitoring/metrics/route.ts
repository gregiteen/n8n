import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

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

// Simulate historical metrics data
function generateTimeSeriesData(hours: number = 12) {
	const now = new Date();
	const data = [];

	for (let i = hours - 1; i >= 0; i--) {
		const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
		data.push({
			time: time.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
			}),
			cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
			memory: Math.floor(Math.random() * 25) + 55, // 55-80%
		});
	}

	return data;
}

function generateAgentActivity(hours: number = 12) {
	const now = new Date();
	const data = [];

	for (let i = hours - 1; i >= 0; i--) {
		const time = new Date(now.getTime() - i * 5 * 60 * 1000);
		const requests = Math.floor(Math.random() * 50) + 20;
		const failures = Math.floor(Math.random() * 3);

		data.push({
			time: time.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
			}),
			requests,
			success: requests - failures,
			failures,
		});
	}

	return data;
}

function generateWorkflowMetrics(hours: number = 12) {
	const now = new Date();
	const data = [];

	for (let i = hours - 1; i >= 0; i--) {
		const time = new Date(now.getTime() - i * 5 * 60 * 1000);
		const executions = Math.floor(Math.random() * 20) + 5;
		const successRate = Math.floor(Math.random() * 15) + 85; // 85-100%

		data.push({
			time: time.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
			}),
			executions,
			success_rate: successRate,
		});
	}

	return data;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const timeRange = searchParams.get('timeRange') || '12h';

		// Parse timeRange (for now, just support hours)
		const hours = parseInt(timeRange.replace('h', '')) || 12;

		const metricsData: MetricsData = {
			systemUsage: generateTimeSeriesData(hours),
			agentActivity: generateAgentActivity(hours),
			workflowMetrics: generateWorkflowMetrics(hours),
		};

		return NextResponse.json(metricsData);
	} catch (error) {
		console.error('Error fetching metrics data:', error);
		return NextResponse.json({ error: 'Failed to fetch metrics data' }, { status: 500 });
	}
}
