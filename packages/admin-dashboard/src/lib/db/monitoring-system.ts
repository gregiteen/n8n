import { getMonitoringService } from '../monitoring-service';
import { SystemHealthMonitor, SystemHealthSnapshot } from './system-health';

interface MonitoringDatabaseClient {
	getSystemHealthSnapshots(hours: number): Promise<SystemHealthSnapshot[]>;
	createSystemHealthSnapshot(snapshot: SystemHealthSnapshot): Promise<SystemHealthSnapshot>;
}

// Mock DB client for development purposes
class MockDatabaseClient implements MonitoringDatabaseClient {
	private snapshots: SystemHealthSnapshot[] = [];

	async getSystemHealthSnapshots(hours: number = 24): Promise<SystemHealthSnapshot[]> {
		const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
		return this.snapshots.filter((snapshot) => snapshot.timestamp > cutoffTime);
	}

	async createSystemHealthSnapshot(snapshot: SystemHealthSnapshot): Promise<SystemHealthSnapshot> {
		const newSnapshot = {
			...snapshot,
			id: `snapshot-${Date.now()}`,
		};

		this.snapshots.push(newSnapshot);

		// Keep only recent snapshots (7 days)
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		this.snapshots = this.snapshots.filter((s) => s.timestamp > sevenDaysAgo);

		return newSnapshot;
	}
}

export class MonitoringSystem {
	private monitoringService = getMonitoringService();
	private systemHealthMonitor: SystemHealthMonitor;
	public db: MonitoringDatabaseClient;
	private collectionInterval?: NodeJS.Timeout;

	constructor(databaseClient?: MonitoringDatabaseClient) {
		this.db = databaseClient || new MockDatabaseClient();
		this.systemHealthMonitor = new SystemHealthMonitor(this.monitoringService);

		// Initialize system health collection
		this.startHealthCollection();
	}

	// Start collecting system health snapshots
	startHealthCollection(intervalMinutes: number = 5): void {
		if (this.collectionInterval) {
			clearInterval(this.collectionInterval);
		}

		// Take initial snapshot
		this.takeHealthSnapshot();

		// Schedule regular snapshots
		this.collectionInterval = setInterval(
			() => {
				this.takeHealthSnapshot();
			},
			intervalMinutes * 60 * 1000,
		);

		console.log(`System health collection started (interval: ${intervalMinutes} minutes)`);
	}

	// Stop collecting system health snapshots
	stopHealthCollection(): void {
		if (this.collectionInterval) {
			clearInterval(this.collectionInterval);
			this.collectionInterval = undefined;
		}

		console.log('System health collection stopped');
	}

	// Take a snapshot and store it in the database
	async takeHealthSnapshot(): Promise<SystemHealthSnapshot> {
		try {
			const snapshot = this.systemHealthMonitor.getCurrentHealth();
			await this.db.createSystemHealthSnapshot(snapshot);
			return snapshot;
		} catch (error) {
			console.error('Error taking system health snapshot:', error);
			throw error;
		}
	}

	// Get current system health
	getCurrentHealth(): SystemHealthSnapshot {
		return this.systemHealthMonitor.getCurrentHealth();
	}

	// Get historical health snapshots
	async getHealthSnapshots(hours: number = 24): Promise<SystemHealthSnapshot[]> {
		return this.db.getSystemHealthSnapshots(hours);
	}

	// Get a metric value from the monitoring service
	getMetricValue(metricName: string): number | undefined {
		return this.monitoringService.getMetricValue(metricName);
	}
}

// Export a singleton instance
export const monitoringSystem = new MonitoringSystem();
