import os from 'os';
import { performance } from 'perf_hooks';

export interface MetricDefinition {
	name: string;
	type: 'gauge' | 'counter' | 'histogram';
	description: string;
	labels?: string[];
	buckets?: number[];
	privacyImpact: 'none' | 'low' | 'medium' | 'high';
}

export interface TimeRange {
	start: Date;
	end: Date;
}

export interface AlertThreshold {
	metric: string;
	operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
	value: number;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Alert {
	id: string;
	metric: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	timestamp: Date;
	resolved: boolean;
}

export interface PrivacySettings {
	anonymizeUserData: boolean;
	retentionDays: number;
	enableTelemetry: boolean;
	allowCrossReference: boolean;
}

export class MonitoringService {
	private metrics: Map<string, MetricDefinition> = new Map();
	private metricValues: Map<string, number> = new Map();
	private alerts: Alert[] = [];
	private alertThresholds: AlertThreshold[] = [];
	private privacySettings: PrivacySettings;
	private isCollecting: boolean = false;
	private collectionInterval?: NodeJS.Timeout;

	constructor(privacySettings: PrivacySettings) {
		this.privacySettings = privacySettings;
		this.registerDefaultMetrics();
	}

	async initialize(): Promise<void> {
		console.log('Initializing monitoring service...');
		this.setupDefaultAlerts();
		await this.startCollection();
	}

	async shutdown(): Promise<void> {
		console.log('Shutting down monitoring service...');
		this.stopCollection();
	}

	private registerDefaultMetrics(): void {
		// System metrics
		this.registerMetric({
			name: 'system.cpu.usage',
			type: 'gauge',
			description: 'CPU usage percentage',
			labels: ['process'],
			privacyImpact: 'none',
		});

		this.registerMetric({
			name: 'system.memory.usage',
			type: 'gauge',
			description: 'Memory usage in MB',
			labels: ['process'],
			privacyImpact: 'none',
		});

		this.registerMetric({
			name: 'system.uptime',
			type: 'gauge',
			description: 'System uptime in seconds',
			privacyImpact: 'none',
		});

		// AI Agent metrics
		this.registerMetric({
			name: 'ai.requests.count',
			type: 'counter',
			description: 'Number of AI requests',
			labels: ['model', 'success'],
			privacyImpact: 'low',
		});

		this.registerMetric({
			name: 'ai.requests.latency',
			type: 'histogram',
			description: 'Latency of AI requests in ms',
			labels: ['model'],
			buckets: [10, 50, 100, 500, 1000, 5000],
			privacyImpact: 'none',
		});

		// Workflow metrics
		this.registerMetric({
			name: 'workflow.executions.count',
			type: 'counter',
			description: 'Number of workflow executions',
			labels: ['workflow_id', 'status'],
			privacyImpact: 'medium',
		});

		this.registerMetric({
			name: 'workflow.executions.duration',
			type: 'histogram',
			description: 'Duration of workflow executions in ms',
			labels: ['workflow_id'],
			buckets: [100, 500, 1000, 5000, 10000, 30000],
			privacyImpact: 'low',
		});
	}

	private setupDefaultAlerts(): void {
		this.alertThresholds = [
			{
				metric: 'system.cpu.usage',
				operator: '>',
				value: 80,
				severity: 'medium',
			},
			{
				metric: 'system.cpu.usage',
				operator: '>',
				value: 95,
				severity: 'critical',
			},
			{
				metric: 'system.memory.usage',
				operator: '>',
				value: 85,
				severity: 'medium',
			},
			{
				metric: 'system.memory.usage',
				operator: '>',
				value: 95,
				severity: 'critical',
			},
		];
	}

	registerMetric(definition: MetricDefinition): void {
		if (this.shouldCollectMetric(definition)) {
			this.metrics.set(definition.name, definition);
			console.log(`Registered metric: ${definition.name}`);
		}
	}

	private shouldCollectMetric(definition: MetricDefinition): boolean {
		// Respect privacy settings
		if (!this.privacySettings.enableTelemetry && definition.privacyImpact !== 'none') {
			return false;
		}

		if (definition.privacyImpact === 'high' && !this.privacySettings.allowCrossReference) {
			return false;
		}

		return true;
	}

