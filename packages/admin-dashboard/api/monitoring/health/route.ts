import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { performance } from 'perf_hooks';

interface SystemHealth {
	cpu: number;
	memory: number;
	disk: number;
	network: number;
	uptime: number;
	services: Array<{
		name: string;
		status: 'healthy' | 'warning' | 'error';
		responseTime: number;
	}>;
}

// Simple health check for external services
async function checkServiceHealth(
	serviceName: string,
	url: string,
): Promise<{
	name: string;
	status: 'healthy' | 'warning' | 'error';
	responseTime: number;
}> {
	const start = performance.now();

	try {
		const response = await fetch(url, {
			method: 'GET',
			timeout: 5000,
		});

		const responseTime = Math.round(performance.now() - start);

		if (response.ok) {
			return {
				name: serviceName,
				status: responseTime < 200 ? 'healthy' : 'warning',
				responseTime,
			};
		} else {
			return {
				name: serviceName,
				status: 'error',
				responseTime,
			};
		}
	} catch (error) {
		const responseTime = Math.round(performance.now() - start);
		return {
			name: serviceName,
			status: 'error',
			responseTime,
		};
	}
}

// Get CPU usage percentage
function getCpuUsage(): number {
	const cpus = os.cpus();
	let totalIdle = 0;
	let totalTick = 0;

	cpus.forEach((cpu) => {
		for (const type in cpu.times) {
			totalTick += cpu.times[type as keyof typeof cpu.times];
		}
		totalIdle += cpu.times.idle;
	});

	const idle = totalIdle / cpus.length;
	const total = totalTick / cpus.length;
	const usage = 100 - (100 * idle) / total;

	return Math.round(usage);
}

// Get memory usage percentage
function getMemoryUsage(): number {
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const usedMem = totalMem - freeMem;
	const usage = (usedMem / totalMem) * 100;

	return Math.round(usage);
}

// Mock disk usage - in production, use proper disk monitoring
function getDiskUsage(): number {
	// Simulate disk usage between 30-60%
	return Math.floor(Math.random() * 30) + 30;
}

// Mock network usage - in production, use proper network monitoring
function getNetworkUsage(): number {
	// Simulate network usage between 10-40%
	return Math.floor(Math.random() * 30) + 10;
}

export async function GET(request: NextRequest) {
	try {
		// Get system metrics
		const cpu = getCpuUsage();
		const memory = getMemoryUsage();
		const disk = getDiskUsage();
		const network = getNetworkUsage();
		const uptime = Math.round(os.uptime());

		// Check service health
		const services = await Promise.all([
			checkServiceHealth('API Gateway', 'http://localhost:5678/healthz'),
			checkServiceHealth('Database', 'http://localhost:5432'), // Mock for now
			checkServiceHealth('AI Engine', 'http://localhost:3000'), // Mock for now
			checkServiceHealth('n8n Service', 'http://localhost:5678/healthz'),
		]);

		const healthData: SystemHealth = {
			cpu,
			memory,
			disk,
			network,
			uptime,
			services,
		};

		return NextResponse.json(healthData);
	} catch (error) {
		console.error('Error fetching system health:', error);
		return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 });
	}
}
