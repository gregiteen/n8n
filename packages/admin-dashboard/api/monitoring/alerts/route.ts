import { NextRequest, NextResponse } from 'next/server';

interface Alert {
	id: string;
	metric: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	timestamp: string;
	resolved: boolean;
}

// Mock alerts data - in production, this would come from monitoring service
const mockAlerts: Alert[] = [
	{
		id: 'alert-1',
		metric: 'system.cpu.usage',
		severity: 'medium',
		message: 'CPU usage is high (85%)',
		timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
		resolved: false,
	},
	{
		id: 'alert-2',
		metric: 'ai.requests.latency',
		severity: 'low',
		message: 'AI request latency increased (avg 2.5s)',
		timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
		resolved: false,
	},
	{
		id: 'alert-3',
		metric: 'workflow.executions.count',
		severity: 'high',
		message: 'Workflow execution failure rate above threshold (15%)',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
		resolved: true,
	},
];

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const includeResolved = searchParams.get('includeResolved') === 'true';
		const severity = searchParams.get('severity') as Alert['severity'] | null;

		let alerts = [...mockAlerts];

		// Filter by resolution status
		if (!includeResolved) {
			alerts = alerts.filter((alert) => !alert.resolved);
		}

		// Filter by severity
		if (severity) {
			alerts = alerts.filter((alert) => alert.severity === severity);
		}

		// Sort by timestamp (newest first)
		alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

		return NextResponse.json(alerts);
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
