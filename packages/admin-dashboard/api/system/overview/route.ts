import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

interface SystemMetrics {
	systemStatus: string;
	activeAgents: number;
	cpuUsage: number;
	memoryUsage: number;
	diskUsage: number;
	uptime: string;
	lastUpdated: string;
}

function formatUptime(uptimeSeconds: number): string {
	const days = Math.floor(uptimeSeconds / (24 * 3600));
	const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
	const minutes = Math.floor((uptimeSeconds % 3600) / 60);

	if (days > 0) {
		return `${days} days, ${hours} hours`;
	} else if (hours > 0) {
		return `${hours} hours, ${minutes} minutes`;
	} else {
		return `${minutes} minutes`;
	}
}

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

function getMemoryUsage(): number {
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const usedMem = totalMem - freeMem;
	const usage = (usedMem / totalMem) * 100;

	return Math.round(usage);
}

export async function GET(request: NextRequest) {
	try {
		const cpu = getCpuUsage();
		const memory = getMemoryUsage();
		const uptime = os.uptime();

		// Determine system status based on metrics
		let systemStatus = 'Healthy';
		if (cpu > 90 || memory > 95) {
			systemStatus = 'Critical';
		} else if (cpu > 75 || memory > 85) {
			systemStatus = 'Warning';
		}

		// Mock active agents count (in production, get from actual agent registry)
		const activeAgents = Math.floor(Math.random() * 3) + 2; // 2-4 agents

		// Mock disk usage (in production, use proper disk monitoring)
		const diskUsage = Math.floor(Math.random() * 30) + 30; // 30-60%

		const systemMetrics: SystemMetrics = {
			systemStatus,
			activeAgents,
			cpuUsage: cpu,
			memoryUsage: memory,
			diskUsage,
			uptime: formatUptime(uptime),
			lastUpdated: new Date().toISOString(),
		};

		return NextResponse.json(systemMetrics);
	} catch (error) {
		console.error('Error fetching system overview:', error);
		return NextResponse.json({ error: 'Failed to fetch system overview' }, { status: 500 });
	}
}
