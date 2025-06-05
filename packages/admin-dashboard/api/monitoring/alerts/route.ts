import { NextRequest, NextResponse } from 'next/server';
import { monitoringSystem, Alert as DbAlert } from '@/lib/db';

interface Alert {
	id: string;
	metric: string;
	severity: 'info' | 'warning' | 'critical';
	message: string;
	timestamp: string;
	status: 'active' | 'acknowledged' | 'resolved';
	acknowledgedBy?: string;
	acknowledgedAt?: string;
	resolvedAt?: string;
}

// Helper function to convert from db alert to API alert
function formatAlert(dbAlert: DbAlert): Alert {
	return {
		id: dbAlert.id,
		metric: dbAlert.relatedMetric || dbAlert.source,
		severity: dbAlert.severity,
		message: dbAlert.title + (dbAlert.description ? ': ' + dbAlert.description : ''),
		timestamp: dbAlert.timestamp.toISOString(),
		status: dbAlert.status,
		acknowledgedBy: dbAlert.acknowledgedBy,
		acknowledgedAt: dbAlert.acknowledgedAt?.toISOString(),
		resolvedAt: dbAlert.resolvedAt?.toISOString(),
	};
}

// Fallback mock alerts if database is unavailable
const fallbackAlerts: Alert[] = [
	{
		id: 'mock-alert-1',
		metric: 'system.cpu.usage',
		severity: 'warning',
		message: 'CPU usage is high (85%)',
		timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		status: 'active',
	},
	{
		id: 'mock-alert-2',
		metric: 'ai.requests.latency',
		severity: 'info',
		message: 'AI request latency increased (avg 2.5s)',
		timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
		status: 'active',
	},
	{
		id: 'mock-alert-3',
		metric: 'workflow.executions.count',
		severity: 'critical',
		message: 'Workflow execution failure rate above threshold (15%)',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		status: 'resolved',
		resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
	},
];

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const includeResolved = searchParams.get('includeResolved') === 'true';
		const severityParam = searchParams.get('severity') as DbAlert['severity'] | null;
		const limit = searchParams.get('limit')
			? parseInt(searchParams.get('limit') as string, 10)
			: 100;

		try {
			// Get alerts from the database
			let dbAlerts: DbAlert[];

			// Convert status and severity params to database format
			const status = !includeResolved ? 'active' : undefined;
			const severity = severityParam || undefined;

			// Define from and to dates (default: last 24 hours)
			const fromDate = new Date();
			fromDate.setHours(fromDate.getHours() - 24);

			// Query alerts from monitoring system
			dbAlerts = await monitoringSystem.db.getAlerts({
				status,
				severity,
				fromDate,
				limit,
			});

			// Convert database alerts to API format
			const alerts = dbAlerts.map(formatAlert);

			// Sort by timestamp (newest first)
			alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

			return NextResponse.json(alerts);
		} catch (dbError) {
			console.error('Database error fetching alerts:', dbError);

			// Fall back to mock data if database call fails
			let alerts = [...fallbackAlerts];

			// Filter by resolution status
			if (!includeResolved) {
				alerts = alerts.filter((alert) => alert.status !== 'resolved');
			}

			// Filter by severity
			if (severityParam) {
				alerts = alerts.filter((alert) => alert.severity === severityParam);
			}

			// Sort by timestamp (newest first)
			alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

			return NextResponse.json(alerts);
		}
	} catch (error) {
		console.error('Error fetching alerts:', error);
		return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const { alertId, resolved } = await request.json();

		if (!alertId || typeof resolved !== 'boolean') {
			return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
		}

		// In production, update the alert in the monitoring service
		const alertIndex = mockAlerts.findIndex((alert) => alert.id === alertId);

		if (alertIndex === -1) {
			return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
		}

		mockAlerts[alertIndex].resolved = resolved;

		return NextResponse.json({
			message: `Alert ${resolved ? 'resolved' : 'reopened'} successfully`,
			alert: mockAlerts[alertIndex],
		});
	} catch (error) {
		console.error('Error updating alert:', error);
		return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
	}
}
