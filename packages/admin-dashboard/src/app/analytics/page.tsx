import { AnalyticsCharts } from '@/components/analytics/analytics-charts';
import { AnalyticsInsights } from '@/components/analytics/analytics-insights';
import { AnalyticsOverview } from '@/components/analytics/analytics-overview';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              Comprehensive analytics and insights for your AI platform
            </p>
          </div>
        </div>

        <AnalyticsOverview />
        <AnalyticsCharts />
        <AnalyticsInsights />
      </div>
    </DashboardLayout>
  );
}
