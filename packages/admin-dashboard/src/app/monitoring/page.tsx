import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SystemHealthOverview } from '@/components/monitoring/system-health-overview';
import { MetricsCharts } from '@/components/monitoring/metrics-charts';
import { AlertsPanel } from '@/components/monitoring/alerts-panel';

export default function MonitoringPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
          <p className="mt-2 text-muted-foreground">
            Real-time system health, performance metrics, and alerts
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SystemHealthOverview />
          </div>
          <div className="lg:col-span-1">
            <AlertsPanel />
          </div>
        </div>

        <MetricsCharts />
      </div>
    </DashboardLayout>
  );
}
