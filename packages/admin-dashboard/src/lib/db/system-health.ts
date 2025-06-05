import os from 'os';
import { MonitoringService } from '../monitoring-service';

export interface SystemHealthService {
	name: string;
	status: 'healthy' | 'warning' | 'error';
	responseTime: number;
}

export interface SystemHealthSnapshot {
	id?: string;
	timestamp: Date;
	cpu: number;
	memory: number;
	disk: number;
	network: number;
	status: 'healthy' | 'warning' | 'critical';
	services: SystemHealthService[];
}

// Health snapshot extension to the monitoring service
export class SystemHealthMonitor {
	private monitoringService: MonitoringService;
	private healthSnapshots: SystemHealthSnapshot[] = [];

	constructor(monitoringService: MonitoringService) {
		this.monitoringService = monitoringService;
	}

	// Get the current system health
	getCurrentHealth(): SystemHealthSnapshot {
		const cpu = this.monitoringService.getMetricValue('system.cpu.usage') ?? this.getCpuUsage();
		const memory =
			this.monitoringService.getMetricValue('system.memory.usage') ?? this.getMemoryUsage();
		const disk = this.getDiskUsage();
		const network = this.getNetworkUsage();

		return {
			timestamp: new Date(),
			cpu,
			memory,
			disk,
			network,
			status: this.getSystemStatus(cpu, memory, disk),
			services: this.getServiceHealth(),
		};
	}

	// Get system status based on metrics
	private getSystemStatus(
		cpu: number,
		memory: number,
		disk: number,
	): 'healthy' | 'warning' | 'critical' {
		if (cpu > 90 || memory > 95 || disk > 95) {
			return 'critical';
		} else if (cpu > 75 || memory > 85 || disk > 85) {
			return 'warning';
		} else {
			return 'healthy';
		}
	}

	// Take a snapshot of the current system health
	takeSnapshot(): SystemHealthSnapshot {
		const snapshot = this.getCurrentHealth();
		this.healthSnapshots.push(snapshot);

		// Keep only recent snapshots in memory (last 24 hours)
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		this.healthSnapshots = this.healthSnapshots.filter((snap) => snap.timestamp > oneDayAgo);

		return snapshot;
	}

	// Get recent health snapshots
	getSnapshots(hours: number = 24): SystemHealthSnapshot[] {
		const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
		return this.healthSnapshots.filter((snapshot) => snapshot.timestamp > cutoffTime);
	}

	// CPU usage calculation
	private getCpuUsage(): number {
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

	// Memory usage calculation
	private getMemoryUsage(): number {
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;
		const usage = (usedMem / totalMem) * 100;

		return Math.round(usage);
	}

	// Mock disk usage - in production, use proper disk monitoring
	private getDiskUsage(): number {
		// Return current value from monitoring system if available
		const diskMetric = this.monitoringService.getMetricValue('system.disk.usage');
		if (diskMetric !== undefined) {
			return diskMetric;
		}

		// Simulate disk usage between 30-60%
		return Math.floor(Math.random() * 30) + 30;
	}

	// Mock network usage - in production, use proper network monitoring
	private getNetworkUsage(): number {
		// Return current value from monitoring system if available
		const networkMetric = this.monitoringService.getMetricValue('system.network.usage');
		if (networkMetric !== undefined) {
			return networkMetric;
		}

		// Simulate network usage between 10-40%
		return Math.floor(Math.random() * 30) + 10;
	}

	// Mock service health checks - in production, use real service checks
	private getServiceHealth(): SystemHealthService[] {
		return [
			this.checkServiceHealth('API Gateway', 'http://localhost:5678/healthz'),
			this.checkServiceHealth('Database', 'http://localhost:5432'),
			this.checkServiceHealth('AI Engine', 'http://localhost:3000'),
			this.checkServiceHealth('n8n Service', 'http://localhost:5678/api'),
		];
	}

	// Mock service health check - in production, use actual HTTP requests
	private checkServiceHealth(serviceName: string, url: string): SystemHealthService {
		// Make database more reliable for demo purposes
		const isHealthy = Math.random() > (serviceName === 'Database' ? 0.05 : 0.2);
		const isWarning = !isHealthy && Math.random() > 0.5;

		const status = isHealthy ? 'healthy' : isWarning ? 'warning' : 'error';
		const responseTime = Math.floor(Math.random() * 300) + (status === 'healthy' ? 20 : 150);

		return {
			name: serviceName,
			status,
			responseTime,
		};
	}
}