	async startCollection(): Promise<void> {
		if (this.isCollecting) return;

		this.isCollecting = true;
		this.collectionInterval = setInterval(() => {
			this.collectSystemMetrics();
			this.checkAlerts();
		}, 5000); // Collect every 5 seconds

		console.log('Metrics collection started');
	}

	stopCollection(): void {
		if (this.collectionInterval) {
			clearInterval(this.collectionInterval);
			this.collectionInterval = undefined;
		}
		this.isCollecting = false;
		console.log('Metrics collection stopped');
	}

	private collectSystemMetrics(): void {
		try {
			// CPU usage
			const cpuUsage = this.getCpuUsage();
			this.metricValues.set('system.cpu.usage', cpuUsage);

			// Memory usage
			const memoryUsage = this.getMemoryUsage();
			this.metricValues.set('system.memory.usage', memoryUsage);

			// Uptime
			const uptime = os.uptime();
			this.metricValues.set('system.uptime', uptime);
		} catch (error) {
			console.error('Error collecting system metrics:', error);
		}
	}

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

	private getMemoryUsage(): number {
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;
		const usage = (usedMem / totalMem) * 100;

		return Math.round(usage);
	}

	private checkAlerts(): void {
		this.alertThresholds.forEach((threshold) => {
			const currentValue = this.metricValues.get(threshold.metric);
			if (currentValue === undefined) return;

			const shouldAlert = this.evaluateThreshold(currentValue, threshold);

			if (shouldAlert) {
				const existingAlert = this.alerts.find(
					(alert) =>
						alert.metric === threshold.metric &&
						alert.severity === threshold.severity &&
						!alert.resolved,
				);

				if (!existingAlert) {
					this.createAlert(threshold, currentValue);
				}
			} else {
				// Resolve existing alerts if condition no longer met
				this.alerts
					.filter(
						(alert) =>
							alert.metric === threshold.metric &&
							alert.severity === threshold.severity &&
							!alert.resolved,
					)
					.forEach((alert) => {
						alert.resolved = true;
						console.log(`Alert resolved: ${alert.message}`);
					});
			}
		});
	}

	private evaluateThreshold(value: number, threshold: AlertThreshold): boolean {
		switch (threshold.operator) {
			case '>':
				return value > threshold.value;
			case '<':
				return value < threshold.value;
			case '>=':
				return value >= threshold.value;
			case '<=':
				return value <= threshold.value;
			case '==':
				return value === threshold.value;
			case '!=':
				return value !== threshold.value;
			default:
				return false;
		}
	}

	private createAlert(threshold: AlertThreshold, currentValue: number): void {
		const alert: Alert = {
			id: `${threshold.metric}-${Date.now()}`,
			metric: threshold.metric,
			severity: threshold.severity,
			message: `${threshold.metric} is ${currentValue}${threshold.metric.includes('usage') ? '%' : ''} (threshold: ${threshold.value}${threshold.metric.includes('usage') ? '%' : ''})`,
			timestamp: new Date(),
			resolved: false,
		};

		this.alerts.push(alert);
		console.warn(`Alert created: ${alert.message}`);
	}

	getMetricValue(metricName: string): number | undefined {
		return this.metricValues.get(metricName);
	}

	getActiveAlerts(): Alert[] {
		return this.alerts.filter((alert) => !alert.resolved);
	}

	getAllAlerts(): Alert[] {
		return [...this.alerts];
	}

	getMetrics(): Map<string, MetricDefinition> {
		return new Map(this.metrics);
	}

	// Method to record custom metrics (for AI agents, workflows, etc.)
	recordMetric(metricName: string, value: number, labels?: Record<string, string>): void {
		const metric = this.metrics.get(metricName);
		if (!metric) {
			console.warn(`Metric ${metricName} not registered`);
			return;
		}

		if (!this.shouldCollectMetric(metric)) {
			return; // Skip if privacy settings don't allow
		}

		// For simplicity, just store the latest value
		// In production, this would be more sophisticated (histograms, counters, etc.)
		this.metricValues.set(metricName, value);
	}
}

// Singleton instance
let monitoringServiceInstance: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
	if (!monitoringServiceInstance) {
		const privacySettings: PrivacySettings = {
			anonymizeUserData: true,
			retentionDays: 7,
			enableTelemetry: true,
			allowCrossReference: false,
		};

		monitoringServiceInstance = new MonitoringService(privacySettings);
	}

	return monitoringServiceInstance;
}
