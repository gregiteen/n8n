import { NextRequest, NextResponse } from 'next/server';
import { monitoringSystem, SystemHealthSnapshot } from '@/lib/db';

interface SystemHealthResponse {
	current: SystemHealthSnapshot;
	history: SystemHealthSnapshot[];
}

// Handler for GET requests - Returns current system health
export async function GET(request: NextRequest) {
	try {
		// Get time range filter from query params (default to 24h)
		const { searchParams } = new URL(request.url);
		const timeRange = searchParams.get('timeRange') || '24h';
		const hours = parseInt(timeRange.replace('h', '')) || 24;

		try {
			// Get current system health
			const currentHealth = monitoringSystem.getCurrentHealth();

			// Get health history from database
			const healthHistory = await monitoringSystem.getHealthSnapshots(hours);

			// Format response
			const response: SystemHealthResponse = {
				current: {
					...currentHealth,
					timestamp: currentHealth.timestamp.toISOString(),
				},
				history: healthHistory.map((snapshot) => ({
					...snapshot,
					timestamp: snapshot.timestamp.toISOString(),
				})),
			};

			return NextResponse.json(response);
		} catch (err) {
			console.error('Error getting system health data:', err);
			return NextResponse.json({ error: 'Failed to retrieve system health data' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error fetching system health:', error);
		return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 });
	}
}

// Handler for POST requests - Records a new system health snapshot
export async function POST(request: NextRequest) {
	try {
		// Parse request body
		const healthData = await request.json();

		// Validate required fields
		if (!healthData.cpu || !healthData.memory) {
			return NextResponse.json(
				{ error: 'Missing required fields: cpu and memory are required' },
				{ status: 400 },
			);
		}

		try {
			// Take a snapshot using the monitoring system
			const snapshot = await monitoringSystem.takeHealthSnapshot();

			return NextResponse.json({
				message: 'Health snapshot recorded successfully',
				snapshot: {
					...snapshot,
					timestamp: snapshot.timestamp.toISOString(),
				},
			});
		} catch (dbError) {
			console.error('Database error recording health snapshot:', dbError);
			return NextResponse.json(
				{ error: 'Failed to record health snapshot in database' },
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error('Error recording system health:', error);
		return NextResponse.json({ error: 'Failed to record system health' }, { status: 500 });
	}
}
